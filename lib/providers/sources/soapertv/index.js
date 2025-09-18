"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.soaperTvScraper = void 0;
const cheerio_1 = require("cheerio");
const targets_1 = require("../../../entrypoint/utils/targets");
const captions_1 = require("../../../providers/captions");
const compare_1 = require("../../../utils/compare");
const errors_1 = require("../../../utils/errors");
const playlist_1 = require("../../../utils/playlist");
const base_1 = require("../../base");
const baseUrl = 'https://soaper.cc';
const universalScraper = async (ctx) => {
    const searchResult = await ctx.proxiedFetcher('/search.html', {
        baseUrl,
        query: {
            keyword: ctx.media.title,
        },
    });
    const search$ = (0, cheerio_1.load)(searchResult);
    const searchResults = [];
    search$('.thumbnail').each((_, element) => {
        const title = search$(element).find('h5').find('a').first().text().trim();
        const year = search$(element).find('.img-tip').first().text().trim();
        const url = search$(element).find('h5').find('a').first().attr('href');
        if (!title || !url)
            return;
        searchResults.push({ title, year: year ? parseInt(year, 10) : undefined, url });
    });
    let showLink = searchResults.find((x) => x && (0, compare_1.compareMedia)(ctx.media, x.title, x.year))?.url;
    if (!showLink)
        throw new errors_1.NotFoundError('Content not found');
    if (ctx.media.type === 'show') {
        const seasonNumber = ctx.media.season.number;
        const episodeNumber = ctx.media.episode.number;
        const showPage = await ctx.proxiedFetcher(showLink, { baseUrl });
        const showPage$ = (0, cheerio_1.load)(showPage);
        const seasonBlock = showPage$('h4')
            .filter((_, el) => showPage$(el).text().trim().split(':')[0].trim() === `Season${seasonNumber}`)
            .parent();
        const episodes = seasonBlock.find('a').toArray();
        showLink = showPage$(episodes.find((el) => parseInt(showPage$(el).text().split('.')[0], 10) === episodeNumber)).attr('href');
    }
    if (!showLink)
        throw new errors_1.NotFoundError('Content not found');
    const contentPage = await ctx.proxiedFetcher(showLink, { baseUrl });
    const contentPage$ = (0, cheerio_1.load)(contentPage);
    const pass = contentPage$('#hId').attr('value');
    if (!pass)
        throw new errors_1.NotFoundError('Content not found');
    ctx.progress(50);
    const formData = new URLSearchParams();
    formData.append('pass', pass);
    formData.append('e2', '0');
    formData.append('server', '0');
    const infoEndpoint = ctx.media.type === 'show' ? '/home/index/getEInfoAjax' : '/home/index/getMInfoAjax';
    const streamRes = await ctx.proxiedFetcher(infoEndpoint, {
        baseUrl,
        method: 'POST',
        body: formData,
        headers: {
            referer: `${baseUrl}${showLink}`,
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
            'Viewport-Width': '375',
        },
    });
    const streamResJson = JSON.parse(streamRes);
    const captions = [];
    if (Array.isArray(streamResJson.subs)) {
        for (const sub of streamResJson.subs) {
            // Some subtitles are named <Language>.srt, some are named <LanguageCode>:hi, or just <LanguageCode>
            let language = '';
            if (sub.name.includes('.srt')) {
                const langName = sub.name.split('.srt')[0].trim();
                language = (0, captions_1.labelToLanguageCode)(langName);
            }
            else if (sub.name.includes(':')) {
                const langName = sub.name.split(':')[0].trim();
                language = (0, captions_1.labelToLanguageCode)(langName);
            }
            else {
                const langName = sub.name.trim();
                language = (0, captions_1.labelToLanguageCode)(langName);
            }
            if (!language)
                continue;
            captions.push({
                id: sub.path,
                url: `${baseUrl}${sub.path}`,
                type: 'srt',
                hasCorsRestrictions: false,
                language,
            });
        }
    }
    ctx.progress(90);
    // Headers needed for the M3U8 proxy
    const headers = {
        referer: `${baseUrl}${showLink}`,
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
        'Viewport-Width': '375',
        Origin: baseUrl,
    };
    return {
        embeds: [],
        stream: [
            {
                id: 'primary',
                playlist: await (0, playlist_1.convertPlaylistsToDataUrls)(ctx.proxiedFetcher, `${baseUrl}/${streamResJson.val}`, headers),
                type: 'hls',
                proxyDepth: 2,
                flags: [targets_1.flags.CORS_ALLOWED],
                captions,
            },
            ...(streamResJson.val_bak
                ? [
                    {
                        id: 'backup',
                        playlist: await (0, playlist_1.convertPlaylistsToDataUrls)(ctx.proxiedFetcher, `${baseUrl}/${streamResJson.val_bak}`, headers),
                        type: 'hls',
                        flags: [targets_1.flags.CORS_ALLOWED],
                        proxyDepth: 2,
                        captions,
                    },
                ]
                : []),
        ],
    };
};
exports.soaperTvScraper = (0, base_1.makeSourcerer)({
    id: 'soapertv',
    name: 'SoaperTV',
    rank: 130,
    disabled: true,
    flags: [targets_1.flags.CORS_ALLOWED],
    scrapeMovie: universalScraper,
    scrapeShow: universalScraper,
});
