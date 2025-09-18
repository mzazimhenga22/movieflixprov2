"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.whvxScraper = exports.baseUrl = void 0;
const targets_1 = require("../../../entrypoint/utils/targets");
const base_1 = require("../../../providers/base");
const errors_1 = require("../../../utils/errors");
exports.baseUrl = 'https://api.whvx.net';
async function comboScraper(ctx) {
    const query = {
        title: ctx.media.title,
        releaseYear: ctx.media.releaseYear,
        tmdbId: ctx.media.tmdbId,
        imdbId: ctx.media.imdbId,
        type: ctx.media.type,
        ...(ctx.media.type === 'show' && {
            season: ctx.media.season.number.toString(),
            episode: ctx.media.episode.number.toString(),
        }),
    };
    const res = await ctx.fetcher('/status', { baseUrl: exports.baseUrl });
    if (res.providers?.length === 0)
        throw new errors_1.NotFoundError('No providers available');
    const embeds = res.providers.map((provider) => {
        return {
            embedId: provider,
            url: JSON.stringify(query),
        };
    });
    return {
        embeds,
    };
}
exports.whvxScraper = (0, base_1.makeSourcerer)({
    id: 'whvx',
    name: 'VidBinge',
    rank: 270,
    disabled: true,
    externalSource: true,
    flags: [targets_1.flags.CORS_ALLOWED],
    scrapeMovie: comboScraper,
    scrapeShow: comboScraper,
});
