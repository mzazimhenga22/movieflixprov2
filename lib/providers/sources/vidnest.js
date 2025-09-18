"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const targets_1 = require("../../entrypoint/utils/targets");
const base_1 = require("../../providers/base"); // ✅ Import the correct type
const backendUrl = 'https://backend.vidnest.fun';
const servers = ['hollymoviehd', 'allmovies', 'flixhq', 'official'];
async function scrape(ctx, type) {
    // ✅ Explicitly type the array so .push() accepts the correct objects
    const embeds = [];
    for (const server of servers) {
        let url = '';
        if (type === 'movie') {
            url = `${backendUrl}/${server}/movie/${ctx.media.tmdbId}`;
        }
        else if (ctx.media.type === 'show') {
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
const vidnestScraper = (0, base_1.makeSourcerer)({
    id: 'vidnest',
    name: 'Vidnest',
    rank: 130,
    flags: [targets_1.flags.CORS_ALLOWED],
    scrapeMovie: (ctx) => scrape(ctx, 'movie'),
    scrapeShow: (ctx) => scrape(ctx, 'tv'),
});
exports.default = vidnestScraper;
