/**
 * Register /auto-polls/generate and /auto-polls/close routes.
 * Uses the autoPolls service functions.
 */
import { Application, Request, Response } from "express";
import { requireAdmin } from "../middleware/auth.js";
import {
  computeRange,
  fetchFeedsInRange,
  computeUserScoresFromFeedDocs,
  getUsername,
  createPollIfMissing,
  closeExpiredPolls
} from "../services/autoPollsService.js";
import { getErrorMessage } from "../utils/misc.js";

export function registerAutoPollsRoutes(app: Application) {
  app.post('/auto-polls/generate', requireAdmin, async (req: Request, res: Response) => {
    try {
      const body = req.body || {};

      // kinds to generate (defaults to all)
      const kinds: Array<'daily'|'weekly'|'monthly'> =
        Array.isArray(body.kinds) && body.kinds.length
          ? body.kinds.map(String).map((s: string) => s as 'daily'|'weekly'|'monthly')
          : ['daily','weekly','monthly'];

      // rolling window or calendar previous period.
      // either provided per-request (body.rolling) or via env POLL_USE_ROLLING (string '1' or 'true')
      const rollingRequested = typeof body.rolling === 'boolean' ? body.rolling : (String(process.env.POLL_USE_ROLLING || '') === '1' || String(process.env.POLL_USE_ROLLING || '').toLowerCase() === 'true');

      // optional overrides
      const overrideTopN = typeof body.topN === 'number' && body.topN > 0 ? Number(body.topN) : undefined;
      const overridePollDuration = typeof body.pollDurationHours === 'number' && body.pollDurationHours > 0 ? Number(body.pollDurationHours) : undefined;
      const forceCreate = !!body.force;

      const created: string[] = [];

      for (const kind of kinds) {
        try {
          // compute range: supports rolling vs calendar previous
          const range = computeRange(kind, rollingRequested);

          const maxFeeds = Number(process.env.POLL_MAX_FEEDS || 2000);
          const feeds = await fetchFeedsInRange(range.startIso, range.endIso, maxFeeds);
          if (!feeds || feeds.length === 0) {
            console.log(`[auto-polls] no feeds for ${kind} in ${range.startIso}..${range.endIso}`);
            continue;
          }

          const scored = computeUserScoresFromFeedDocs(feeds);
          if (!scored || scored.length === 0) continue;

          const topN = overrideTopN ?? Number(process.env.POLL_TOP_N || 2);
          const top = scored.slice(0, topN);

          const options: {id:string,label:string,score:number}[] = [];
          for (const u of top) {
            const label = await getUsername(u.uid);
            options.push({ id: u.uid, label, score: Number(u.score) });
          }

          if (options.length === 0) {
            console.log(`[auto-polls] no top options computed for ${kind}`);
            continue;
          }

          const title = kind === 'daily' ? 'User of the day' : kind === 'weekly' ? 'User of the week' : 'User of the month';
          const question = kind === 'daily' ? 'Who was the best on MovieFlix today?' : kind === 'weekly' ? 'Who was the best on MovieFlix this week?' : 'Who was the best on MovieFlix this month?';

          try {
            const createOpts: { force?: boolean; pollDurationHours?: number } = {};
            if (forceCreate) createOpts.force = true;
            if (overridePollDuration) createOpts.pollDurationHours = overridePollDuration;

            const id = await createPollIfMissing(`user_of_${kind}`, range.startIso, range.endIso, options, title, question, createOpts);
            created.push(id);
            console.log(`[auto-polls] created poll ${id} for ${kind} range ${range.startIso}..${range.endIso} (rolling=${rollingRequested})`);
          } catch (e:any) {
            // preserve 'already-created-for-range' control flow while allowing force override
            if (e && (e.message === 'already-created-for-range' || String(e) === 'already-created-for-range')) {
              console.log(`[auto-polls] poll already created for ${kind} range ${range.startIso}..${range.endIso}`);
            } else {
              console.error(`[auto-polls] failed to create poll for ${kind}:`, getErrorMessage(e));
            }
          }
        } catch (e) {
          console.error('[auto-polls] generate error for kind', kind, getErrorMessage(e));
        }
      }

      return res.json({ ok:true, created });
    } catch (e) {
      console.error('[auto-polls] generate endpoint error:', getErrorMessage(e));
      return res.status(500).json({ ok:false, error: getErrorMessage(e) });
    }
  });

  app.post('/auto-polls/close', requireAdmin, async (_req: Request, res: Response) => {
    try {
      const result = await closeExpiredPolls();
      return res.json({ ok:true, result });
    } catch (e) {
      console.error('[auto-polls] close endpoint error:', getErrorMessage(e));
      return res.status(500).json({ ok:false, error: getErrorMessage(e) });
    }
  });

  // Optional scheduler while server runs
  if (process.env.AUTO_POLLS_SCHEDULE === '1' && typeof setInterval === 'function') {
    console.log('[auto-polls] AUTO_POLLS_SCHEDULE=1 enabled: scheduling periodic close every 5 minutes');
    setInterval(async () => {
      try {
        await closeExpiredPolls();
      } catch (e) {
        console.warn('[auto-polls] scheduled close failed:', getErrorMessage(e));
      }
    }, 5 * 60 * 1000);
  }
}
