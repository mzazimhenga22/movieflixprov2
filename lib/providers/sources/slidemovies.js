"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slidemoviesScraper = void 0;
const cheerio_1 = require("cheerio");
const targets_1 = require("../../entrypoint/utils/targets");
const base_1 = require("../../providers/base");
const captions_1 = require("../../providers/captions");
const errors_1 = require("../../utils/errors");
const baseUrl = 'https://pupp.slidemovies-dev.workers.dev';
async function comboScraper(ctx) {
    const watchPageUrl = ctx.media.type === 'movie'
        ? `${baseUrl}/movie/${ctx.media.tmdbId}`
        : `${baseUrl}/tv/${ctx.media.tmdbId}/${ctx.media.season.number}/-${ctx.media.episode.number}`;
    const watchPage = await ctx.proxiedFetcher(watchPageUrl);
    const $ = (0, cheerio_1.load)(watchPage);
    ctx.progress(50);
    const proxiedStreamUrl = $('media-player').attr('src');
    if (!proxiedStreamUrl) {
        throw new errors_1.NotFoundError('Stream URL not found');
    }
    const proxyUrl = new URL(proxiedStreamUrl);
    const encodedUrl = proxyUrl.searchParams.get('url') || '';
    const playlist = decodeURIComponent(encodedUrl);
    const captions = $('media-provider track')
        .map((_, el) => {
        const url = $(el).attr('src') || '';
        const rawLang = $(el).attr('lang') || 'unknown';
        const languageCode = (0, captions_1.labelToLanguageCode)(rawLang) || rawLang;
        const isVtt = url.endsWith('.vtt') ? 'vtt' : 'srt';
        return {
            type: isVtt,
            id: url,
            url,
            language: languageCode,
            hasCorsRestrictions: false,
        };
    })
        .get();
    ctx.progress(90);
    return {
        embeds: [],
        stream: [
            {
                id: 'primary',
                type: 'hls',
                flags: [],
                playlist,
                captions,
            },
        ],
    };
}
exports.slidemoviesScraper = (0, base_1.makeSourcerer)({
    id: 'slidemovies',
    name: 'SlideMovies',
    rank: 135,
    disabled: true,
    flags: [targets_1.flags.CORS_ALLOWED],
    scrapeMovie: comboScraper,
    scrapeShow: comboScraper,
});
