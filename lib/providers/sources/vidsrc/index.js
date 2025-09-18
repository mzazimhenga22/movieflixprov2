"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vidsrcScraper = void 0;
const base_1 = require("../../../providers/base");
const errors_1 = require("../../../utils/errors");
const decrypt_1 = require("./decrypt");
// Default player configuration
const o = {
    y: 'xx??x?=xx?xx?=',
    u: '#1RyJzl3JYmljm0mkJWOGYWNyI6MfwVNGYXmj9uQj5tQkeYIWoxLCJXNkawOGF5QZ9sQj1YIWowLCJXO20VbVJ1OZ11QGiSlni0QG9uIn19',
};
async function vidsrcScrape(ctx) {
    const imdbId = ctx.media.imdbId;
    if (!imdbId)
        throw new errors_1.NotFoundError('IMDb ID not found');
    const isShow = ctx.media.type === 'show';
    let season;
    let episode;
    if (isShow) {
        const show = ctx.media;
        season = show.season?.number;
        episode = show.episode?.number;
    }
    const embedUrl = isShow
        ? `https://vidsrc.net/embed/tv?imdb=${imdbId}&season=${season}&episode=${episode}`
        : `https://vidsrc.net/embed/${imdbId}`;
    ctx.progress(10);
    const embedHtml = await ctx.proxiedFetcher(embedUrl, {
        headers: {
            Referer: 'https://vidsrc.net/',
            'User-Agent': 'Mozilla/5.0',
        },
    });
    ctx.progress(30);
    // Extract the iframe source using regex
    const iframeMatch = embedHtml.match(/<iframe[^>]*id="player_iframe"[^>]*src="([^"]*)"[^>]*>/);
    if (!iframeMatch)
        throw new errors_1.NotFoundError('Initial iframe not found');
    const rcpUrl = iframeMatch[1].startsWith('//') ? `https:${iframeMatch[1]}` : iframeMatch[1];
    ctx.progress(50);
    const rcpHtml = await ctx.proxiedFetcher(rcpUrl, {
        headers: { Referer: embedUrl, 'User-Agent': 'Mozilla/5.0' },
    });
    // Find the script with prorcp
    const scriptMatch = rcpHtml.match(/src\s*:\s*['"]([^'"]+)['"]/);
    if (!scriptMatch)
        throw new errors_1.NotFoundError('prorcp iframe not found');
    const prorcpUrl = scriptMatch[1].startsWith('/') ? `https://cloudnestra.com${scriptMatch[1]}` : scriptMatch[1];
    ctx.progress(70);
    const finalHtml = await ctx.proxiedFetcher(prorcpUrl, {
        headers: { Referer: rcpUrl, 'User-Agent': 'Mozilla/5.0' },
    });
    // Find script containing Playerjs
    const scripts = finalHtml.split('<script');
    let scriptWithPlayer = '';
    for (const script of scripts) {
        if (script.includes('Playerjs')) {
            scriptWithPlayer = script;
            break;
        }
    }
    if (!scriptWithPlayer)
        throw new errors_1.NotFoundError('No Playerjs config found');
    const m3u8Match = scriptWithPlayer.match(/file\s*:\s*['"]([^'"]+)['"]/);
    if (!m3u8Match)
        throw new errors_1.NotFoundError('No file field in Playerjs');
    let streamUrl = m3u8Match[1];
    if (!streamUrl.includes('.m3u8')) {
        // Check if we need to decode the URL
        const v = JSON.parse((0, decrypt_1.decode)(o.u));
        streamUrl = (0, decrypt_1.mirza)(streamUrl, v);
    }
    ctx.progress(90);
    const headers = {
        referer: 'https://cloudnestra.com/',
        origin: 'https://cloudnestra.com',
    };
    return {
        stream: [
            {
                id: 'vidsrc-cloudnestra',
                type: 'hls',
                playlist: streamUrl,
                headers,
                proxyDepth: 2,
                flags: [],
                captions: [],
            },
        ],
        embeds: [],
    };
}
exports.vidsrcScraper = (0, base_1.makeSourcerer)({
    id: 'cloudnestra',
    name: 'Cloudnestra',
    rank: 180,
    flags: [],
    scrapeMovie: vidsrcScrape,
    scrapeShow: vidsrcScrape,
});
// thanks Mirzya for this scraper!
