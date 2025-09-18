import { flags } from '@/entrypoint/utils/targets';
import { SourcererEmbed, SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';

// const baseUrl = atob('aHR0cHM6Ly9jaW5lbWFvcy12My52ZXJjZWwuYXBwLw==');

const CINEMAOS_SERVERS = [
  //   'flowcast',
  'shadow',
  'asiacloud',
  //   'hindicast',
  //   'anime',
  //   'animez',
  //   'guard',
  //   'hq',
  //   'ninja',
  //   'alpha',
  //   'kaze',
  //   'zenith',
  //   'cast',
  //   'ghost',
  //   'halo',
  //   'kinoecho',
  //   'ee3',
  //   'volt',
  //   'putafilme',
  'ophim',
  //   'kage',
];

async function comboScraper(
  ctx: ShowScrapeContext | MovieScrapeContext,
): Promise<SourcererOutput> {
  // ✅ give embeds a concrete type
  const embeds: SourcererEmbed[] = [];

  const query: Record<string, unknown> = {
    type: ctx.media.type,
    tmdbId: ctx.media.tmdbId,
  };

  if (ctx.media.type === 'show') {
    query.season = ctx.media.season.number;
    query.episode = ctx.media.episode.number;
  }

  // V3 Embeds
  for (const server of CINEMAOS_SERVERS) {
    embeds.push({
      embedId: `cinemaos-${server}`,
      url: JSON.stringify({ ...query, service: server }),
    });
  }

  ctx.progress(50);

  return { embeds };
}

export const cinemaosScraper = makeSourcerer({
  id: 'cinemaos',
  name: 'CinemaOS',
  rank: 149,
  disabled: true,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
