"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nsbxScraper = void 0;
const targets_1 = require("../../../entrypoint/utils/targets");
const base_1 = require("../../../providers/base");
const errors_1 = require("../../../utils/errors");
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
    const res = await ctx.fetcher('https://api.nsbx.ru/status');
    if (res.providers?.length === 0)
        throw new errors_1.NotFoundError('No providers available');
    if (!res.endpoint)
        throw new Error('No endpoint returned');
    const embeds = res.providers.map((provider) => {
        return {
            embedId: provider,
            url: `${JSON.stringify(query)}|${res.endpoint}`,
        };
    });
    return {
        embeds,
    };
}
exports.nsbxScraper = (0, base_1.makeSourcerer)({
    id: 'nsbx',
    name: 'NSBX',
    rank: 290,
    flags: [targets_1.flags.CORS_ALLOWED],
    disabled: true,
    externalSource: true,
    scrapeMovie: comboScraper,
    scrapeShow: comboScraper,
});
