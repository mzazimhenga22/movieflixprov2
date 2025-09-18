"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.baseUrl = void 0;
exports.searchAndFindMedia = searchAndFindMedia;
exports.scrape = scrape;
const compare_1 = require("../../../utils/compare");
const errors_1 = require("../../../utils/errors");
const video_1 = require("./video");
exports.baseUrl = 'https://lmscript.xyz';
async function searchAndFindMedia(ctx, media) {
    if (media.type === 'show') {
        const searchRes = await ctx.proxiedFetcher(`/v1/shows`, {
            baseUrl: exports.baseUrl,
            query: { 'filters[q]': media.title },
        });
        const results = searchRes.items;
        const result = results.find((res) => (0, compare_1.compareMedia)(media, res.title, Number(res.year)));
        return result;
    }
    if (media.type === 'movie') {
        const searchRes = await ctx.proxiedFetcher(`/v1/movies`, {
            baseUrl: exports.baseUrl,
            query: { 'filters[q]': media.title },
        });
        const results = searchRes.items;
        const result = results.find((res) => (0, compare_1.compareMedia)(media, res.title, Number(res.year)));
        return result;
    }
}
async function scrape(ctx, media, result) {
    // Find the relevant id
    let id = null; // ✅ allow string OR null
    if (media.type === 'movie') {
        id = result.id_movie;
    }
    else if (media.type === 'show') {
        const data = await ctx.proxiedFetcher(`/v1/shows`, {
            baseUrl: exports.baseUrl,
            query: { expand: 'episodes', id: result.id_show },
        });
        const episode = data.episodes?.find((v) => Number(v.season) === Number(media.season.number) &&
            Number(v.episode) === Number(media.episode.number));
        if (episode)
            id = episode.id;
    }
    // Check ID
    if (id === null)
        throw new errors_1.NotFoundError('Not found');
    const video = await (0, video_1.getVideo)(ctx, id, media);
    return video;
}
