"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rgshowsScraper = void 0;
const errors_1 = require("../../utils/errors");
const base_1 = require("../base");
const baseUrl = 'api.rgshows.me';
const headers = {
    referer: 'https://rgshows.me/',
    origin: 'https://rgshows.me',
    host: baseUrl,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
};
async function comboScraper(ctx) {
    let url = `https://${baseUrl}/main`;
    if (ctx.media.type === 'movie') {
        url += `/movie/${ctx.media.tmdbId}`;
    }
    else if (ctx.media.type === 'show') {
        url += `/tv/${ctx.media.tmdbId}/${ctx.media.season.number}/${ctx.media.episode.number}`;
    }
    const res = await ctx.proxiedFetcher(url, { headers });
    if (!res?.stream?.url) {
        throw new errors_1.NotFoundError('No streams found');
    }
    if (res.stream.url === 'https://vidzee.wtf/playlist/69/master.m3u8') {
        throw new errors_1.NotFoundError('Found only vidzee porn stream');
    }
    const streamUrl = res.stream.url;
    const streamHost = new URL(streamUrl).host;
    const m3u8Headers = {
        ...headers,
        host: streamHost,
        origin: 'https://www.rgshows.me',
        referer: 'https://www.rgshows.me/',
    };
    ctx.progress(100);
    return {
        embeds: [],
        stream: [
            {
                id: 'primary',
                type: 'hls',
                playlist: streamUrl,
                headers: m3u8Headers,
                flags: [],
                captions: [],
            },
        ],
    };
}
exports.rgshowsScraper = (0, base_1.makeSourcerer)({
    id: 'rgshows',
    name: 'RGShows',
    rank: 173,
    flags: [],
    scrapeMovie: comboScraper,
    scrapeShow: comboScraper,
});
