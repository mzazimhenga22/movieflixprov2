import { flags } from '@/entrypoint/utils/targets';
import { makeSourcerer, SourcererEmbed } from '@/providers/base'; // ✅ Import the correct type
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';

const backendUrl = 'https://backend.vidnest.fun';

const servers = ['hollymoviehd', 'allmovies', 'flixhq', 'official'];

async function scrape(ctx: MovieScrapeContext | ShowScrapeContext, type: 'movie' | 'tv') {
  // ✅ Explicitly type the array so .push() accepts the correct objects
  const embeds: SourcererEmbed[] = [];

  for (const server of servers) {
    let url = '';
    if (type === 'movie') {
      url = `${backendUrl}/${server}/movie/${ctx.media.tmdbId}`;
    } else if (ctx.media.type === 'show') {
      url = `${backendUrl}/${server}/tv/${ctx.media.tmdbId}/${ctx.media.season.number}/${ctx.media.episode.number}`;
    }

    embeds.push({
      embedId: `vidnest-${server}`,
      url,
    });
  }

  return {
    embeds,
  };
}

const vidnestScraper = makeSourcerer({
  id: 'vidnest',
  name: 'Vidnest',
  rank: 130,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: (ctx: MovieScrapeContext) => scrape(ctx, 'movie'),
  scrapeShow: (ctx: ShowScrapeContext) => scrape(ctx, 'tv'),
});

export default vidnestScraper;
