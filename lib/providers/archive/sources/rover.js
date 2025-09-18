"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roverScraper = void 0;
const targets_1 = require("../../../entrypoint/utils/targets");
const base_1 = require("../../../providers/base");
const errors_1 = require("../../../utils/errors");
const baseUrl = 'https://rover.rove.cx';
async function comboScraper(ctx) {
    const apiUrl = ctx.media.type === 'movie'
        ? `${baseUrl}/movie/${ctx.media.tmdbId}`
        : `${baseUrl}/tv/${ctx.media.tmdbId}/${ctx.media.season.number}/${ctx.media.episode.number}`;
    const apiRes = await ctx.proxiedFetcher(apiUrl);
    if (!apiRes.stream.hls)
        throw new errors_1.NotFoundError('No watchable item found');
    ctx.progress(90);
    return {
        embeds: [],
        stream: [
            {
                id: 'primary',
                captions: [],
                playlist: apiRes.stream.hls,
                type: 'hls',
                flags: [targets_1.flags.CORS_ALLOWED],
            },
        ],
    };
}
exports.roverScraper = (0, base_1.makeSourcerer)({
    id: 'rover',
    name: 'Rover',
    rank: 189,
    disabled: true,
    flags: [targets_1.flags.CORS_ALLOWED],
    scrapeMovie: comboScraper,
    scrapeShow: comboScraper,
});
