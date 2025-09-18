"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.madplayScraper = void 0;
const targets_1 = require("../../entrypoint/utils/targets");
const base_1 = require("../../providers/base");
async function comboScraper(ctx) {
    const query = {
        type: ctx.media.type,
        title: ctx.media.title,
        tmdbId: ctx.media.tmdbId,
        imdbId: ctx.media.imdbId,
        ...(ctx.media.type === 'show' && {
            season: ctx.media.season.number,
            episode: ctx.media.episode.number,
        }),
        releaseYear: ctx.media.releaseYear,
    };
    return {
        embeds: [
            {
                embedId: 'madplay-base',
                url: JSON.stringify(query),
            },
            {
                embedId: 'madplay-nsapi',
                url: JSON.stringify(query),
            },
            {
                embedId: 'madplay-roper',
                url: JSON.stringify(query),
            },
            {
                embedId: 'madplay-vidfast',
                url: JSON.stringify(query),
            },
        ],
    };
}
exports.madplayScraper = (0, base_1.makeSourcerer)({
    id: 'madplay',
    name: 'Flicky',
    rank: 155,
    disabled: true,
    flags: [targets_1.flags.CORS_ALLOWED],
    scrapeMovie: comboScraper,
    scrapeShow: comboScraper,
});
