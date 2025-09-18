"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zunimeScraper = void 0;
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
                embedId: 'zunime-hd-2',
                url: JSON.stringify(query),
            },
            {
                embedId: 'zunime-miko',
                url: JSON.stringify(query),
            },
            {
                embedId: 'zunime-shiro',
                url: JSON.stringify(query),
            },
            {
                embedId: 'zunime-zaza',
                url: JSON.stringify(query),
            },
        ],
    };
}
exports.zunimeScraper = (0, base_1.makeSourcerer)({
    id: 'zunime',
    name: 'Zunime',
    rank: 125,
    flags: [],
    scrapeShow: comboScraper,
});
