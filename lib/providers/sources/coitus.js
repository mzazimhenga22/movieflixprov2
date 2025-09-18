"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.coitusScraper = void 0;
const targets_1 = require("../../entrypoint/utils/targets");
const base_1 = require("../../providers/base");
const errors_1 = require("../../utils/errors");
const proxy_1 = require("../../utils/proxy");
const baseUrl = 'https://api.coitus.ca';
async function comboScraper(ctx) {
    const apiUrl = ctx.media.type === 'movie'
        ? `${baseUrl}/movie/${ctx.media.tmdbId}`
        : `${baseUrl}/tv/${ctx.media.tmdbId}/${ctx.media.season.number}/${ctx.media.episode.number}`;
    const apiRes = await ctx.proxiedFetcher(apiUrl);
    if (!apiRes.videoSource)
        throw new errors_1.NotFoundError('No watchable item found');
    let processedUrl = apiRes.videoSource;
    if (processedUrl.includes('orbitproxy')) {
        try {
            const urlParts = processedUrl.split(/orbitproxy\.[^/]+\//);
            if (urlParts.length >= 2) {
                const encryptedPart = urlParts[1].split('.m3u8')[0];
                try {
                    const decodedData = Buffer.from(encryptedPart, 'base64').toString('utf-8');
                    const jsonData = JSON.parse(decodedData);
                    const originalUrl = jsonData.u;
                    const referer = jsonData.r || '';
                    const headers = { referer };
                    processedUrl = (0, proxy_1.createM3U8ProxyUrl)(originalUrl, headers);
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
    // eslint-disable-next-line no-console
    console.log(apiRes);
    ctx.progress(90);
    return {
        embeds: [],
        stream: [
            {
                id: 'primary',
                captions: [],
                playlist: processedUrl,
                type: 'hls',
                flags: [targets_1.flags.CORS_ALLOWED],
            },
        ],
    };
}
exports.coitusScraper = (0, base_1.makeSourcerer)({
    id: 'coitus',
    name: 'Autoembed+',
    rank: 91,
    disabled: true,
    flags: [targets_1.flags.CORS_ALLOWED],
    scrapeMovie: comboScraper,
    scrapeShow: comboScraper,
});
