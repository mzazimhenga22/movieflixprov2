"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tugaflixScraper = void 0;
const cheerio_1 = require("cheerio");
const targets_1 = require("../../../entrypoint/utils/targets");
const base_1 = require("../../../providers/base");
const compare_1 = require("../../../utils/compare");
const errors_1 = require("../../../utils/errors");
const common_1 = require("./common");
exports.tugaflixScraper = (0, base_1.makeSourcerer)({
    id: 'tugaflix',
    name: 'Tugaflix',
    rank: 70,
    flags: [targets_1.flags.IP_LOCKED],
    scrapeMovie: async (ctx) => {
        const searchResults = (0, common_1.parseSearch)(await ctx.proxiedFetcher('/filmes/', {
            baseUrl: common_1.baseUrl,
            query: {
                s: ctx.media.title,
            },
        }));
        if (searchResults.length === 0)
            throw new errors_1.NotFoundError('No watchable item found');
        const url = searchResults.find((x) => x && (0, compare_1.compareMedia)(ctx.media, x.title, x.year))?.url;
        if (!url)
            throw new errors_1.NotFoundError('No watchable item found');
        ctx.progress(50);
        const videoPage = await ctx.proxiedFetcher(url, {
            method: 'POST',
            body: new URLSearchParams({ play: '' }),
        });
        const $ = (0, cheerio_1.load)(videoPage);
        const embeds = [];
        for (const element of $('.play a')) {
            const embedUrl = $(element).attr('href');
            if (!embedUrl)
                continue;
            const embedPage = await ctx.proxiedFetcher.full(embedUrl.startsWith('https://') ? embedUrl : `https://${embedUrl}`);
            const finalUrl = (0, cheerio_1.load)(embedPage.body)('a:contains("Download Filme")').attr('href');
            if (!finalUrl)
                continue;
            if (finalUrl.includes('streamtape')) {
                embeds.push({
                    embedId: 'streamtape',
                    url: finalUrl,
                });
                // found doodstream on a few shows, maybe movies use it too?
                // the player 2 is just streamtape in a custom player
            }
            else if (finalUrl.includes('dood')) {
                embeds.push({
                    embedId: 'dood',
                    url: finalUrl,
                });
            }
        }
        ctx.progress(90);
        return {
            embeds,
        };
    },
    scrapeShow: async (ctx) => {
        const searchResults = (0, common_1.parseSearch)(await ctx.proxiedFetcher('/series/', {
            baseUrl: common_1.baseUrl,
            query: {
                s: ctx.media.title,
            },
        }));
        if (searchResults.length === 0)
            throw new errors_1.NotFoundError('No watchable item found');
        const url = searchResults.find((x) => x && (0, compare_1.compareMedia)(ctx.media, x.title, x.year))?.url;
        if (!url)
            throw new errors_1.NotFoundError('No watchable item found');
        ctx.progress(50);
        const s = ctx.media.season.number < 10 ? `0${ctx.media.season.number}` : ctx.media.season.number.toString();
        const e = ctx.media.episode.number < 10 ? `0${ctx.media.episode.number}` : ctx.media.episode.number.toString();
        const videoPage = await ctx.proxiedFetcher(url, {
            method: 'POST',
            body: new URLSearchParams({ [`S${s}E${e}`]: '' }),
        });
        const embedUrl = (0, cheerio_1.load)(videoPage)('iframe[name="player"]').attr('src');
        if (!embedUrl)
            throw new Error('Failed to find iframe');
        const playerPage = await ctx.proxiedFetcher(embedUrl.startsWith('https:') ? embedUrl : `https:${embedUrl}`, {
            method: 'POST',
            body: new URLSearchParams({ submit: '' }),
        });
        const embeds = [];
        const finalUrl = (0, cheerio_1.load)(playerPage)('a:contains("Download Episodio")').attr('href');
        if (finalUrl?.includes('streamtape')) {
            embeds.push({
                embedId: 'streamtape',
                url: finalUrl,
            });
        }
        else if (finalUrl?.includes('dood')) {
            embeds.push({
                embedId: 'dood',
                url: finalUrl,
            });
        }
        ctx.progress(90);
        return {
            embeds,
        };
    },
});
