"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.myanimeScraper = void 0;
const targets_1 = require("../../entrypoint/utils/targets");
const base_1 = require("../../providers/base");
const compare_1 = require("../../utils/compare");
const errors_1 = require("../../utils/errors");
// Levenshtein distance function for string similarity
const levenshtein = (s, t) => {
    if (!s.length)
        return t.length;
    if (!t.length)
        return s.length;
    const arr = [];
    for (let i = 0; i <= t.length; i++) {
        arr[i] = [i];
        for (let j = 1; j <= s.length; j++) {
            arr[i][j] =
                i === 0
                    ? j
                    : Math.min(arr[i - 1][j] + 1, arr[i][j - 1] + 1, arr[i - 1][j - 1] + (s[j - 1] === t[i - 1] ? 0 : 1));
        }
    }
    return arr[t.length][s.length];
};
const universalScraper = async (ctx) => {
    const searchResults = await ctx.proxiedFetcher(`https://anime-api-cyan-zeta.vercel.app/api/search?keyword=${encodeURIComponent(ctx.media.title)}`);
    const bestMatch = searchResults.results.data
        .map((item) => {
        const similarity = 1 - levenshtein(item.title, ctx.media.title) / Math.max(item.title.length, ctx.media.title.length);
        const isExactMatch = (0, compare_1.compareTitle)(item.title, ctx.media.title);
        return { ...item, similarity, isExactMatch };
    })
        .sort((a, b) => {
        if (a.isExactMatch && !b.isExactMatch)
            return -1;
        if (!a.isExactMatch && b.isExactMatch)
            return 1;
        return b.similarity - a.similarity;
    })[0];
    if (!bestMatch) {
        throw new errors_1.NotFoundError('No watchable sources found');
    }
    const episodeData = await ctx.proxiedFetcher(`https://anime.aether.mom/api/episodes/${bestMatch.id}`);
    const episode = episodeData.results.episodes.find((e) => e.episode_no === (ctx.media.type === 'show' ? ctx.media.episode.number : 1));
    if (!episode) {
        throw new errors_1.NotFoundError('No watchable sources found');
    }
    return {
        embeds: [
            {
                embedId: 'myanimesub',
                url: episode.id,
            },
            {
                embedId: 'myanimedub',
                url: episode.id,
            },
        ],
    };
};
exports.myanimeScraper = (0, base_1.makeSourcerer)({
    id: 'myanime',
    name: 'MyAnime',
    rank: 101,
    flags: [targets_1.flags.CORS_ALLOWED],
    scrapeMovie: universalScraper,
    scrapeShow: universalScraper,
});
