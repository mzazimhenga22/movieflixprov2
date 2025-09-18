"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nepuScraper = void 0;
const cheerio_1 = require("cheerio");
const base_1 = require("../../../../providers/base");
const compare_1 = require("../../../../utils/compare");
const errors_1 = require("../../../../utils/errors");
const nepuBase = 'https://rar.to';
const nepuReferer = 'https://rar.to/';
const universalScraper = async (ctx) => {
    const searchResultRequest = await ctx.proxiedFetcher('/ajax/posts', {
        baseUrl: nepuBase,
        query: {
            q: ctx.media.title,
        },
    });
    // json isn't parsed by proxiedFetcher due to content-type being text/html.
    const searchResult = JSON.parse(searchResultRequest);
    const show = searchResult.data.find((item) => {
        if (!item)
            return false;
        if (ctx.media.type === 'movie' && item.type !== 'Movie')
            return false;
        if (ctx.media.type === 'show' && item.type !== 'Show')
            return false;
        const [, title, year] = item.name.match(/^(.*?)\s*(?:\(?\s*(\d{4})(?:\s*-\s*\d{0,4})?\s*\)?)?\s*$/) || [];
        return (0, compare_1.compareMedia)(ctx.media, title, Number(year));
    });
    if (!show)
        throw new errors_1.NotFoundError('No watchable item found');
    let videoUrl = show.url;
    if (ctx.media.type === 'show') {
        videoUrl = `${show.url}/season/${ctx.media.season.number}/episode/${ctx.media.episode.number}`;
    }
    ctx.progress(50);
    const videoPage = await ctx.proxiedFetcher(videoUrl, {
        baseUrl: nepuBase,
    });
    const videoPage$ = (0, cheerio_1.load)(videoPage);
    const embedId = videoPage$('a[data-embed]').attr('data-embed');
    if (!embedId)
        throw new errors_1.NotFoundError('No embed found.');
    const playerPage = await ctx.proxiedFetcher('/ajax/embed', {
        method: 'POST',
        baseUrl: nepuBase,
        body: new URLSearchParams({ id: embedId }),
    });
    const streamUrl = playerPage.match(/"file":"([^"]+)"/);
    if (!streamUrl?.[1])
        throw new errors_1.NotFoundError('No stream found.');
    ctx.progress(90);
    return {
        embeds: [],
        stream: [
            {
                id: 'primary',
                captions: [],
                playlist: nepuBase + streamUrl[1],
                type: 'hls',
                headers: {
                    Origin: nepuBase,
                    Referer: nepuReferer,
                },
                flags: [],
            },
        ],
    };
};
exports.nepuScraper = (0, base_1.makeSourcerer)({
    id: 'nepu',
    name: 'Nepu',
    rank: 210,
    disabled: true,
    flags: [],
    scrapeMovie: universalScraper,
    scrapeShow: universalScraper,
});
