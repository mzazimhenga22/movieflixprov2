"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.viperScraper = void 0;
const targets_1 = require("../../entrypoint/utils/targets");
const base_1 = require("../../providers/base");
const errors_1 = require("../../utils/errors");
const proxy_1 = require("../../utils/proxy");
exports.viperScraper = (0, base_1.makeEmbed)({
    id: 'viper',
    name: 'Viper',
    rank: 182,
    disabled: true,
    async scrape(ctx) {
        const apiResponse = await ctx.proxiedFetcher.full(ctx.url, {
            headers: {
                Accept: 'application/json',
                Referer: 'https://embed.su/',
            },
        });
        if (!apiResponse.body.source) {
            throw new errors_1.NotFoundError('No source found');
        }
        const playlistUrl = apiResponse.body.source.replace(/^.*\/viper\//, 'https://');
        // Headers needed for the M3U8 proxy
        const headers = {
            referer: 'https://megacloud.store/',
            origin: 'https://megacloud.store',
        };
        return {
            stream: [
                {
                    type: 'hls',
                    id: 'primary',
                    playlist: (0, proxy_1.createM3U8ProxyUrl)(playlistUrl, headers),
                    flags: [targets_1.flags.CORS_ALLOWED],
                    captions: [],
                },
            ],
        };
    },
});
