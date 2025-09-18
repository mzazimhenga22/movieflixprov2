"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vidapiClickScraper = void 0;
/* eslint-disable no-console */
const targets_1 = require("../../entrypoint/utils/targets");
const base_1 = require("../../providers/base");
const errors_1 = require("../../utils/errors");
const baseUrl = 'https://vidapi.click';
async function comboScraper(ctx) {
    const apiUrl = ctx.media.type === 'show'
        ? `${baseUrl}/api/video/tv/${ctx.media.tmdbId}/${ctx.media.season.number}/${ctx.media.episode.number}`
        : `${baseUrl}/api/video/movie/${ctx.media.tmdbId}`;
    const apiRes = await ctx.proxiedFetcher(apiUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
    });
    if (!apiRes)
        throw new errors_1.NotFoundError('Failed to fetch video source');
    if (!apiRes.sources[0].file)
        throw new errors_1.NotFoundError('No video source found');
    ctx.progress(50);
    ctx.progress(90);
    return {
        embeds: [],
        stream: [
            {
                id: 'primary',
                type: 'hls',
                playlist: apiRes.sources[0].file,
                flags: [targets_1.flags.CORS_ALLOWED],
                captions: [],
            },
        ],
    };
}
exports.vidapiClickScraper = (0, base_1.makeSourcerer)({
    id: 'vidapi-click',
    name: 'vidapi.click',
    rank: 89,
    disabled: true,
    flags: [targets_1.flags.CORS_ALLOWED],
    scrapeMovie: comboScraper,
    scrapeShow: comboScraper,
});
