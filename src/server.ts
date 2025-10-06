// src/server.ts
import { createRequire } from "module";
import { fileURLToPath } from "url";
import 'dotenv/config';
import express, { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import stream from "stream";
import { promisify } from "util";

import { fetchImdbIdForMedia } from "./tmdb.js";
import { registerPushRoutes } from "./routes/push.js";
import { registerAutoPollsRoutes } from "./routes/autoPolls.js";
import { isInitialized as firebaseIsInitialized } from "./services/firebaseAdmin.js";
import { createPollIfMissing } from "./services/autoPollsService.js";

// movieflix providers
import { makeProviders, makeStandardFetcher, targets } from "@movieflix/providers";

const pipeline = promisify(stream.pipeline);
if (typeof (globalThis as any).require === "undefined") {
  (globalThis as any).require = createRequire(import.meta.url);
}

/* ================= Configuration ================= */
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";

const ALLOW_PROXY_HOSTS = (process.env.ALLOW_PROXY_HOSTS || "").split(",").map(s => s.trim()).filter(Boolean);
const PROXY_REWRITE_HEADERS = (() => {
  try {
    if (!process.env.PROXY_REWRITE_HEADERS) return {};
    return JSON.parse(process.env.PROXY_REWRITE_HEADERS);
  } catch {
    return {};
  }
})();
const PROXY_READ_PROTECTED_HEADERS = (process.env.PROXY_READ_PROTECTED_HEADERS || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
const PROXY_WRITE_PROTECTED_HEADERS = (process.env.PROXY_WRITE_PROTECTED_HEADERS || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
const DISABLE_CACHE = (process.env.DISABLE_CACHE || "false").toLowerCase() === "true";
const CACHE_MAX_ITEMS = Number(process.env.CACHE_MAX_ITEMS || 1000);
const CACHE_TTL_SECONDS = Number(process.env.CACHE_TTL_SECONDS || 3600);
const TURNSTILE_ENABLED = (process.env.TURNSTILE_ENABLED || "false").toLowerCase() === "true";
const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET || "";
const PROXY_ALLOW_CORS = (process.env.PROXY_ALLOW_CORS || "true").toLowerCase() === "true";
const PROXY_URL = (process.env.PROXY_URL || "").trim(); // e.g. https://your.proxy.workers.dev

const app = express();
app.use(express.json({ limit: "1mb", strict: false }));

function getErrorMessage(e: unknown): string {
  if (!e) return String(e);
  if (e instanceof Error) return e.message;
  try {
    return String(e);
  } catch {
    return "unknown";
  }
}

/* ========== Simple Type for a Fetcher ==========
   The providers expect a function like (input, init) => Promise<Response>
================================================= */
type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

/* ========== makeSimpleProxyFetcher ==========
   Signature requested:
     function makeSimpleProxyFetcher(proxyUrl: string, fetchApi: typeof fetch): Fetcher;

   Behavior:
   - Encodes the target URL (base64) and calls `${proxyUrl.replace(/\/$/,'')}/fetch?url=<base64>`
   - Forwards method, headers and body where possible.
   - Prevents proxy-looping: if a target URL already points to proxyUrl, uses raw fetchApi.
================================================= */
export function makeSimpleProxyFetcher(proxyUrl: string, fetchApi: typeof fetch): any {
  if (!proxyUrl) throw new Error("proxyUrl required");
  const base = proxyUrl.replace(/\/$/, "");
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<any> => {
    // normalize input to string targetUrl
    let targetUrl: string;
    if (typeof input === "string") targetUrl = input;
    else if (input instanceof URL) targetUrl = input.toString();
    else if ((input as any).url) targetUrl = (input as any).url;
    else targetUrl = String(input);

    // If targetUrl already points to our proxy, avoid proxy loop
    try {
      const t = new URL(targetUrl);
      const p = new URL(base);
      if (t.host === p.host && t.protocol === p.protocol) {
        return fetchApi(input as any, init as any);
      }
    } catch {
      // if URL parse fails, continue and attempt to proxy
    }

    // encode target URL (base64) and build proxied url
    const encoded = Buffer.from(targetUrl).toString("base64");
    const proxiedUrl = `${base}/fetch?url=${encodeURIComponent(encoded)}`;

    // Forward method, headers, body as best effort
    const upstreamInit: RequestInit = {
      method: init?.method || "GET",
      headers: init?.headers ? init.headers : undefined,
      // keep redirect handling
      redirect: (init && (init as any).redirect) || "follow",
      body: init && (init as any).body ? (init as any).body : undefined,
    };

    // Call fetchApi to hit the proxy endpoint
    return fetchApi(proxiedUrl, upstreamInit);
  };
}

/* ---------------- Utilities ---------------- */
function isHostAllowed(urlStr: string): boolean {
  try {
    const u = new URL(urlStr);
    if (!ALLOW_PROXY_HOSTS.length) return true;
    for (const pattern of ALLOW_PROXY_HOSTS) {
      if (!pattern) continue;
      if (pattern.startsWith("/") && pattern.endsWith("/")) {
        const regex = new RegExp(pattern.slice(1, -1));
        if (regex.test(u.hostname)) return true;
      } else {
        if (pattern.startsWith("*.")) {
          const domain = pattern.slice(2);
          if (u.hostname === domain || u.hostname.endsWith(`.${domain}`)) return true;
        }
        if (u.hostname === pattern) return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

/* ---------------- In-memory segment cache ---------------- */
type CacheItem = { data: Buffer; expiresAt: number; url: string };
class SimpleCache {
  map: Map<string, CacheItem>;
  order: string[];
  max: number;
  ttl: number;
  constructor(max = CACHE_MAX_ITEMS, ttl = CACHE_TTL_SECONDS) {
    this.map = new Map();
    this.order = [];
    this.max = max;
    this.ttl = ttl;
    if (DISABLE_CACHE) { this.max = 0; }
  }
  get(key: string): Buffer | null {
    if (this.max === 0) return null;
    const it = this.map.get(key);
    if (!it) return null;
    if (Date.now() > it.expiresAt) {
      this.delete(key);
      return null;
    }
    return it.data;
  }
  set(key: string, data: Buffer) {
    if (this.max === 0) return;
    if (this.map.has(key)) {
      const it = this.map.get(key)!;
      it.expiresAt = Date.now() + this.ttl * 1000;
      it.data = data;
      return;
    }
    const item: CacheItem = { data, expiresAt: Date.now() + this.ttl * 1000, url: key };
    this.map.set(key, item);
    this.order.push(key);
    if (this.map.size > this.max) {
      const oldest = this.order.shift();
      if (oldest) this.map.delete(oldest);
    }
  }
  delete(key: string) {
    if (!this.map.has(key)) return;
    this.map.delete(key);
    this.order = this.order.filter(k => k !== key);
  }
  clear() {
    this.map.clear();
    this.order = [];
  }
}
const segmentCache = new SimpleCache();

/* ---------------- Turnstile middleware ---------------- */
async function verifyTurnstileToken(token: string, remoteIp?: string): Promise<boolean> {
  if (!TURNSTILE_SECRET) return false;
  try {
    const form = new URLSearchParams();
    form.append("secret", TURNSTILE_SECRET);
    form.append("response", token);
    if (remoteIp) form.append("remoteip", remoteIp);
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
    const json = await r.json();
    return !!json.success;
  } catch (e) {
    console.warn("[turnstile] verify error:", getErrorMessage(e));
    return false;
  }
}
async function turnstileMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!TURNSTILE_ENABLED) return next();
  const token = (req.headers["cf-turnstile-response"] || req.headers["turnstile-token"] || req.query.turnstile) as string | undefined;
  if (!token) {
    return res.status(403).json({ error: "missing-turnstile-token" });
  }
  const ok = await verifyTurnstileToken(token, (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || undefined);
  if (!ok) return res.status(403).json({ error: "turnstile-failed" });
  return next();
}

/* ---------------- Proxy endpoints ---------------- */
app.use("/proxy", turnstileMiddleware);

app.options(/^\/proxy\/(.*)$/, (_req: Request, res: Response) => {
  // preflight: always allow if enabled
  if (PROXY_ALLOW_CORS) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Range");
    res.status(204).send("");
  } else {
    res.status(204).send("");
  }
});

async function proxyFetchHandler(req: Request, res: Response) {
  try {
    const urlParam = (req.query.url as string) || (req.params[0] ? decodeURIComponent(req.params[0]) : undefined);
    if (!urlParam) {
      return res.status(400).json({ error: "missing url parameter" });
    }
    let targetUrl = urlParam;
    if (!/^https?:\/\//i.test(targetUrl)) {
      try {
        const decoded = Buffer.from(targetUrl, "base64").toString("utf8");
        if (/^https?:\/\//i.test(decoded)) targetUrl = decoded;
      } catch {}
    }
    if (!isHostAllowed(targetUrl)) {
      return res.status(403).json({ error: "target-host-not-allowed" });
    }

    const upstreamHeaders: Record<string, string> = {};
    const copyHeaderNames = ["user-agent", "referer", "accept", "range", "if-modified-since", "accept-encoding"];
    for (const h of copyHeaderNames) {
      const v = (req.headers[h] as string | undefined);
      if (v && !PROXY_WRITE_PROTECTED_HEADERS.includes(h)) upstreamHeaders[h] = v;
    }
    for (const k of Object.keys(PROXY_REWRITE_HEADERS)) {
      upstreamHeaders[k.toLowerCase()] = String(PROXY_REWRITE_HEADERS[k]);
    }

    const method = (req.method || "GET").toUpperCase();
    const body = (method === "GET" || method === "HEAD") ? undefined : req.body;

    const isSegment = /\.(ts|aac|m4s|mp4|webvtt|vtt|mp3|m4a)(\?.*)?$/i.test(targetUrl);
    if (isSegment && !DISABLE_CACHE) {
      const cached = segmentCache.get(targetUrl);
      if (cached) {
        if (PROXY_ALLOW_CORS) res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Content-Length", String(cached.length));
        res.setHeader("Content-Type", "application/octet-stream");
        return res.status(200).send(cached);
      }
    }

    const upstreamInit: any = {
      method,
      headers: upstreamHeaders,
      redirect: "follow",
    };
    if (body && typeof body === "object" && !(body instanceof Buffer)) upstreamInit.body = JSON.stringify(body);
    else if (body instanceof Buffer) upstreamInit.body = body;
    else if (typeof body === "string") upstreamInit.body = body;

    const upstreamRes = await fetch(targetUrl, upstreamInit);

    res.status(upstreamRes.status);

    const hopByHop = new Set([
      "connection", "keep-alive", "proxy-authenticate", "proxy-authorization", "te", "trailers", "transfer-encoding", "upgrade"
    ]);
    upstreamRes.headers.forEach((v, k) => {
      const lk = k.toLowerCase();
      if (hopByHop.has(lk)) return;
      if (PROXY_READ_PROTECTED_HEADERS.length && !PROXY_READ_PROTECTED_HEADERS.includes(lk)) {
        return;
      }
      if (lk === "set-cookie" && !PROXY_READ_PROTECTED_HEADERS.includes("set-cookie")) return;
      res.setHeader(k, v);
    });

    if (PROXY_ALLOW_CORS) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Expose-Headers", (PROXY_READ_PROTECTED_HEADERS.join(", ") || "content-range, content-type, content-length"));
    }

    const contentType = upstreamRes.headers.get("content-type") || "";

    if (/application\/vnd\.apple\.mpegurl|application\/x-mpegurl|ext-m3u|text\/plain|application\/octet-stream|.*\.m3u8/i.test(contentType) ||
        /\.m3u8(\?.*)?$/i.test(targetUrl)) {
      const text = await upstreamRes.text();
      const lines = text.split(/\r?\n/);
      const outLines: string[] = [];
      for (let line of lines) {
        if (!line || line.startsWith("#")) {
          outLines.push(line);
          continue;
        }
        let absolute = line;
        try {
          absolute = new URL(line, targetUrl).toString();
        } catch {}
        const encoded = Buffer.from(absolute).toString("base64");
        const proxied = `${req.baseUrl.replace(/\/$/, "")}/fetch?url=${encodeURIComponent(encoded)}`;
        outLines.push(proxied);
      }
      const rewritten = outLines.join("\n");
      res.setHeader("content-type", "application/vnd.apple.mpegurl; charset=utf-8");
      return res.send(rewritten);
    }

    const isBinary = upstreamRes.headers.get("content-type")?.startsWith("video/") ||
                     /\.(ts|m4s|mp4|aac|m3u8|bin|webm|m3u8)$/i.test(targetUrl) ||
                     upstreamRes.body !== null;

    if (isBinary && upstreamRes.body) {
      if (isSegment && !DISABLE_CACHE) {
        const buffer = await upstreamRes.arrayBuffer();
        const buf = Buffer.from(buffer);
        segmentCache.set(targetUrl, buf);
        return res.send(buf);
      } else {
        try {
          // Node fetch bodies often have pipe
          // @ts-ignore
          if (upstreamRes.body.pipe) {
            // @ts-ignore
            return pipeline(upstreamRes.body, res).catch((err) => {
              console.warn("[proxy] pipeline error:", err);
            });
          }
          const arr = await upstreamRes.arrayBuffer();
          return res.send(Buffer.from(arr));
        } catch (e) {
          const txt = await upstreamRes.text();
          return res.send(txt);
        }
      }
    } else {
      const text = await upstreamRes.text();
      const isJsonLike = (() => {
        try {
          JSON.parse(text);
          return true;
        } catch { return false; }
      })();
      if (isJsonLike) res.setHeader("content-type", "application/json; charset=utf-8");
      return res.send(text);
    }
  } catch (e: any) {
    console.error("[proxy] error:", getErrorMessage(e));
    return (res as any).status(502).json({ error: "upstream-proxy-failed", details: getErrorMessage(e) });
  }
}
app.get("/proxy/fetch", proxyFetchHandler);
app.all(/^\/proxy\/(.*)$/, async (req: Request, res: Response) => {
  // req.params[0] contains the capture from the RegExp (everything after /proxy/)
  const after = (req.params as any)[0] || "";
  if (after && /^https?:/i.test(after)) {
    const decoded = decodeURIComponent(after);
    // set the query so proxyFetchHandler can use it
    (req as any).query = { ...(req as any).query, url: decoded };
    return proxyFetchHandler(req, res);
  }
  // if no path URL, return a small helper JSON
  res.json({ ok: true, note: "proxy endpoint - use /proxy/fetch?url=<url|base64>", turnstile: TURNSTILE_ENABLED ? "enabled" : "disabled" });
});

/* ---------------- existing media-links & other logic ---------------- */
type ChromiumInfo = {
  puppeteerInstalled: boolean;
  executablePath: string | null;
  launchOk: boolean | null;
  launchError: string | null;
  checkedAt?: string | null;
};

let _chromiumInfo: ChromiumInfo = {
  puppeteerInstalled: false,
  executablePath: null,
  launchOk: null,
  launchError: null,
  checkedAt: null,
};

async function initChromiumDetection() {
  _chromiumInfo.checkedAt = new Date().toISOString();
  const commonPaths = [
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
    "/usr/bin/headless-shell",
    "/snap/bin/chromium",
    "/usr/local/bin/chromium",
  ];
  try {
    let puppeteer: any = null;
    try {
      const requireFn = (globalThis as any).require ?? createRequire(import.meta.url);
      puppeteer = await requireFn("puppeteer");
      _chromiumInfo.puppeteerInstalled = true;
    } catch (e) {
      _chromiumInfo.puppeteerInstalled = false;
      _chromiumInfo.launchOk = null;
      _chromiumInfo.launchError = "puppeteer not installed";
      console.warn("[chromium-detect] puppeteer not installed:", _chromiumInfo.launchError);
      return;
    }

    for (const p of commonPaths) {
      try {
        if (fs.existsSync(p)) {
          _chromiumInfo.executablePath = p;
          process.env.PUPPETEER_EXECUTABLE_PATH = p;
          console.log(`[chromium-detect] found chromium executable at ${p} and set PUPPETEER_EXECUTABLE_PATH`);
          break;
        }
      } catch {}
    }

    try {
      const pupp = (puppeteer && puppeteer.default) ? puppeteer.default : puppeteer;
      const launchOpts: any = {
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
        headless: true,
      };
      if (_chromiumInfo.executablePath) launchOpts.executablePath = _chromiumInfo.executablePath;
      const browser = await pupp.launch(launchOpts);
      try {
        const ver = await browser.version();
        console.log("[chromium-detect] puppeteer launched browser:", ver);
      } catch {}
      await browser.close();
      _chromiumInfo.launchOk = true;
      _chromiumInfo.launchError = null;
    } catch (err: any) {
      _chromiumInfo.launchOk = false;
      _chromiumInfo.launchError = String(err && (err.stack ?? err));
      console.warn("[chromium-detect] puppeteer launch failed:", _chromiumInfo.launchError);
    }
  } catch (err: any) {
    _chromiumInfo.launchOk = false;
    _chromiumInfo.launchError = String(err && (err.stack ?? err));
    console.warn("[chromium-detect] detection failed:", _chromiumInfo.launchError);
  }
}
const _chromiumInitPromise = initChromiumDetection().catch((e) => {
  console.warn("[chromium-detect] initChromiumDetection threw:", e && (e.stack ?? e));
});

try {
  registerPushRoutes(app);
} catch (e: any) {
  console.error("[startup] registerPushRoutes failed:", e && (e.stack ?? e));
}
try {
  registerAutoPollsRoutes(app);
} catch (e: any) {
  console.error("[startup] registerAutoPollsRoutes failed:", e && (e.stack ?? e));
}

/* --- internal create-poll endpoint --- */
const INTERNAL_API_TOKEN = process.env.INTERNAL_API_TOKEN || "dev-token";
app.post("/internal/create-poll", async (req: Request, res: Response) => {
  try {
    const token = (req.headers["x-internal-token"] || req.headers["internal-token"] || "") as string;
    if (token !== INTERNAL_API_TOKEN) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const {
      category,
      startIso,
      endIso,
      options,
      title,
      question,
      force,
      pollDurationHours,
    } = req.body || {};

    if (!category || !startIso || !endIso || !Array.isArray(options) || !title || !question) {
      return res.status(400).json({ error: "missing required fields: category, startIso, endIso, options, title, question" });
    }

    const opts = options.map((o: any) => ({ id: String(o.id || ""), label: String(o.label || ""), score: Number(o.score || 0) }));

    const id = await createPollIfMissing(
      String(category),
      String(startIso),
      String(endIso),
      opts,
      String(title),
      String(question),
      { force: !!force, pollDurationHours: typeof pollDurationHours === "number" ? Number(pollDurationHours) : undefined }
    );

    return res.json({ id });
  } catch (e: any) {
    if (String(e.message || e) === "already-created-for-range") {
      return res.status(409).json({ error: "already-created-for-range" });
    }
    console.error("[internal/create-poll] error:", e && (e.stack ?? e));
    return res.status(500).json({ error: String(e.message || e) });
  }
});

/* -------------------- media-links route (defensive parsing) -------------------- */
app.post("/media-links", async (req: Request, res: Response) => {
  let rawBody: any = req.body;

  console.log("[/media-links] headers:", req.headers ? {
    "content-type": req.headers["content-type"],
    "content-length": req.headers["content-length"],
  } : {});
  console.log("[/media-links] typeof req.body:", typeof rawBody);

  if (typeof rawBody === "string") {
    try {
      rawBody = rawBody.length ? JSON.parse(rawBody) : {};
    } catch (e) {
      console.warn("[/media-links] req.body is a string but not valid JSON, continuing with empty body");
      rawBody = {};
    }
  }
  const body = rawBody || {};

  const {
    type,
    tmdbId,
    title,
    releaseYear,
    seasonNumber,
    episodeNumber,
    seasonTmdbId,
    episodeTmdbId,
  } = body as any;

  if (!type || !tmdbId) {
    return res.status(400).json({ error: "Missing required fields: type and tmdbId", receivedBody: body });
  }

  const safeTitle = typeof title === "string" ? title : "";

  const media: any =
    type === "movie"
      ? { type: "movie", tmdbId: String(tmdbId), title: safeTitle, releaseYear: releaseYear ? Number(releaseYear) : undefined }
      : {
          type: "show",
          tmdbId: String(tmdbId),
          title: safeTitle,
          releaseYear: releaseYear ? Number(releaseYear) : undefined,
          season: { number: Number(seasonNumber), tmdbId: seasonTmdbId ? String(seasonTmdbId) : undefined },
          episode: { number: Number(episodeNumber), tmdbId: episodeTmdbId ? String(episodeTmdbId) : undefined },
        };

  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    cwd: process.cwd(),
    nodeVersion: process.version,
    runAllError: null as any,
    listSourcesOutput: null as any,
    chromium: null as any,
  };

  try {
    try {
      const imdb = await fetchImdbIdForMedia(media);
      if (imdb) {
        media.imdbId = imdb;
        console.log("Enriched media with imdbId:", imdb);
      } else {
        console.log("No imdb id found for media (TMDB lookup returned none).");
      }
    } catch (e) {
      console.warn("TMDB enrichment failed:", getErrorMessage(e));
    }

    try {
      await Promise.race([_chromiumInitPromise, new Promise((r) => setTimeout(r, 400))]);
    } catch {}

    diagnostics.chromium = _chromiumInfo;

    // --- provider instantiation using proxiedFetcher when PROXY_URL is set ---
    const fetcher = makeStandardFetcher(fetch) as unknown as Fetcher;
    const proxiedFetcher: Fetcher | undefined = PROXY_URL ? makeSimpleProxyFetcher(PROXY_URL, fetch) : undefined;
    // makeProviders may accept proxiedFetcher - pass it when available
    const providers = makeProviders({ fetcher, proxiedFetcher, target: targets.ANY } as any);

    let fast: any = null;
    try {
      if (typeof providers.runAll !== "function") {
        throw new Error("providers.runAll is not a function");
      }
      // prefer proxiedFetcher when providers support proxied requests internally; providers will use the fetcher/proxiedFetcher as appropriate
      fast = await providers.runAll({ media: media as any });
      console.log("fast runAll output:", fast);
    } catch (err: any) {
      diagnostics.runAllError = {
        name: err?.name ?? null,
        message: err?.message ?? String(err),
        stack: err?.stack ?? String(err),
      };
      console.error("[providers-debug] providers.runAll failed:", diagnostics.runAllError);
    }

    let rawSources: any = [];
    try {
      rawSources = typeof providers.listSources === "function" ? providers.listSources() : [];
      diagnostics.listSourcesOutput = rawSources;
    } catch (e) {
      diagnostics.listSourcesOutput = { error: String(e && (e.stack ?? e)) };
      console.warn("providers.listSources() threw:", diagnostics.listSourcesOutput);
      rawSources = [];
    }

    console.log("raw listSources output:", rawSources);

    let sourceIds: string[] = [];
    if (Array.isArray(rawSources)) {
      sourceIds = rawSources
        .map((s) => {
          if (typeof s === "string") return s;
          if (!s) return undefined;
          return s.id || s.sourceId || s.name || undefined;
        })
        .filter(Boolean) as string[];
    } else if (rawSources && typeof rawSources === "object") {
      sourceIds = Object.keys(rawSources);
    }

    console.log("normalized sourceIds:", sourceIds);

    const allStreams: Array<{ sourceId: string; streamRaw: any; extractedUrls: Array<any> }> = [];
    const allEmbeds: Array<{ sourceId: string; embeds: any[] }> = [];

    function extractUrlsFromStream(streamObj: any) {
      const out: Array<{ url: string; quality?: string | number; type?: string; headers?: Record<string, string> }> = [];
      if (!streamObj) return out;
      if (typeof streamObj.playlist === "string" && streamObj.playlist.length > 0) {
        out.push({ url: streamObj.playlist, type: streamObj.type || "hls", headers: streamObj.headers || undefined });
      }
      if (streamObj.qualities && typeof streamObj.qualities === "object") {
        for (const [qual, qObj] of Object.entries(streamObj.qualities)) {
          if (!qObj) continue;
          if (typeof qObj === "string") out.push({ url: qObj, quality: qual, type: streamObj.type || "file" });
          else if (typeof qObj === "object") {
            const qUrl = (qObj as any).url || (qObj as any).file || undefined;
            if (qUrl) out.push({ url: qUrl, quality: qual, type: (qObj as any).type || streamObj.type || "file", headers: streamObj.headers || (qObj as any).headers || undefined });
          }
        }
      }
      if (!out.length && (streamObj.url || streamObj.file)) {
        const maybeUrl = streamObj.url || streamObj.file;
        if (typeof maybeUrl === "string") out.push({ url: maybeUrl, type: streamObj.type || "file", headers: streamObj.headers || undefined });
      }
      return out;
    }

    for (const id of sourceIds) {
      try {
        const result = await providers.runSourceScraper({ id, media: media as any });
        console.log(`source ${id} result:`, result && (result.stream ? "has stream" : result.embeds ? "has embeds" : "empty"));
        if (!result) continue;
        if (result.stream) {
          if (Array.isArray(result.stream)) {
            for (const s of result.stream) {
              const urls = extractUrlsFromStream(s);
              allStreams.push({ sourceId: id, streamRaw: s, extractedUrls: urls });
            }
          } else {
            const urls = extractUrlsFromStream(result.stream);
            allStreams.push({ sourceId: id, streamRaw: result.stream, extractedUrls: urls });
          }
        }
        if (result.embeds && Array.isArray(result.embeds) && result.embeds.length > 0) {
          allEmbeds.push({ sourceId: id, embeds: result.embeds });
        }
      } catch (err: any) {
        console.warn(`source ${String(id)} failed:`, err?.message ?? String(err));
      }
    }

    const resolvedEmbedStreams: Array<{ sourceId: string; embedId: string; streamRaw: any; extractedUrls: Array<any> }> = [];

    for (const entry of allEmbeds) {
      const sId = entry.sourceId;
      for (const embed of entry.embeds) {
        const embedId = embed.embedId || embed.id || embed.embed_id || embed.embed;
        const embedUrl = embed.url || embed.link || embed.path;
        if (!embedId || !embedUrl) {
          console.warn(`Skipping embed (missing id/url) from ${sId}:`, embed);
          continue;
        }
        try {
          const embedResult = await providers.runEmbedScraper({ id: embedId, url: embedUrl });
          if (!embedResult) {
            console.log(`embed ${embedId} returned no result`);
            continue;
          }
          if (embedResult.stream) {
            if (Array.isArray(embedResult.stream)) {
              for (const s of embedResult.stream) {
                const urls = extractUrlsFromStream(s);
                resolvedEmbedStreams.push({ sourceId: sId, embedId, streamRaw: s, extractedUrls: urls });
              }
            } else {
              const urls = extractUrlsFromStream(embedResult.stream);
              resolvedEmbedStreams.push({ sourceId: sId, embedId, streamRaw: embedResult.stream, extractedUrls: urls });
            }
          } else {
            console.log(`embed ${embedId} did not return streams (maybe it returned embeds)`);
          }
        } catch (err: any) {
          console.warn(`embed ${embedId} resolution failed:`, err?.message ?? String(err));
        }
      }
    }

    let fastExtracted: Array<any> = [];
    if (fast && fast.stream) {
      if (Array.isArray(fast.stream)) {
        for (const s of fast.stream) fastExtracted.push(...extractUrlsFromStream(s));
      } else {
        fastExtracted = extractUrlsFromStream(fast.stream);
      }
    }

    for (const r of resolvedEmbedStreams) {
      allStreams.push({ sourceId: `${r.sourceId}/embed-${r.embedId}`, streamRaw: r.streamRaw, extractedUrls: r.extractedUrls });
    }

    return res.json({
      fast,
      fastUrls: fastExtracted,
      allStreams,
      allEmbeds,
      resolvedEmbedStreams,
      diagnostics: { note: "no error", ...diagnostics },
    });
  } catch (err: any) {
    console.error("Exception in /media-links:", err && (err.stack ?? err));
    return res.status(500).json({
      error: "Scraping failed",
      details: err?.message ?? String(err),
      diagnostics: diagnostics,
    });
  }
});

/* -------------------- health endpoint -------------------- */
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    ok: true,
    firebaseInitialized: firebaseIsInitialized(),
    proxy: {
      allowCors: PROXY_ALLOW_CORS,
      turnstileEnabled: TURNSTILE_ENABLED,
      cacheEnabled: !DISABLE_CACHE,
      cacheItems: segmentCache ? (segmentCache.map.size) : 0,
      proxiedFetcher: !!PROXY_URL
    }
  });
});

/* -------------------- process-level handlers & startup -------------------- */
process.on("uncaughtException", (err: any) => {
  try {
    console.error("UNCAUGHT EXCEPTION:", err && (err.stack ?? err));
  } catch (e) {
    console.error("UNCAUGHT EXCEPTION (failed to format):", String(err));
  }
  setTimeout(() => process.exit(1), 200);
});

process.on("unhandledRejection", (reason: any) => {
  try {
    console.error("UNHANDLED REJECTION:", reason && (reason.stack ?? reason));
  } catch (e) {
    console.error("UNHANDLED REJECTION (failed to format):", String(reason));
  }
  setTimeout(() => process.exit(1), 200);
});

/* Serverless handler for hosting environments that import the module */
export async function handler(req: any, res: any) {
  return (app as any)(req, res);
}

/* If run directly, listen */
const __filename = fileURLToPath(import.meta.url);
const entryArg = process.argv && process.argv[1] ? path.resolve(process.argv[1]) : undefined;
const isMain = entryArg ? path.resolve(entryArg) === path.resolve(__filename) : false;

if (isMain) {
  try {
    app.listen(PORT, HOST, () => {
      console.log(`Media-links + proxy API listening at http://${HOST}:${PORT}/`);
      console.log(`Proxy fetch endpoint: GET /proxy/fetch?url=<url-or-base64>`);
      if (PROXY_URL) console.log(`Providers proxied fetch enabled -> ${PROXY_URL}`);
    });
  } catch (e: any) {
    console.error("[startup] app.listen threw:", e && (e.stack ?? e));
    setTimeout(() => process.exit(1), 200);
  }
} else {
  console.log("Server module imported — running in serverless/hosted mode (no local listen)");
}
