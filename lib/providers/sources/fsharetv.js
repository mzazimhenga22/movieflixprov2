"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fsharetvScraper = void 0;
const cheerio_1 = require("cheerio");
const base_1 = require("../../providers/base");
const compare_1 = require("../../utils/compare");
const errors_1 = require("../../utils/errors");
const quality_1 = require("../../utils/quality");
const baseUrl = 'https://fsharetv.co';
async function comboScraper(ctx) {
    const searchPage = await ctx.proxiedFetcher('/search', {
        baseUrl,
        query: {
            q: ctx.media.title,
        },
    });
    const search$ = (0, cheerio_1.load)(searchPage);
    const searchResults = [];
    search$('.movie-item').each((_, element) => {
        const [, title, year] = search$(element)
            .find('b')
            .text()
            ?.match(/^(.*?)\s*(?:\(?\s*(\d{4})(?:\s*-\s*\d{0,4})?\s*\)?)?\s*$/) || [];
        const url = search$(element).find('a').attr('href');
        if (!title || !url)
            return;
        searchResults.push({ title, year: Number(year) ?? undefined, url });
    });
    const watchPageUrl = searchResults.find((x) => x && (0, compare_1.compareMedia)(ctx.media, x.title, x.year))?.url;
    if (!watchPageUrl)
        throw new errors_1.NotFoundError('No watchable item found');
    ctx.progress(50);
    const watchPage = await ctx.proxiedFetcher(watchPageUrl.replace('/movie', '/w'), { baseUrl });
    const fileId = watchPage.match(/Movie\.setSource\('([^']*)'/)?.[1];
    if (!fileId)
        throw new Error('File ID not found');
    const apiRes = await ctx.proxiedFetcher(`/api/file/${fileId}/source`, {
        baseUrl,
        query: {
            type: 'watch',
        },
    });
    if (!apiRes.data.file.sources.length)
        throw new Error('No sources found');
    // this is to get around a ext bug where it doesn't send the headers to the second req after redir
    const mediaBase = new URL((await ctx.proxiedFetcher.full(apiRes.data.file.sources[0].src, { baseUrl })).finalUrl)
        .origin;
    const qualities = apiRes.data.file.sources.reduce((acc, source) => {
        const quality = typeof source.quality === 'number' ? source.quality.toString() : source.quality;
        const validQuality = (0, quality_1.getValidQualityFromString)(quality);
        acc[validQuality] = {
            type: 'mp4',
            url: `${mediaBase}${source.src.replace('/api', '')}`,
        };
        return acc;
    }, {});
    ctx.progress(90);
    return {
        embeds: [],
        stream: [
            {
                id: 'primary',
                type: 'file',
                flags: [],
                headers: {
                    referer: 'https://fsharetv.co',
                },
                qualities,
                captions: [],
            },
        ],
    };
}
exports.fsharetvScraper = (0, base_1.makeSourcerer)({
    id: 'fsharetv',
    name: 'FshareTV',
    rank: 190,
    flags: [],
    scrapeMovie: comboScraper,
});
