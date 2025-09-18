"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.madplayNsapiVidFastEmbed = exports.madplayRoperEmbed = exports.madplayNsapiEmbed = exports.madplayBaseEmbed = void 0;
/* eslint-disable no-console */
const targets_1 = require("../../entrypoint/utils/targets");
const errors_1 = require("../../utils/errors");
const proxy_1 = require("../../utils/proxy");
const base_1 = require("../base");
const baseUrl = 'madplay.site';
const headers = {
    referer: 'https://madplay.site/',
    origin: 'https://madplay.site',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
};
exports.madplayBaseEmbed = (0, base_1.makeEmbed)({
    id: 'madplay-base',
    name: 'Base',
    rank: 134,
    async scrape(ctx) {
        const query = JSON.parse(ctx.url);
        const { type, tmdbId, season, episode } = query;
        let url = `https://${baseUrl}/api/playsrc`;
        if (type === 'movie') {
            url += `?id=${tmdbId}`;
        }
        else if (type === 'show') {
            url += `?id=${tmdbId}&season=${season}&episode=${episode}`;
        }
        const res = await ctx.proxiedFetcher(url, { headers });
        console.log(res);
        if (!Array.isArray(res) || res.length === 0) {
            throw new errors_1.NotFoundError('No streams found');
        }
        const stream = res[0];
        if (!stream.file) {
            throw new errors_1.NotFoundError('No file URL found in stream');
        }
        ctx.progress(100);
        return {
            stream: [
                {
                    id: 'primary',
                    type: 'hls',
                    playlist: (0, proxy_1.createM3U8ProxyUrl)(stream.file, headers),
                    flags: [targets_1.flags.CORS_ALLOWED],
                    captions: [],
                },
            ],
        };
    },
});
exports.madplayNsapiEmbed = (0, base_1.makeEmbed)({
    id: 'madplay-nsapi',
    name: 'Northstar',
    rank: 133,
    async scrape(ctx) {
        const query = JSON.parse(ctx.url);
        const { type, tmdbId, season, episode } = query;
        let url = `https://${baseUrl}/api/nsapi/vid`;
        if (type === 'movie') {
            url += `?id=${tmdbId}`;
        }
        else if (type === 'show') {
            url += `?id=${tmdbId}&season=${season}&episode=${episode}`;
        }
        const res = await ctx.proxiedFetcher(url, { headers });
        console.log(res);
        if (!Array.isArray(res) || res.length === 0) {
            throw new errors_1.NotFoundError('No streams found');
        }
        const stream = res[0];
        if (!stream.url) {
            throw new errors_1.NotFoundError('No file URL found in stream');
        }
        ctx.progress(100);
        return {
            stream: [
                {
                    id: 'primary',
                    type: 'hls',
                    playlist: (0, proxy_1.createM3U8ProxyUrl)(stream.url, stream.headers || headers),
                    flags: [targets_1.flags.CORS_ALLOWED],
                    captions: [],
                },
            ],
        };
    },
});
exports.madplayRoperEmbed = (0, base_1.makeEmbed)({
    id: 'madplay-roper',
    name: 'Roper',
    rank: 132,
    async scrape(ctx) {
        const query = JSON.parse(ctx.url);
        const { type, tmdbId, season, episode } = query;
        let url = `https://${baseUrl}/api/roper/`;
        if (type === 'movie') {
            url += `?id=${tmdbId}&type=movie`;
        }
        else if (type === 'show') {
            url += `?id=${tmdbId}&season=${season}&episode=${episode}&type=series`;
        }
        const res = await ctx.proxiedFetcher(url, { headers });
        console.log(res);
        if (!Array.isArray(res) || res.length === 0) {
            throw new errors_1.NotFoundError('No streams found');
        }
        const stream = res[0];
        if (!stream.url) {
            throw new errors_1.NotFoundError('No file URL found in stream');
        }
        ctx.progress(100);
        return {
            stream: [
                {
                    id: 'primary',
                    type: 'hls',
                    playlist: (0, proxy_1.createM3U8ProxyUrl)(stream.url, stream.headers || headers),
                    flags: [targets_1.flags.CORS_ALLOWED],
                    captions: [],
                },
            ],
        };
    },
});
exports.madplayNsapiVidFastEmbed = (0, base_1.makeEmbed)({
    id: 'madplay-vidfast',
    name: 'Vidfast',
    rank: 131,
    async scrape(ctx) {
        const query = JSON.parse(ctx.url);
        const { type, tmdbId, season, episode } = query;
        let url = `https://${baseUrl}/api/nsapi/test?url=https://vidfast.pro/`;
        if (type === 'movie') {
            url += `/movie/${tmdbId}`;
        }
        else if (type === 'show') {
            url += `/tv/${tmdbId}/${season}/${episode}`;
        }
        const res = await ctx.proxiedFetcher(url, { headers });
        console.log(res);
        if (!Array.isArray(res) || res.length === 0) {
            throw new errors_1.NotFoundError('No streams found');
        }
        const stream = res[0];
        if (!stream.url) {
            throw new errors_1.NotFoundError('No file URL found in stream');
        }
        ctx.progress(100);
        return {
            stream: [
                {
                    id: 'primary',
                    type: 'hls',
                    playlist: (0, proxy_1.createM3U8ProxyUrl)(stream.url, stream.headers || headers),
                    flags: [targets_1.flags.CORS_ALLOWED],
                    captions: [],
                },
            ],
        };
    },
});
