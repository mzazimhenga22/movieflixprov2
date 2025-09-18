"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cuevana3Scraper = void 0;
const cheerio_1 = require("cheerio");
const targets_1 = require("../../entrypoint/utils/targets");
const base_1 = require("../../providers/base");
const errors_1 = require("../../utils/errors");
const baseUrl = 'https://www.cuevana3.eu';
function normalizeTitle(title) {
    return title
        .normalize('NFD') // Remove accents
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/gi, '') // Remove non-alphanumeric characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-'); // Remove multiple hyphens
}
async function getStreamUrl(ctx, embedUrl) {
    try {
        const html = await ctx.proxiedFetcher(embedUrl);
        const match = html.match(/var url = '([^']+)'/);
        if (match) {
            return match[1];
        }
    }
    catch {
        // Ignore errors from dead embeds
    }
    return null;
}
function validateStream(url) {
    return (url.startsWith('https://') && (url.includes('streamwish') || url.includes('filemoon') || url.includes('vidhide')));
}
async function extractVideos(ctx, videos) {
    const videoList = [];
    for (const [lang, videoArray] of Object.entries(videos)) {
        if (!videoArray)
            continue;
        for (const video of videoArray) {
            if (!video.result)
                continue;
            const realUrl = await getStreamUrl(ctx, video.result);
            if (!realUrl || !validateStream(realUrl))
                continue;
            let embedId = '';
            if (realUrl.includes('filemoon'))
                embedId = 'filemoon';
            else if (realUrl.includes('streamwish')) {
                if (lang === 'latino')
                    embedId = 'streamwish-latino';
                else if (lang === 'spanish')
                    embedId = 'streamwish-spanish';
                else if (lang === 'english')
                    embedId = 'streamwish-english';
                else
                    embedId = 'streamwish-latino';
            }
            else if (realUrl.includes('vidhide'))
                embedId = 'vidhide';
            else if (realUrl.includes('voe'))
                embedId = 'voe';
            else
                continue;
            videoList.push({
                embedId,
                url: realUrl,
            });
        }
    }
    return videoList;
}
async function fetchTmdbTitleInSpanish(tmdbId, apiKey, mediaType) {
    const endpoint = mediaType === 'movie'
        ? `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${apiKey}&language=es-ES`
        : `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${apiKey}&language=es-ES`;
    const response = await fetch(endpoint);
    if (!response.ok) {
        throw new Error(`Error fetching TMDB data: ${response.statusText}`);
    }
    const tmdbData = await response.json();
    return mediaType === 'movie' ? tmdbData.title : tmdbData.name;
}
async function fetchTitleSubstitutes() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/moonpic/fixed-titles/refs/heads/main/main.json');
        if (!response.ok)
            throw new Error('Failed to fetch fallback titles');
        return await response.json();
    }
    catch {
        return {};
    }
}
async function comboScraper(ctx) {
    const mediaType = ctx.media.type;
    const tmdbId = ctx.media.tmdbId;
    const apiKey = '7604525319adb2db8e7e841cb98e9217';
    if (!tmdbId) {
        throw new errors_1.NotFoundError('TMDB ID is required to fetch the title in Spanish');
    }
    const translatedTitle = await fetchTmdbTitleInSpanish(Number(tmdbId), apiKey, mediaType);
    let normalizedTitle = normalizeTitle(translatedTitle);
    let pageUrl = mediaType === 'movie'
        ? `${baseUrl}/ver-pelicula/${normalizedTitle}`
        : `${baseUrl}/episodio/${normalizedTitle}-temporada-${ctx.media.season?.number}-episodio-${ctx.media.episode?.number}`;
    ctx.progress(60);
    let pageContent = await ctx.proxiedFetcher(pageUrl);
    let $ = (0, cheerio_1.load)(pageContent);
    let script = $('script')
        .toArray()
        .find((scriptEl) => {
        const content = scriptEl.children[0]?.data || '';
        return content.includes('{"props":{"pageProps":');
    });
    let embeds = [];
    if (script) {
        let jsonData;
        try {
            const jsonString = script.children[0].data;
            const start = jsonString.indexOf('{"props":{"pageProps":');
            if (start === -1)
                throw new Error('No valid JSON start found');
            const partialJson = jsonString.slice(start);
            jsonData = JSON.parse(partialJson);
        }
        catch (error) {
            throw new errors_1.NotFoundError(`Failed to parse JSON: ${error.message}`);
        }
        if (mediaType === 'movie') {
            const movieData = jsonData.props.pageProps.thisMovie;
            if (movieData?.videos) {
                embeds = (await extractVideos(ctx, movieData.videos)) ?? [];
            }
        }
        else {
            const episodeData = jsonData.props.pageProps.episode;
            if (episodeData?.videos) {
                embeds = (await extractVideos(ctx, episodeData.videos)) ?? [];
            }
        }
    }
    if (embeds.length === 0) {
        const fallbacks = await fetchTitleSubstitutes();
        const fallbackTitle = fallbacks[tmdbId.toString()];
        if (!fallbackTitle) {
            throw new errors_1.NotFoundError('No embed data found and no fallback title available');
        }
        normalizedTitle = normalizeTitle(fallbackTitle);
        pageUrl =
            mediaType === 'movie'
                ? `${baseUrl}/ver-pelicula/${normalizedTitle}`
                : `${baseUrl}/episodio/${normalizedTitle}-temporada-${ctx.media.season?.number}-episodio-${ctx.media.episode?.number}`;
        pageContent = await ctx.proxiedFetcher(pageUrl);
        $ = (0, cheerio_1.load)(pageContent);
        script = $('script')
            .toArray()
            .find((scriptEl) => {
            const content = scriptEl.children[0]?.data || '';
            return content.includes('{"props":{"pageProps":');
        });
        if (script) {
            let jsonData;
            try {
                const jsonString = script.children[0].data;
                const start = jsonString.indexOf('{"props":{"pageProps":');
                if (start === -1)
                    throw new Error('No valid JSON start found');
                const partialJson = jsonString.slice(start);
                jsonData = JSON.parse(partialJson);
            }
            catch (error) {
                throw new errors_1.NotFoundError(`Failed to parse JSON: ${error.message}`);
            }
            if (mediaType === 'movie') {
                const movieData = jsonData.props.pageProps.thisMovie;
                if (movieData?.videos) {
                    embeds = (await extractVideos(ctx, movieData.videos)) ?? [];
                }
            }
            else {
                const episodeData = jsonData.props.pageProps.episode;
                if (episodeData?.videos) {
                    embeds = (await extractVideos(ctx, episodeData.videos)) ?? [];
                }
            }
        }
    }
    if (embeds.length === 0) {
        throw new errors_1.NotFoundError('No valid streams found');
    }
    return { embeds };
}
exports.cuevana3Scraper = (0, base_1.makeSourcerer)({
    id: 'cuevana3',
    name: 'Cuevana3',
    rank: 80,
    disabled: true,
    flags: [targets_1.flags.CORS_ALLOWED],
    scrapeMovie: comboScraper,
    scrapeShow: comboScraper,
});
// made by @moonpic
