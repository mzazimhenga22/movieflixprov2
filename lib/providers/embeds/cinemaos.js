"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cinemaosHexaEmbeds = exports.HEXA_SERVERS = exports.cinemaosEmbeds = void 0;
exports.makeCinemaOSEmbed = makeCinemaOSEmbed;
exports.makeCinemaOSHexaEmbed = makeCinemaOSHexaEmbed;
const targets_1 = require("../../entrypoint/utils/targets");
const base_1 = require("../../providers/base");
const errors_1 = require("../../utils/errors");
const proxy_1 = require("../../utils/proxy");
const CINEMAOS_API = atob('aHR0cHM6Ly9jaW5lbWFvcy12My52ZXJjZWwuYXBwL2FwaS9uZW8vYmFja2VuZGZldGNo');
function makeCinemaOSEmbed(server, rank) {
    return (0, base_1.makeEmbed)({
        id: `cinemaos-${server}`,
        name: `${server.charAt(0).toUpperCase() + server.slice(1)}`,
        rank,
        disabled: true,
        async scrape(ctx) {
            const query = JSON.parse(ctx.url);
            const { tmdbId, type, season, episode } = query;
            let url = `${CINEMAOS_API}?requestID=${type === 'show' ? 'tvVideoProvider' : 'movieVideoProvider'}&id=${tmdbId}&service=${server}`;
            if (type === 'show') {
                url += `&season=${season}&episode=${episode}`;
            }
            const res = await ctx.proxiedFetcher(url);
            const data = typeof res === 'string' ? JSON.parse(res) : res;
            const sources = data?.data?.sources;
            if (!sources || !Array.isArray(sources) || sources.length === 0) {
                throw new errors_1.NotFoundError('No sources found');
            }
            ctx.progress(80);
            // If only one source, return as a single HLS stream
            if (sources.length === 1) {
                return {
                    stream: [
                        {
                            id: 'primary',
                            type: 'hls',
                            playlist: sources[0].url,
                            flags: [targets_1.flags.CORS_ALLOWED],
                            captions: [],
                        },
                    ],
                };
            }
            // If multiple sources, treat as file with qualities
            const qualityMap = {};
            for (const src of sources) {
                const quality = (src.quality || src.source || 'unknown').toString();
                let qualityKey;
                if (quality === '4K') {
                    qualityKey = 2160;
                }
                else {
                    qualityKey = parseInt(quality.replace('P', ''), 10);
                }
                if (Number.isNaN(qualityKey) || qualityMap[qualityKey])
                    continue;
                qualityMap[qualityKey] = {
                    type: 'mp4',
                    url: src.url,
                };
            }
            return {
                stream: [
                    {
                        id: 'primary',
                        type: 'file',
                        flags: [targets_1.flags.CORS_ALLOWED],
                        qualities: qualityMap,
                        captions: [],
                    },
                ],
            };
        },
    });
}
// List of supported servers and their ranks (descending order)
const CINEMAOS_SERVERS = [
    //   'flowcast',
    'shadow',
    'asiacloud',
    //   'hindicast',
    //   'anime',
    //   'animez',
    //   'guard',
    //   'hq',
    //   'ninja',
    //   'alpha',
    //   'kaze',
    //   'zenith',
    //   'cast',
    //   'ghost',
    //   'halo',
    //   'kinoecho',
    //   'ee3',
    //   'volt',
    //   'putafilme',
    'ophim',
    //   'kage',
];
exports.cinemaosEmbeds = CINEMAOS_SERVERS.map((server, i) => makeCinemaOSEmbed(server, 300 - i));
function makeCinemaOSHexaEmbed(id, rank = 100) {
    return (0, base_1.makeEmbed)({
        id: `cinemaos-hexa-${id}`,
        name: `Hexa ${id.charAt(0).toUpperCase() + id.slice(1)}`,
        disabled: true,
        rank,
        async scrape(ctx) {
            const query = JSON.parse(ctx.url);
            const directUrl = query.directUrl;
            if (!directUrl) {
                throw new errors_1.NotFoundError('No directUrl provided for Hexa embed');
            }
            // Headers needed for the M3U8 proxy
            const headers = {
                referer: 'https://megacloud.store/',
                origin: 'https://megacloud.store',
            };
            return {
                stream: [
                    {
                        id: 'primary',
                        type: 'hls',
                        playlist: (0, proxy_1.createM3U8ProxyUrl)(directUrl, headers),
                        flags: [targets_1.flags.CORS_ALLOWED],
                        captions: [],
                    },
                ],
            };
        },
    });
}
// List of all Hexa servers and their rank (descending order)
exports.HEXA_SERVERS = ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel', 'india'];
exports.cinemaosHexaEmbeds = exports.HEXA_SERVERS.map((server, i) => makeCinemaOSHexaEmbed(server, 315 - i));
