"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vidnestOfficialEmbed = exports.vidnestFlixhqEmbed = exports.vidnestAllmoviesEmbed = exports.vidnestHollymoviehdEmbed = void 0;
const targets_1 = require("../../entrypoint/utils/targets");
const base_1 = require("../../providers/base");
const errors_1 = require("../../utils/errors");
const proxy_1 = require("../../utils/proxy");
// 🟢 give streams arrays a concrete type to avoid `never[]`
exports.vidnestHollymoviehdEmbed = (0, base_1.makeEmbed)({
    id: 'vidnest-hollymoviehd',
    name: 'HollyMovie',
    rank: 104,
    async scrape(ctx) {
        const serverStreams = await ctx.proxiedFetcher(ctx.url);
        if (!serverStreams.success || !serverStreams.sources) {
            throw new errors_1.NotFoundError('No streams found');
        }
        const streams = []; // ✅ typed array
        for (const source of serverStreams.sources) {
            if (source.file.includes('pkaystream.cc/pl/')) {
                streams.push({
                    id: `hollymoviehd-${source.label}`,
                    type: 'hls',
                    playlist: (0, proxy_1.createM3U8ProxyUrl)(source.file),
                    flags: [targets_1.flags.CORS_ALLOWED],
                    captions: [],
                });
            }
        }
        return {
            stream: streams,
        };
    },
});
exports.vidnestAllmoviesEmbed = (0, base_1.makeEmbed)({
    id: 'vidnest-allmovies',
    name: 'AllMovies (Hindi)',
    rank: 103,
    async scrape(ctx) {
        const serverStreams = await ctx.proxiedFetcher(ctx.url);
        if (!serverStreams.streams) {
            throw new errors_1.NotFoundError('No streams found');
        }
        const streams = []; // ✅ typed array
        for (const stream of serverStreams.streams) {
            streams.push({
                id: `allmovies-${stream.language}`,
                type: 'hls',
                playlist: stream.url,
                flags: [targets_1.flags.CORS_ALLOWED],
                captions: [],
                preferredHeaders: stream.headers,
            });
        }
        return {
            stream: streams,
        };
    },
});
exports.vidnestFlixhqEmbed = (0, base_1.makeEmbed)({
    id: 'vidnest-flixhq',
    name: 'FlixHQ',
    rank: 102,
    disabled: true,
    async scrape() {
        throw new Error('Not implemented');
    },
});
exports.vidnestOfficialEmbed = (0, base_1.makeEmbed)({
    id: 'vidnest-official',
    name: 'Official',
    rank: 101,
    disabled: true,
    async scrape() {
        throw new Error('Not implemented');
    },
});
