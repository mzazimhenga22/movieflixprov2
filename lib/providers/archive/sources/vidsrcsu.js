"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vidsrcsuScraper = void 0;
const targets_1 = require("../../../entrypoint/utils/targets");
const base_1 = require("../../../providers/base");
const errors_1 = require("../../../utils/errors");
const proxy_1 = require("../../../utils/proxy");
// REQUIRES A PROXY FOR MOST SERVERS set it up here https://github.com/Pasithea0/M3U8-Proxy
function createProxyUrl(originalUrl, referer) {
    const headers = {
        referer,
    };
    return (0, proxy_1.createM3U8ProxyUrl)(originalUrl, headers);
}
function processProxiedURL(url) {
    // Handle orbitproxy URLs
    if (url.includes('orbitproxy')) {
        try {
            const urlParts = url.split(/orbitproxy\.[^/]+\//);
            if (urlParts.length >= 2) {
                const encryptedPart = urlParts[1].split('.m3u8')[0];
                try {
                    const decodedData = Buffer.from(encryptedPart, 'base64').toString('utf-8');
                    const jsonData = JSON.parse(decodedData);
                    const originalUrl = jsonData.u;
                    const referer = jsonData.r || '';
                    return createProxyUrl(originalUrl, referer);
                }
                catch (jsonError) {
                    console.error('Error decoding/parsing orbitproxy data:', jsonError);
                }
            }
        }
        catch (error) {
            console.error('Error processing orbitproxy URL:', error);
        }
    }
    // Handle other proxied URLs
    if (url.includes('/m3u8-proxy?url=')) {
        return (0, proxy_1.updateM3U8ProxyUrl)(url);
    }
    return url;
}
const getHost = () => {
    const urlObj = new URL(window.location.href);
    return `${urlObj.protocol}//${urlObj.host}`;
};
async function comboScraper(ctx) {
    const embedPage = await ctx.proxiedFetcher(`https://vidsrc.su/embed/${ctx.media.type === 'movie' ? `movie/${ctx.media.tmdbId}` : `tv/${ctx.media.tmdbId}/${ctx.media.season.number}/${ctx.media.episode.number}`}`, {
        headers: {
            Referer: getHost(),
        },
    });
    // eslint-disable-next-line no-console
    console.log('host', getHost());
    ctx.progress(30);
    const decodedPeterMatch = embedPage.match(/decodeURIComponent\('([^']+)'\)/);
    const decodedPeterUrl = decodedPeterMatch ? decodeURIComponent(decodedPeterMatch[1]) : null;
    const serverMatches = [...embedPage.matchAll(/label: 'Server (\d+)', url: '(https.*)'/g)];
    const servers = serverMatches.map((match) => ({
        serverNumber: parseInt(match[1], 10),
        url: match[2],
    }));
    if (decodedPeterUrl) {
        servers.push({
            serverNumber: 40,
            url: decodedPeterUrl,
        });
    }
    ctx.progress(60);
    if (!servers.length)
        throw new errors_1.NotFoundError('No server playlist found');
    const processedServers = servers.map((server) => ({
        ...server,
        url: processProxiedURL(server.url),
    }));
    const embeds = processedServers.map((server) => ({
        embedId: `server-${server.serverNumber}`,
        url: server.url,
    }));
    ctx.progress(90);
    return {
        embeds,
    };
}
exports.vidsrcsuScraper = (0, base_1.makeSourcerer)({
    id: 'vidsrcsu',
    name: 'vidsrc.su',
    rank: 140,
    disabled: true,
    flags: [targets_1.flags.CORS_ALLOWED],
    scrapeMovie: comboScraper,
    scrapeShow: comboScraper,
});
