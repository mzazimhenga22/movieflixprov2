// src/tmdb.ts
import dotenv from "dotenv";
dotenv.config();

const TMDB_KEY = process.env.TMDB_API_KEY;
if (!TMDB_KEY) {
  // we don't throw here to allow running without TMDB in dev; caller can decide
  console.warn("Warning: TMDB_API_KEY not set — IMDB lookup will be skipped.");
}

/**
 * Fetch imdb id from TMDB for a movie or an episode.
 * - For movies: uses /movie/{id}/external_ids
 * - For TV episodes: uses /tv/{tvId}/season/{seasonNumber}/episode/{episodeNumber}/external_ids
 *
 * Returns imdb_id string (e.g. "tt0123456") or undefined.
 */
export async function fetchImdbIdForMedia(media: {
  type: "movie" | "show";
  tmdbId: string;
  season?: { number: number; tmdbId?: string };
  episode?: { number: number; tmdbId?: string };
}): Promise<string | undefined> {
  if (!TMDB_KEY) return undefined;

  try {
    if (media.type === "movie") {
      const url = `https://api.themoviedb.org/3/movie/${encodeURIComponent(
        media.tmdbId
      )}/external_ids?api_key=${TMDB_KEY}`;
      const r = await fetch(url);
      if (!r.ok) {
        console.warn("TMDB movie external_ids fetch failed:", r.status, await r.text());
        return undefined;
      }
      const j = await r.json();
      return j?.imdb_id || undefined;
    } else {
      // show — try episode-level external_ids if season/episode provided
      if (media.season && typeof media.season.number === "number" && media.episode && typeof media.episode.number === "number") {
        const url = `https://api.themoviedb.org/3/tv/${encodeURIComponent(
          media.tmdbId
        )}/season/${media.season.number}/episode/${media.episode.number}/external_ids?api_key=${TMDB_KEY}`;
        const r = await fetch(url);
        if (r.ok) {
          const j = await r.json();
          if (j?.imdb_id) return j.imdb_id;
        } else {
          // If episode fetch fails, fall back to show-level external_ids
          console.warn("TMDB episode external_ids fetch failed:", r.status);
        }
      }

      // fallback: show-level external ids
      const url = `https://api.themoviedb.org/3/tv/${encodeURIComponent(media.tmdbId)}/external_ids?api_key=${TMDB_KEY}`;
      const r = await fetch(url);
      if (!r.ok) {
        console.warn("TMDB tv external_ids fetch failed:", r.status, await r.text());
        return undefined;
      }
      const j = await r.json();
      return j?.imdb_id || undefined;
    }
  } catch (err) {
    console.warn("TMDB fetch error:", (err as Error).message);
    return undefined;
  }
}
