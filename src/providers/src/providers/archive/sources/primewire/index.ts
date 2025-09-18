import { load } from 'cheerio';

import { flags } from '@/entrypoint/utils/targets';
import { makeSourcerer } from '@/providers/base';
import { ScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

import { primewireApiKey, primewireBase } from './common';
import { getLinks } from './decryption/blowfish';

/** A single embed item returned by this scraper */
interface PrimewireEmbed {
  url: string;
  embedId: string;
}

async function search(ctx: ScrapeContext, imdbId: string): Promise<string> {
  const searchResult = await ctx.proxiedFetcher<{ id: string }>('/api/v1/show/', {
    baseUrl: primewireBase,
    query: {
      key: primewireApiKey,
      imdb_id: imdbId,
    },
  });

  return searchResult.id;
}

/**
 * Extract all stream embeds from the Primewire HTML page.
 */
async function getStreams(titleHtml: string): Promise<PrimewireEmbed[]> {
  const titlePage = load(titleHtml);
  const userData = titlePage('#user-data').attr('v');
  if (!userData) throw new NotFoundError('No user data found');

  const links = getLinks(userData);
  if (!links) throw new NotFoundError('No links found');

  const embeds: PrimewireEmbed[] = [];

  for (const linkKey in links) {
    // get the correct element for this link
    const element = titlePage(`.propper-link[link_version='${linkKey}']`);
    const sourceName = element
      .parent()
      .parent()
      .parent()
      .find('.version-host')
      .text()
      .trim();

    // map host name to a known embedId
    let embedId: string | null = null;
    switch (sourceName) {
      case 'mixdrop.co':
        embedId = 'mixdrop';
        break;
      case 'voe.sx':
        embedId = 'voe';
        break;
      case 'upstream.to':
        embedId = 'upstream';
        break;
      case 'streamvid.net':
        embedId = 'streamvid';
        break;
      case 'dood.watch':
        embedId = 'dood';
        break;
      case 'dropload.io':
        embedId = 'dropload';
        break;
      case 'filelions.to':
        embedId = 'filelions';
        break;
      case 'vtube.to':
        embedId = 'vtube';
        break;
      default:
        embedId = null;
    }

    if (!embedId) continue;

    embeds.push({
      url: `${primewireBase}/links/go/${links[linkKey]}`,
      embedId,
    });
  }

  return embeds;
}

export const primewireScraper = makeSourcerer({
  id: 'primewire',
  name: 'Primewire',
  rank: 10,
  disabled: true,
  flags: [flags.CORS_ALLOWED],

  async scrapeMovie(ctx) {
    if (!ctx.media.imdbId) throw new Error('No imdbId provided');
    const searchResult = await search(ctx, ctx.media.imdbId);

    const titleHtml = await ctx.proxiedFetcher<string>(`movie/${searchResult}`, {
      baseUrl: primewireBase,
    });

    const embeds = await getStreams(titleHtml);
    return { embeds };
  },

  async scrapeShow(ctx) {
    if (!ctx.media.imdbId) throw new Error('No imdbId provided');
    const searchResult = await search(ctx, ctx.media.imdbId);

    const seasonHtml = await ctx.proxiedFetcher<string>(`tv/${searchResult}`, {
      baseUrl: primewireBase,
    });

    const seasonPage = load(seasonHtml);

    const episodeLink = seasonPage(
      `.show_season[data-id='${ctx.media.season.number}'] > div > a`,
    )
      .toArray()
      .find((lnk) =>
        lnk.attribs.href.includes(`-episode-${ctx.media.episode.number}`),
      )?.attribs.href;

    if (!episodeLink) throw new NotFoundError('No episode links found');

    const titleHtml = await ctx.proxiedFetcher<string>(episodeLink, {
      baseUrl: primewireBase,
    });

    const embeds = await getStreams(titleHtml);
    return { embeds };
  },
});
