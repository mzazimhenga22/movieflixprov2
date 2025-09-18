"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoembedScraper = void 0;
/* eslint-disable no-console */
const targets_1 = require("../../entrypoint/utils/targets");
const base_1 = require("../../providers/base");
const errors_1 = require("../../utils/errors");
const apiUrl = 'https://tom.autoembed.cc';
// const baseUrl = 'https://watch.autoembed.cc';
async function comboScraper(ctx) {
    const mediaType = ctx.media.type === 'show' ? 'tv' : 'movie';
    let id = ctx.media.tmdbId;
    if (ctx.media.type === 'show') {
        id = `${id}/${ctx.media.season.number}/${ctx.media.episode.number}`;
    }
    const data = await ctx.proxiedFetcher(`/api/getVideoSource`, {
        baseUrl: apiUrl,
        query: {
            type: mediaType,
            id,
        },
        headers: {
            Referer: apiUrl,
            Origin: apiUrl,
        },
    });
    if (!data)
        throw new errors_1.NotFoundError('Failed to fetch video source');
    if (!data.videoSource)
        throw new errors_1.NotFoundError('No video source found');
    ctx.progress(50);
    const embeds = [
        {
            embedId: `autoembed-english`,
            url: data.videoSource,
        },
    ];
    ctx.progress(90);
    return {
        embeds,
    };
}
exports.autoembedScraper = (0, base_1.makeSourcerer)({
    id: 'autoembed',
    name: 'Autoembed',
    rank: 110,
    disabled: true,
    flags: [targets_1.flags.CORS_ALLOWED],
    scrapeMovie: comboScraper,
    scrapeShow: comboScraper,
});
