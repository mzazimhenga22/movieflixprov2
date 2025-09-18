// src/server.ts (updated)
// ESM compatibility shim + improved startup/diagnostics
import { createRequire } from "module";
import { fileURLToPath } from "url";
import 'dotenv/config';

// Provide a global `require` for legacy CommonJS modules that expect it.
// This must run before other code attempts to call `require(...)`.
if (typeof (globalThis as any).require === "undefined") {
  (globalThis as any).require = createRequire(import.meta.url);
}

// --- improved uncaught handlers (print full stacks, flush logs) ---
process.on("uncaughtException", (err: any) => {
  try {
    console.error("UNCAUGHT EXCEPTION:", err && (err.stack ?? err));
  } catch (e) {
    console.error("UNCAUGHT EXCEPTION (failed to format):", String(err));
  }
  // give the logging a moment to flush so Render/CI collects the details
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

import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";

// ----- providers import: tolerant of either named exports or a default export object -----
// We import as a namespace and then normalize to support both shapes:
// 1) module with named exports: { makeProviders, makeStandardFetcher, targets, ... }
// 2) module with a default export object: { default: { makeProviders, ... } }
import * as providersModule from '@providers';
const _providersModuleAny = providersModule as any;
const _providersNormalized = (_providersModuleAny && _providersModuleAny.default) ? _providersModuleAny.default : _providersModuleAny;
const { makeProviders, makeStandardFetcher, targets } = _providersNormalized as any;

// other imports
import { fetchImdbIdForMedia } from "./tmdb.js";

// modular route registrars (from files provided earlier)
import { registerPushRoutes } from "./routes/push.js";
import { registerAutoPollsRoutes } from "./routes/autoPolls.js";
import { isInitialized as firebaseIsInitialized } from "./services/firebaseAdmin.js";

// internal poll creation helper (added)
import { createPollIfMissing } from "./services/autoPollsService.js";

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json());

// -------------------- helpers --------------------
function getErrorMessage(e: unknown): string {
  if (!e) return String(e);
  if (e instanceof Error) return e.message;
  try {
    return String(e);
  } catch {
    return "unknown";
  }
}

// helper to extract playable URLs from a provider stream object
function extractUrlsFromStream(stream: any) {
  const out: Array<{ url: string; quality?: string | number; type?: string; headers?: Record<string, string> }> = [];

  if (!stream) return out;

  // HLS-like playlist
  if (typeof stream.playlist === "string" && stream.playlist.length > 0) {
    out.push({
      url: stream.playlist,
      type: stream.type || "hls",
      headers: stream.headers || undefined,
    });
  }

  // File-based qualities map
  if (stream.qualities && typeof stream.qualities === "object") {
    for (const [qual, qObj] of Object.entries(stream.qualities)) {
      if (!qObj) continue;
      if (typeof qObj === "string") {
        out.push({ url: qObj, quality: qual, type: stream.type || "file" });
      } else if (typeof qObj === "object") {
        const qUrl = (qObj as any).url || (qObj as any).file || undefined;
        if (qUrl) {
          out.push({
            url: qUrl,
            quality: qual,
            type: (qObj as any).type || stream.type || "file",
            headers: stream.headers || (qObj as any).headers || undefined,
          });
        }
      }
    }
  }

  // Some providers return stream.url (single-file style) or stream.file
  if (!out.length && (stream.url || stream.file)) {
    const maybeUrl = stream.url || stream.file;
    if (typeof maybeUrl === "string") out.push({ url: maybeUrl, type: stream.type || "file", headers: stream.headers || undefined });
  }

  return out;
}

async function makeProvidersInstance(fetchApi: typeof fetch) {
  const fetcher = makeStandardFetcher(fetchApi);
  return makeProviders({ fetcher, target: targets.ANY }) as any;
}

// -------------------- register modular routes (wrapped) --------------------
// Wrap route registration so we can log synchronous errors during require/registration.
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

// -------------------- internal create-poll endpoint (added) --------------------
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

// -------------------- media-links route (unchanged logic) --------------------
app.post("/media-links", async (req: Request, res: Response) => {
  const {
    type,
    tmdbId,
    title,
    releaseYear,
    seasonNumber,
    episodeNumber,
    seasonTmdbId,
    episodeTmdbId,
  } = req.body as any;

  if (!type || !tmdbId) {
    return res.status(400).json({ error: "Missing required fields: type and tmdbId" });
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

    const providers: any = await makeProvidersInstance(fetch);

    const fast = await providers.runAll({ media: media as any });
    console.log("fast runAll output:", fast);

    let rawSources: any = [];
    try {
      rawSources = typeof providers.listSources === "function" ? providers.listSources() : [];
    } catch (e) {
      console.warn("providers.listSources() threw:", e);
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
          const embedResult = await providers.runEmbedScraper({ id: embedId, url: embedUrl, media: media as any });

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
    });
  } catch (err: any) {
    console.error("Exception in /media-links:", err && (err.stack ?? err));
    return res.status(500).json({ error: "Scraping failed", details: err?.message ?? String(err) });
  }
});

// -------------------- health --------------------
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    ok: true,
    firebaseInitialized: firebaseIsInitialized(),
  });
});

// -------------------- serverless handler + start behavior --------------------
export async function handler(req: any, res: any) {
  return (app as any)(req, res);
}

// ESM-safe entrypoint detection
const __filename = fileURLToPath(import.meta.url);
const entryArg = process.argv && process.argv[1] ? path.resolve(process.argv[1]) : undefined;
const isMain = entryArg ? path.resolve(entryArg) === path.resolve(__filename) : false;

if (isMain) {
  const host = process.env.HOST || "0.0.0.0";
  const port = Number(process.env.PORT || 3000);

  // wrap listen call to catch synchronous startup errors as well
  try {
    app.listen(port, host, () => {
      console.log(`Media-links API listening at http://${host}:${port}/media-links`);
    });
  } catch (e: any) {
    console.error("[startup] app.listen threw:", e && (e.stack ?? e));
    setTimeout(() => process.exit(1), 200);
  }
} else {
  console.log("Server module imported — running in serverless/hosted mode (no local listen)");
}
