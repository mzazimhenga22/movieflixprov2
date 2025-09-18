"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nepuScraper = void 0;
const targets_1 = require("../../entrypoint/utils/targets");
const base_1 = require("../../providers/base");
const errors_1 = require("../../utils/errors");
const nepuBase = 'https://nscrape.andresdev.org/api';
async function scrape(ctx) {
    const tmdbId = ctx.media.tmdbId;
    let url;
    if (ctx.media.type === 'movie') {
        url = `${nepuBase}/get-stream?tmdbId=${tmdbId}`;
    }
    else {
        url = `${nepuBase}/get-show-stream?tmdbId=${tmdbId}&season=${ctx.media.season.number}&episode=${ctx.media.episode.number}`;
    }
    const response = await ctx.proxiedFetcher(url);
    if (!response.success || !response.rurl) {
        throw new errors_1.NotFoundError('No stream found');
    }
    return {
        stream: [
            {
                id: 'nepu',
                type: 'hls',
                playlist: response.rurl,
                flags: [targets_1.flags.CORS_ALLOWED],
                captions: [],
            },
        ],
        embeds: [],
    };
}
exports.nepuScraper = (0, base_1.makeSourcerer)({
    id: 'nepu',
    name: 'Nepu',
    rank: 201,
    disabled: true,
    flags: [targets_1.flags.CORS_ALLOWED],
    scrapeMovie: scrape,
    scrapeShow: scrape,
});
