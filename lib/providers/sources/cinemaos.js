"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cinemaosScraper = void 0;
const targets_1 = require("../../entrypoint/utils/targets");
const base_1 = require("../../providers/base");
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
async function comboScraper(ctx) {
    // ✅ give embeds a concrete type
    const embeds = [];
    const query = {
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
exports.cinemaosScraper = (0, base_1.makeSourcerer)({
    id: 'cinemaos',
    name: 'CinemaOS',
    rank: 149,
    disabled: true,
    flags: [targets_1.flags.CORS_ALLOWED],
    scrapeMovie: comboScraper,
    scrapeShow: comboScraper,
});
