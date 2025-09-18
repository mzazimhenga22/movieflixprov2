"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.vidsrcNovaEmbed = exports.vidsrcPulsarEmbed = exports.vidsrcCometEmbed = void 0;
const targets_1 = require("../../entrypoint/utils/targets");
const base_1 = require("../../providers/base");
const proxy_1 = require("../../utils/proxy");
const embeds = [
    {
        id: 'vidsrc-comet',
        name: 'Comet',
        rank: 39,
    },
    {
        id: 'vidsrc-pulsar',
        name: 'Pulsar',
        rank: 38,
    },
    {
        id: 'vidsrc-nova',
        name: 'Nova',
        rank: 37,
    },
];
const headers = {
    referer: 'https://vidsrc.vip/',
    origin: 'https://vidsrc.vip',
};
function makeVidSrcEmbed(provider) {
    return (0, base_1.makeEmbed)({
        id: provider.id,
        name: provider.name,
        rank: provider.rank,
        async scrape(ctx) {
            if (ctx.url.includes('https://cdn.niggaflix.xyz')) {
                return {
                    stream: [
                        {
                            id: 'primary',
                            type: 'hls',
                            playlist: (0, proxy_1.createM3U8ProxyUrl)(ctx.url, headers),
                            flags: [targets_1.flags.CORS_ALLOWED],
                            captions: [],
                        },
                    ],
                };
            }
            return {
                stream: [
                    {
                        id: 'primary',
                        type: 'hls',
                        playlist: ctx.url,
                        flags: [targets_1.flags.CORS_ALLOWED],
                        captions: [],
                    },
                ],
            };
        },
    });
}
_a = embeds.map(makeVidSrcEmbed), exports.vidsrcCometEmbed = _a[0], exports.vidsrcPulsarEmbed = _a[1], exports.vidsrcNovaEmbed = _a[2];
