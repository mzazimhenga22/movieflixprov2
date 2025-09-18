"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.animetsuScraper = void 0;
const base_1 = require("../../providers/base");
const anilist_1 = require("../../utils/anilist");
async function comboScraper(ctx) {
    const anilistId = await (0, anilist_1.getAnilistIdFromMedia)(ctx, ctx.media);
    const query = {
        type: ctx.media.type,
        title: ctx.media.title,
        tmdbId: ctx.media.tmdbId,
        imdbId: ctx.media.imdbId,
        anilistId,
        ...(ctx.media.type === 'show' && {
            season: ctx.media.season.number,
            episode: ctx.media.episode.number,
        }),
        ...(ctx.media.type === 'movie' && { episode: 1 }),
        releaseYear: ctx.media.releaseYear,
    };
    return {
        embeds: [
            {
                embedId: 'animetsu-pahe',
                url: JSON.stringify(query),
            },
            {
                embedId: 'animetsu-zoro',
                url: JSON.stringify(query),
            },
            {
                embedId: 'animetsu-zaza',
                url: JSON.stringify(query),
            },
            {
                embedId: 'animetsu-meg',
                url: JSON.stringify(query),
            },
            {
                embedId: 'animetsu-bato',
                url: JSON.stringify(query),
            },
        ],
    };
}
exports.animetsuScraper = (0, base_1.makeSourcerer)({
    id: 'animetsu',
    name: 'Animetsu',
    rank: 112,
    flags: [],
    scrapeShow: comboScraper,
});
