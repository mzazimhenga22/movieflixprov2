"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vidSrcToScraper = void 0;
const cheerio_1 = require("cheerio");
const targets_1 = require("../../../../entrypoint/utils/targets");
const base_1 = require("../../../../providers/base");
const common_1 = require("./common");
const vidSrcToBase = 'https://vidsrc.to';
const referer = `${vidSrcToBase}/`;
const universalScraper = async (ctx) => {
    const mediaId = ctx.media.imdbId ?? ctx.media.tmdbId;
    const url = ctx.media.type === 'movie'
        ? `/embed/movie/${mediaId}`
        : `/embed/tv/${mediaId}/${ctx.media.season.number}/${ctx.media.episode.number}`;
    const mainPage = await ctx.proxiedFetcher(url, {
        baseUrl: vidSrcToBase,
        headers: { referer },
    });
    const mainPage$ = (0, cheerio_1.load)(mainPage);
    const dataId = mainPage$('a[data-id]').attr('data-id');
    if (!dataId)
        throw new Error('No data-id found');
    const sources = await ctx.proxiedFetcher(`/ajax/embed/episode/${dataId}/sources`, {
        baseUrl: vidSrcToBase,
        headers: { referer },
    });
    if (sources.status !== 200)
        throw new Error('No sources found');
    const embeds = [];
    const embedArr = []; // ✅ give the array an explicit type
    // collect all raw embeds
    for (const source of sources.result) {
        const sourceRes = await ctx.proxiedFetcher(`/ajax/embed/source/${source.id}`, {
            baseUrl: vidSrcToBase,
            headers: { referer },
        });
        const decryptedUrl = (0, common_1.decryptSourceUrl)(sourceRes.result.url);
        embedArr.push({
            source: source.title,
            url: decryptedUrl,
        });
    }
    // convert raw embeds to final SourcererEmbed[]
    for (const embedObj of embedArr) {
        if (embedObj.source === 'Vidplay') {
            const fullUrl = new URL(embedObj.url);
            embeds.push({
                embedId: 'vidplay',
                url: fullUrl.toString(),
            });
        }
        if (embedObj.source === 'Filemoon') {
            const fullUrl = new URL(embedObj.url);
            // Filemoon normally has no subtitles. Reuse subtitles from Vidplay if present.
            const urlWithSubtitles = embedArr.find((v) => v.source === 'Vidplay' && v.url.includes('sub.info'))?.url;
            const subtitleUrl = urlWithSubtitles
                ? new URL(urlWithSubtitles).searchParams.get('sub.info')
                : null;
            if (subtitleUrl) {
                fullUrl.searchParams.set('sub.info', subtitleUrl);
            }
            embeds.push({
                embedId: 'filemoon',
                url: fullUrl.toString(),
            }, {
                embedId: 'filemoon-mp4',
                url: fullUrl.toString(),
            });
        }
    }
    return { embeds };
};
exports.vidSrcToScraper = (0, base_1.makeSourcerer)({
    id: 'vidsrcto',
    name: 'VidSrcTo',
    disabled: true,
    scrapeMovie: universalScraper,
    scrapeShow: universalScraper,
    flags: [targets_1.flags.PROXY_BLOCKED],
    rank: 260,
});
