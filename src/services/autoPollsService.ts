/**
 * Auto-polls service extracted from your code, extended with:
 *  - scheduled generator + closer with leader election (Firestore lock)
 *
 * Exposes:
 *   - computeRange, fetchFeedsInRange, computeUserScoresFromFeedDocs,
 *     getUsername, createPollIfMissing, closeExpiredPolls
 *   - startAutoPollsScheduler(options?) -> starts background scheduling (idempotent)
 *
 * Requires firebaseAdmin to be initialized (getAdmin(), isInitialized()).
 */

import { getAdmin, isInitialized } from "./firebaseAdmin.js";
import { getErrorMessage } from "../utils/misc.js";
import type { firestore as FirebaseFirestore } from "firebase-admin";
import os from "os";

const POLL_DURATION_HOURS = Number(process.env.POLL_DURATION_HOURS || 24);
const DEFAULT_TOP_N = Number(process.env.POLL_TOP_N || 2);

const WEIGHTS = {
  likes: Number(process.env.POLL_WEIGHT_LIKES || 1.0),
  comments: Number(process.env.POLL_WEIGHT_COMMENTS || 2.0),
  retweets: Number(process.env.POLL_WEIGHT_RETWEETS || 1.5),
  posts: Number(process.env.POLL_WEIGHT_POSTS || 0.75),
};

function errMsg(e: any) {
  if (!e) return String(e);
  if (e instanceof Error) return e.message;
  try { return String(e); } catch { return "unknown"; }
}

/* ----------------------------
   Poll kinds helpers (type-safe)
   ---------------------------- */
const ALLOWED_KINDS = ["daily", "weekly", "monthly"] as const;
type PollKind = (typeof ALLOWED_KINDS)[number];

function isPollKind(v: string): v is PollKind {
  return (ALLOWED_KINDS as readonly string[]).includes(v);
}

function parseKindsEnv(): PollKind[] {
  const raw = process.env.AUTO_POLLS_GENERATE_KINDS;
  if (!raw) return ["daily", "weekly", "monthly"];
  return String(raw)
    .split(",")
    .map(s => s.trim())
    .filter(Boolean)
    .filter(isPollKind);
}

export function computeRange(kind: PollKind, rolling = false) {
  // If rolling=true: use last 24h/7d/30d relative to now.
  // If rolling=false: previous calendar period (same as earlier behavior).
  const now = new Date();
  const nowUtc = new Date(Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
    now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()
  ));

  if (rolling) {
    if (kind === 'daily') {
      const end = new Date();
      const start = new Date(end.getTime() - 24 * 3600 * 1000);
      return { startIso: start.toISOString(), endIso: end.toISOString() };
    } else if (kind === 'weekly') {
      const end = new Date();
      const start = new Date(end.getTime() - 7 * 24 * 3600 * 1000);
      return { startIso: start.toISOString(), endIso: end.toISOString() };
    } else {
      const end = new Date();
      const start = new Date(end.getTime() - 30 * 24 * 3600 * 1000);
      return { startIso: start.toISOString(), endIso: end.toISOString() };
    }
  }

  // calendar-based (previous full day/week/month) — original behavior
  if (kind === 'daily') {
    const y = new Date(Date.UTC(nowUtc.getUTCFullYear(), nowUtc.getUTCMonth(), nowUtc.getUTCDate()));
    const start = new Date(y.getTime() - 24 * 3600 * 1000); // yesterday 00:00
    const s = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate(), 0,0,0));
    const e = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate(), 23,59,59));
    return { startIso: s.toISOString(), endIso: e.toISOString() };
  } else if (kind === 'weekly') {
    const weekday = nowUtc.getUTCDay(); // 0=Sun..6
    const daysSinceMonday = (weekday + 6) % 7;
    const startOfCurrentWeek = new Date(Date.UTC(nowUtc.getUTCFullYear(), nowUtc.getUTCMonth(), nowUtc.getUTCDate() - daysSinceMonday, 0,0,0));
    const lastWeekStart = new Date(startOfCurrentWeek.getTime() - 7 * 24 * 3600 * 1000);
    const lastWeekEnd = new Date(lastWeekStart.getTime() + (6 * 24*3600*1000) + (23*3600 + 59*60 + 59)*1000);
    return { startIso: new Date(Date.UTC(lastWeekStart.getUTCFullYear(), lastWeekStart.getUTCMonth(), lastWeekStart.getUTCDate(), 0,0,0)).toISOString(), endIso: lastWeekEnd.toISOString() };
  } else {
    const startOfThisMonth = new Date(Date.UTC(nowUtc.getUTCFullYear(), nowUtc.getUTCMonth(), 1, 0,0,0));
    const lastMonthEnd = new Date(startOfThisMonth.getTime() - 1000);
    const lastMonthStart = new Date(Date.UTC(lastMonthEnd.getUTCFullYear(), lastMonthEnd.getUTCMonth(), 1, 0,0,0));
    const lastMonthEndMax = new Date(Date.UTC(lastMonthEnd.getUTCFullYear(), lastMonthEnd.getUTCMonth(), lastMonthEnd.getUTCDate(), 23,59,59));
    return { startIso: lastMonthStart.toISOString(), endIso: lastMonthEndMax.toISOString() };
  }
}

export async function fetchFeedsInRange(startIso: string, endIso: string, maxDocs = 2000) {
  if (!isInitialized()) {
    throw new Error("Firestore not initialized");
  }
  const admin: any = getAdmin();
  const db = admin.firestore();

  try {
    const q = db
      .collection("feeds")
      .where("timestamp", ">=", startIso)
      .where("timestamp", "<=", endIso);

    const snap = await q.get();
    return snap.docs;
  } catch (err) {
    // fallback: order & limit then client-side filter
    const snap = await db
      .collection("feeds")
      .orderBy("timestamp", "desc")
      .limit(maxDocs)
      .get();

    return snap.docs.filter((d: FirebaseFirestore.QueryDocumentSnapshot) => {
      try {
        const raw = (d.data() || {})["timestamp"];
        if (!raw) return false;
        if (typeof raw === "string") return raw >= startIso && raw <= endIso;
        if (typeof raw === "number") {
          const s = new Date(startIso).getTime();
          const e = new Date(endIso).getTime();
          return raw >= s && raw <= e;
        }
        if (raw && typeof raw.toDate === "function") {
          const t = raw.toDate().toISOString();
          return t >= startIso && t <= endIso;
        }
        const t = String(raw);
        return t >= startIso && t <= endIso;
      } catch {
        return false;
      }
    });
  }
}

export function computeUserScoresFromFeedDocs(feedDocs: FirebaseFirestore.QueryDocumentSnapshot[]) {
  const map: Record<string, { posts:number, likes:number, comments:number, retweets:number }> = {};
  for (const doc of feedDocs) {
    const d = doc.data() as any || {};
    const uid = (d.userId || d.user || '') + '';
    if (!uid) continue;
    if (!map[uid]) map[uid] = { posts:0, likes:0, comments:0, retweets:0 };
    map[uid].posts += 1;
    const likedBy = Array.isArray(d.likedBy) ? d.likedBy.length : 0;
    map[uid].likes += likedBy;
    const commentsCount = Number(d.commentsCount || 0);
    map[uid].comments += commentsCount;
    const retweetCount = Number(d.retweetCount || d.retweets || 0);
    map[uid].retweets += retweetCount;
  }
  const arr = Object.keys(map).map(uid => {
    const m = map[uid];
    const score = (m.likes * WEIGHTS.likes) + (m.comments * WEIGHTS.comments) + (m.retweets * WEIGHTS.retweets) + (m.posts * WEIGHTS.posts);
    return { uid, ...m, score };
  });
  arr.sort((a,b) => b.score - a.score);
  return arr;
}

export async function getUsername(uid: string) {
  try {
    if (!isInitialized()) return uid;
    const admin: any = getAdmin();
    const doc = await admin.firestore().collection('users').doc(uid).get();
    if (!doc.exists) return uid;
    const d = doc.data() || {};
    return (d.username || d.displayName || d.email || uid) + '';
  } catch (e) {
    return uid;
  }
}

export async function createPollIfMissing(
    category: string,
    startIso: string,
    endIso: string,
    options: { id: string; label: string; score?: number }[],
    title: string,
    question: string,
    createOpts?: { force?: boolean; pollDurationHours?: number } // <-- NEW optional param
  ) {
    if (!isInitialized()) throw new Error("Firestore not initialized");
    const admin: any = getAdmin();
    const db = admin.firestore();
    const lockRef = db.collection('polls_locks').doc(category);
    const pollRef = db.collection('polls').doc();
  
    // compute end time using override if provided
    const durationHours = typeof createOpts?.pollDurationHours === "number" && createOpts.pollDurationHours > 0
      ? Number(createOpts.pollDurationHours)
      : POLL_DURATION_HOURS;
  
    await db.runTransaction(async (tx: FirebaseFirestore.Transaction) => {
      const lockSnap = (await tx.get(lockRef)) as unknown as FirebaseFirestore.DocumentSnapshot<any>;
      if (lockSnap.exists) {
        const data = lockSnap.data() as any || {};
  
        // If a poll for this source range already exists, preserve control flow unless force=true
        if (String(data.lastSourceStart || '') === startIso && !createOpts?.force) {
          throw new Error('already-created-for-range');
        }
      }
  
      const payload = {
        title,
        question,
        category,
        active: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        start: new Date().toISOString(),
        end: new Date(Date.now() + durationHours * 3600 * 1000).toISOString(),
        options: options.map(o => ({ id: o.id, label: o.label, score: Number(o.score || 0) })),
        votes: {},
      };
  
      // create new poll doc
      tx.set(pollRef, payload);
  
      // update lock doc to reflect the poll we just created (overwrites/merges)
      tx.set(lockRef, {
        lastSourceStart: startIso,
        lastSourceEnd: endIso,
        lastCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastPollId: pollRef.id
      }, { merge: true });
    });
  
    return pollRef.id;
  }
  

export async function closeExpiredPolls() {
  if (!isInitialized()) throw new Error("Firestore not initialized");
  const admin: any = getAdmin();
  const db = admin.firestore();
  const nowIso = new Date().toISOString();
  const q = db.collection('polls').where('active', '==', true).where('end', '<=', nowIso);
  const snap = await q.get();
  if (snap.empty) return { closed: 0 };
  let closed = 0;
  for (const doc of snap.docs) {
    const pollRef = doc.ref;
    try {
      await db.runTransaction(async (tx: FirebaseFirestore.Transaction) => {
        const fresh = (await tx.get(pollRef)) as unknown as FirebaseFirestore.DocumentSnapshot<any>;
        const data = (fresh.data() as any) || {};

        if (!data.active) return;
        const votes = data.votes && typeof data.votes === 'object' ? data.votes : {};
        let winnerOptionId: string | null = null;
        if (Object.keys(votes).length > 0) {
          const counts: Record<string, number> = {};
          for (const [uid, opt] of Object.entries(votes)) {
            const oid = String(opt || '');
            if (!oid) continue;
            counts[oid] = (counts[oid] || 0) + 1;
          }
          const options = (data.options || []).slice();
          let bestOpt: string | null = null;
          let bestCount = -1;
          let bestScore = -1;
          for (const opt of options) {
            const id = String(opt.id || '');
            const cnt = counts[id] || 0;
            const sc = Number(opt.score || 0);
            if (cnt > bestCount || (cnt === bestCount && sc > bestScore)) {
              bestOpt = id;
              bestCount = cnt;
              bestScore = sc;
            }
          }
          winnerOptionId = bestOpt;
        } else {
          const options = (data.options || []).slice();
          if (options.length > 0) {
            options.sort((a:any,b:any) => Number(b.score||0) - Number(a.score||0));
            winnerOptionId = String(options[0].id || null);
          }
        }
        await tx.update(pollRef, {
          active: false,
          closedAt: admin.firestore.FieldValue.serverTimestamp(),
          winnerOptionId: winnerOptionId || null
        });
      });
      closed++;
    } catch (e) {
      if (String(e) === 'already-created-for-range') {
        // ignore
      } else {
        console.error('[auto-polls] failed closing poll', doc.id, errMsg(e));
      }
    }
  }
  return { closed };
}

/* ----------------------------
   Scheduling + leader election
   ---------------------------- */

let schedulerStarted = false;

/**
 * Try to acquire a leader lock in Firestore so a single instance performs generate jobs.
 * Returns true if acquired.
 */
async function tryAcquireLeaderLock(db: FirebaseFirestore.Firestore, ownerId: string, ttlMs: number) {
  const lockRef = db.collection("service_locks").doc("auto_polls_leader");
  const now = Date.now();
  const expiresAt = now + ttlMs;

  try {
    return await db.runTransaction(async (tx) => {
      const snap = await tx.get(lockRef);
      if (!snap.exists) {
        tx.set(lockRef, { ownerId, expiresAt });
        return true;
      }
      const data = snap.data() as any;
      const existingExpires = Number(data?.expiresAt || 0);
      const existingOwner = String(data?.ownerId || "");
      if (!existingOwner || existingExpires < now) {
        tx.set(lockRef, { ownerId, expiresAt }, { merge: true });
        return true;
      }
      // someone else is leader
      return existingOwner === ownerId;
    });
  } catch (e) {
    console.warn("[auto-polls] tryAcquireLeaderLock transaction failed:", getErrorMessage(e));
    return false;
  }
}

/**
 * Refresh lock only if we already own it.
 */
async function refreshLeaderLock(db: FirebaseFirestore.Firestore, ownerId: string, ttlMs: number) {
  const lockRef = db.collection("service_locks").doc("auto_polls_leader");
  const now = Date.now();
  const expiresAt = now + ttlMs;

  try {
    return await db.runTransaction(async (tx) => {
      const snap = await tx.get(lockRef);
      if (!snap.exists) return false;
      const data = snap.data() as any;
      const existingOwner = String(data?.ownerId || "");
      if (existingOwner === ownerId) {
        tx.update(lockRef, { expiresAt });
        return true;
      }
      return false;
    });
  } catch (e) {
    if (process.env.DEBUG) console.warn("[auto-polls] refreshLeaderLock failed:", getErrorMessage(e));
    return false;
  }
}

/**
 * Release lock if we own it (best-effort).
 */
async function releaseLeaderLock(db: FirebaseFirestore.Firestore, ownerId: string) {
  const lockRef = db.collection("service_locks").doc("auto_polls_leader");
  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(lockRef);
      if (!snap.exists) return;
      const data = snap.data() as any;
      const existingOwner = String(data?.ownerId || "");
      if (existingOwner === ownerId) {
        tx.delete(lockRef);
      }
    });
  } catch (e) {
    if (process.env.DEBUG) console.warn("[auto-polls] releaseLeaderLock failed:", getErrorMessage(e));
  }
}

/**
 * Start background scheduler.
 * - safe to call multiple times (will only start once).
 * - in multi-instance deployments only the leader runs generation; closing can run on any instance.
 */
export async function startAutoPollsScheduler() {
  if (schedulerStarted) return;
  schedulerStarted = true;

  if (String(process.env.AUTO_POLLS_SCHEDULE) !== "1") {
    if (process.env.DEBUG) console.log("[auto-polls] AUTO_POLLS_SCHEDULE != 1 -> scheduler disabled");
    return;
  }

  if (!isInitialized()) {
    console.warn("[auto-polls] firestore not initialized - scheduler will not start");
    return;
  }

  const admin: any = getAdmin();
  const db: FirebaseFirestore.Firestore = admin.firestore();

  // owner id for this process (to hold leader lock)
  const ownerId = `${os.hostname()}:${process.pid}:${Math.random().toString(36).slice(2,8)}`;

  const leaderTtlMin = Math.max(1, Number(process.env.AUTO_POLLS_LEADER_TTL_MINUTES || 10));
  const leaderTtlMs = leaderTtlMin * 60 * 1000;

  const closeIntervalMin = Math.max(1, Number(process.env.AUTO_POLLS_CLOSE_INTERVAL_MINUTES || 5));
  const closeIntervalMs = closeIntervalMin * 60 * 1000;

  const generateMode = String(process.env.AUTO_POLLS_GENERATE_MODE || "daily"); // 'daily'|'interval'
  const generateIntervalMin = Math.max(1, Number(process.env.AUTO_POLLS_GENERATE_INTERVAL_MINUTES || 60));
  const dailyHour = Math.max(0, Math.min(23, Number(process.env.AUTO_POLLS_GENERATE_DAILY_HOUR || 0)));
  const dailyMin = Math.max(0, Math.min(59, Number(process.env.AUTO_POLLS_GENERATE_DAILY_MIN || 5)));

  let leaderRefreshHandle: NodeJS.Timeout | null = null;

  // helper to try become leader and keep refreshing lock while leader
  const ensureLeader = async () => {
    try {
      const ok = await tryAcquireLeaderLock(db, ownerId, leaderTtlMs);
      if (ok) {
        if (!leaderRefreshHandle) {
          // refresh periodically at half the TTL
          leaderRefreshHandle = setInterval(async () => {
            try {
              const refreshed = await refreshLeaderLock(db, ownerId, leaderTtlMs);
              if (!refreshed) {
                // lost leadership
                if (leaderRefreshHandle) {
                  clearInterval(leaderRefreshHandle);
                  leaderRefreshHandle = null;
                }
              }
            } catch (e) {
              if (process.env.DEBUG) console.warn("[auto-polls] leader refresh error:", getErrorMessage(e));
            }
          }, Math.max(1000, Math.floor(leaderTtlMs / 2)));
        }
        return true;
      } else {
        // not leader
        return false;
      }
    } catch (e) {
      if (process.env.DEBUG) console.warn("[auto-polls] ensureLeader error:", getErrorMessage(e));
      return false;
    }
  };

  // close job (can be safely executed by many instances)
  const runCloseJob = async () => {
    try {
      const result = await closeExpiredPolls();
      if (process.env.DEBUG) console.log(`[auto-polls] scheduled closeExpiredPolls ->`, result);
    } catch (e) {
      console.error("[auto-polls] scheduled closeExpiredPolls failed:", errMsg(e));
    }
  };

  // generate job (only leader should run)
  const runGenerateJob = async (opts?: {
    kinds?: PollKind[],
    rolling?: boolean,
    topN?: number,
    pollDurationHours?: number,
    force?: boolean
  }) => {
    const kinds = opts?.kinds ?? ["daily","weekly","monthly"];
    const rolling = !!opts?.rolling;
    const topN = Number(opts?.topN ?? DEFAULT_TOP_N);
    const pollDurationHours = Number(opts?.pollDurationHours ?? POLL_DURATION_HOURS);
    const force = !!opts?.force;

    try {
      const isLeader = await ensureLeader();
      if (!isLeader) {
        if (process.env.DEBUG) console.log("[auto-polls] skipping generate (not leader)");
        return;
      }

      for (const kind of kinds) {
        try {
          const range = computeRange(kind, rolling);
          const feeds = await fetchFeedsInRange(range.startIso, range.endIso, Number(process.env.POLL_MAX_FEEDS || 2000));
          if (!feeds || feeds.length === 0) {
            if (process.env.DEBUG) console.log(`[auto-polls] no feeds for ${kind} in ${range.startIso}..${range.endIso}`);
            continue;
          }
          const scored = computeUserScoresFromFeedDocs(feeds);
          if (!scored || scored.length === 0) continue;
          const top = scored.slice(0, topN);
          const options: {id:string,label:string,score:number}[] = [];
          for (const u of top) {
            const label = await getUsername(u.uid);
            options.push({ id: u.uid, label, score: Number(u.score) });
          }
          const title = kind === 'daily' ? 'User of the day' : kind === 'weekly' ? 'User of the week' : 'User of the month';
          const question = kind === 'daily' ? 'Who was the best on MovieFlix today?' : kind === 'weekly' ? 'Who was the best on MovieFlix this week?' : 'Who was the best on MovieFlix this month?';
          try {
            if (force) {
              // If forced, bypass the lock by directly creating (still keep polls_locks unique check in createPollIfMissing)
              // Simpler: attempt createPollIfMissing and swallow 'already-created-for-range' only if force=false.
              try {
                const id = await createPollIfMissing(`user_of_${kind}`, range.startIso, range.endIso, options, title, question);
                if (process.env.DEBUG) console.log(`[auto-polls] (forced?) created poll ${id} for ${kind}`);
              } catch (e:any) {
                if (String(e.message || e) === 'already-created-for-range') {
                  if (process.env.DEBUG) console.log(`[auto-polls] poll already created for ${kind} range`);
                } else {
                  console.error(`[auto-polls] failed to create poll for ${kind}:`, errMsg(e));
                }
              }
            } else {
              const id = await createPollIfMissing(`user_of_${kind}`, range.startIso, range.endIso, options, title, question);
              if (process.env.DEBUG) console.log(`[auto-polls] created poll ${id} for ${kind}`);
            }
          } catch (e:any) {
            if (String(e.message || e) === 'already-created-for-range') {
              if (process.env.DEBUG) console.log(`[auto-polls] poll already created for ${kind} range`);
            } else {
              console.error(`[auto-polls] failed to create poll for ${kind}:`, errMsg(e));
            }
          }
        } catch (e) {
          console.error('[auto-polls] generate error for kind', kind, errMsg(e));
        }
      }
    } catch (e) {
      console.error("[auto-polls] runGenerateJob failed:", errMsg(e));
    }
  };

  // schedule close job (every closeIntervalMs)
  try {
    setInterval(() => {
      runCloseJob().catch((e) => console.error("[auto-polls] scheduled close failed:", errMsg(e)));
    }, closeIntervalMs);
    // run one immediately on start
    runCloseJob().catch(() => {});
  } catch (e) {
    console.warn("[auto-polls] failed to schedule close job:", getErrorMessage(e));
  }

  // schedule generate job depending on mode
  if (generateMode === "interval") {
    const genIntervalMs = Math.max(60, Number(process.env.AUTO_POLLS_GENERATE_INTERVAL_MINUTES || generateIntervalMin)) * 60 * 1000;
    setInterval(async () => {
      try {
        // call defaults (kinds from env or default)
        const kindsEnv = parseKindsEnv();
        const rolling = String(process.env.AUTO_POLLS_GENERATE_ROLLING || "false") === "true";
        const topN = Number(process.env.AUTO_POLLS_GENERATE_TOPN || DEFAULT_TOP_N);
        const pollDurationHours = Number(process.env.AUTO_POLLS_GENERATE_DURATION_HOURS || POLL_DURATION_HOURS);
        const force = String(process.env.AUTO_POLLS_GENERATE_FORCE || "false") === "true";
        await runGenerateJob({ kinds: kindsEnv, rolling, topN, pollDurationHours, force });
      } catch (e) {
        console.error("[auto-polls] interval generate failed:", errMsg(e));
      }
    }, genIntervalMs);

    // run immediate attempt on startup
    runGenerateJob().catch(() => {});
    console.log(`[auto-polls] scheduled generate job every ${Math.round(genIntervalMs/60000)} minutes (mode=interval)`);
  } else {
    // daily mode — run at configured UTC hour/min
    const scheduleDaily = async () => {
      try {
        const now = new Date();
        const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), dailyHour, dailyMin, 0, 0));
        if (next.getTime() <= now.getTime()) {
          // if time already passed today, schedule for tomorrow
          next.setUTCDate(next.getUTCDate() + 1);
        }
        const delay = next.getTime() - now.getTime();
        setTimeout(async function tick() {
          try {
            // run generator (with env-derived options)
            const kindsEnv = parseKindsEnv();
            const rolling = String(process.env.AUTO_POLLS_GENERATE_ROLLING || "false") === "true";
            const topN = Number(process.env.AUTO_POLLS_GENERATE_TOPN || DEFAULT_TOP_N);
            const pollDurationHours = Number(process.env.AUTO_POLLS_GENERATE_DURATION_HOURS || POLL_DURATION_HOURS);
            const force = String(process.env.AUTO_POLLS_GENERATE_FORCE || "false") === "true";
            await runGenerateJob({ kinds: kindsEnv, rolling, topN, pollDurationHours, force });
          } catch (e) {
            console.error("[auto-polls] daily generate run failed:", errMsg(e));
          } finally {
            // schedule next day
            setTimeout(tick, 24 * 3600 * 1000);
          }
        }, delay);
        console.log(`[auto-polls] scheduled daily generate at ${String(dailyHour).padStart(2,"0")}:${String(dailyMin).padStart(2,"0")} UTC`);
      } catch (e) {
        console.warn("[auto-polls] scheduleDaily setup failed:", getErrorMessage(e));
      }
    };

    scheduleDaily().catch((e) => console.warn("[auto-polls] scheduleDaily failed:", getErrorMessage(e)));
    // immediate attempt on startup if you want (optional)
    if (String(process.env.AUTO_POLLS_GENERATE_RUN_ON_STARTUP || "0") === "1") {
      runGenerateJob().catch((e) => console.warn("[auto-polls] startup generate failed:", getErrorMessage(e)));
    }
  }

  // try to acquire leader immediately
  try {
    await ensureLeader();
  } catch (e) {
    if (process.env.DEBUG) console.warn("[auto-polls] initial ensureLeader failed:", getErrorMessage(e));
  }

  // On process exit, attempt to release leader
  const cleanup = async () => {
    try {
      await releaseLeaderLock(db, ownerId);
    } catch (_) {}
    try { if (leaderRefreshHandle) clearInterval(leaderRefreshHandle); } catch (_) {}
  };
  process.on("exit", cleanup);
  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
}
