"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vidsrcvipScraper = void 0;
const targets_1 = require("../../entrypoint/utils/targets");
const base_1 = require("../../providers/base");
const errors_1 = require("../../utils/errors");
const baseUrl = 'https://api2.vidsrc.vip';
function digitToLetterMap(digit) {
    const map = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
    return map[parseInt(digit, 10)];
}
function encodeTmdbId(tmdb, type, season, episode) {
    let raw;
    if (type === 'show' && season && episode) {
        raw = `${tmdb}-${season}-${episode}`;
    }
    else {
        raw = tmdb.split('').map(digitToLetterMap).join('');
    }
    const reversed = raw.split('').reverse().join('');
    return btoa(btoa(reversed));
}
async function comboScraper(ctx) {
    const apiType = ctx.media.type === 'show' ? 'tv' : 'movie';
    const encodedId = encodeTmdbId(ctx.media.tmdbId, ctx.media.type, ctx.media.type === 'show' ? ctx.media.season.number : undefined, ctx.media.type === 'show' ? ctx.media.episode.number : undefined);
    const url = `${baseUrl}/${apiType}/${encodedId}`;
    const data = await ctx.proxiedFetcher(url);
    if (!data || !data.source1)
        throw new errors_1.NotFoundError('No sources found');
    const embeds = [];
    const embedIds = ['vidsrc-comet', 'vidsrc-pulsar', 'vidsrc-nova'];
    let sourceIndex = 0;
    for (let i = 1; data[`source${i}`]; i++) {
        const source = data[`source${i}`];
        if (source?.url) {
            embeds.push({
                embedId: embedIds[sourceIndex % embedIds.length],
                url: source.url,
            });
            sourceIndex++;
        }
    }
    if (embeds.length === 0)
        throw new errors_1.NotFoundError('No embeds found');
    return {
        embeds,
    };
}
exports.vidsrcvipScraper = (0, base_1.makeSourcerer)({
    id: 'vidsrcvip',
    name: 'VidSrc.vip',
    rank: 150,
    disabled: true,
    flags: [targets_1.flags.CORS_ALLOWED],
    scrapeMovie: comboScraper,
    scrapeShow: comboScraper,
});
