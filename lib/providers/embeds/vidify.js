"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vidifyEmbeds = void 0;
exports.makeVidifyEmbed = makeVidifyEmbed;
/* eslint-disable no-console */
const errors_1 = require("../../utils/errors");
const proxy_1 = require("../../utils/proxy");
const base_1 = require("../base");
const VIDIFY_SERVERS = ['alfa', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel', 'india', 'juliett'];
const baseUrl = 'api.vidify.top';
const playerUrl = 'https://player.vidify.top/';
let cachedAuthHeader = null;
let lastFetched = 0;
async function getAuthHeader(ctx) {
    const now = Date.now();
    // Cache for 1 hour
    if (cachedAuthHeader && now - lastFetched < 1000 * 60 * 60) {
        return cachedAuthHeader;
    }
    const playerPage = await ctx.proxiedFetcher(playerUrl, {
        headers: {
            Referer: playerUrl,
        },
    });
    const jsFileRegex = /\/assets\/index-([a-zA-Z0-9-]+)\.js/;
    const jsFileMatch = playerPage.match(jsFileRegex);
    if (!jsFileMatch) {
        throw new Error('Could not find the JS file URL in the player page');
    }
    const jsFileUrl = new URL(jsFileMatch[0], playerUrl).href;
    const jsContent = await ctx.proxiedFetcher(jsFileUrl, {
        headers: {
            Referer: playerUrl,
        },
    });
    const authRegex = /Authorization:"Bearer\s*([^"]+)"/;
    const authMatch = jsContent.match(authRegex);
    if (!authMatch || !authMatch[1]) {
        throw new Error('Could not extract the authorization header from the JS file');
    }
    cachedAuthHeader = `Bearer ${authMatch[1]}`;
    lastFetched = now;
    return cachedAuthHeader;
}
function makeVidifyEmbed(id, rank = 100) {
    const serverIndex = VIDIFY_SERVERS.indexOf(id) + 1;
    return (0, base_1.makeEmbed)({
        id: `vidify-${id}`,
        name: `${id.charAt(0).toUpperCase() + id.slice(1)}`,
        rank,
        disabled: true,
        async scrape(ctx) {
            const query = JSON.parse(ctx.url);
            const { type, tmdbId, season, episode } = query;
            let url = `https://${baseUrl}/`;
            if (type === 'movie') {
                url += `/movie/${tmdbId}?sr=${serverIndex}`;
            }
            else if (type === 'show') {
                url += `/tv/${tmdbId}/season/${season}/episode/${episode}?sr=${serverIndex}`;
            }
            else {
                throw new errors_1.NotFoundError('Unsupported media type');
            }
            const authHeader = await getAuthHeader(ctx);
            const headers = {
                referer: 'https://player.vidify.top/',
                origin: 'https://player.vidify.top',
                Authorization: authHeader,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            };
            const res = await ctx.proxiedFetcher(url, { headers });
            console.log(res);
            const playlistUrl = res.m3u8 ?? res.url;
            if (Array.isArray(res.result) && res.result.length > 0) {
                const qualities = {};
                res.result.forEach((r) => {
                    if (r.url.includes('.mp4')) {
                        qualities[`${r.resolution}p`] = { type: 'mp4', url: decodeURIComponent(r.url) };
                    }
                });
                if (Object.keys(qualities).length === 0) {
                    throw new errors_1.NotFoundError('No MP4 streams found');
                }
                console.log(`Found MP4 streams: `, qualities);
                return {
                    stream: [
                        {
                            id: 'primary',
                            type: 'file',
                            qualities,
                            flags: [],
                            captions: [],
                            headers: {
                                Host: 'proxy-worker.himanshu464121.workers.dev', // seems to be their only mp4 proxy
                            },
                        },
                    ],
                };
            }
            if (!playlistUrl)
                throw new errors_1.NotFoundError('No playlist URL found');
            const streamHeaders = { ...headers };
            let playlist;
            if (playlistUrl.includes('proxyv1.vidify.top')) {
                console.log(`Found stream (proxyv1): `, playlistUrl, streamHeaders);
                streamHeaders.Host = 'proxyv1.vidify.top';
                playlist = decodeURIComponent(playlistUrl);
            }
            else if (playlistUrl.includes('proxyv2.vidify.top')) {
                console.log(`Found stream (proxyv2): `, playlistUrl, streamHeaders);
                streamHeaders.Host = 'proxyv2.vidify.top';
                playlist = decodeURIComponent(playlistUrl);
            }
            else {
                console.log(`Found normal stream: `, playlistUrl);
                playlist = (0, proxy_1.createM3U8ProxyUrl)(decodeURIComponent(playlistUrl), streamHeaders);
            }
            ctx.progress(100);
            return {
                stream: [
                    {
                        id: 'primary',
                        type: 'hls',
                        playlist,
                        headers: streamHeaders,
                        flags: [],
                        captions: [],
                    },
                ],
            };
        },
    });
}
exports.vidifyEmbeds = VIDIFY_SERVERS.map((server, i) => makeVidifyEmbed(server, 230 - i));
