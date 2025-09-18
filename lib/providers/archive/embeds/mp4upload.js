"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mp4uploadScraper = void 0;
const targets_1 = require("../../../entrypoint/utils/targets");
const base_1 = require("../../../providers/base");
exports.mp4uploadScraper = (0, base_1.makeEmbed)({
    id: 'mp4upload',
    name: 'mp4upload',
    rank: 170,
    async scrape(ctx) {
        const embed = await ctx.proxiedFetcher(ctx.url);
        const playerSrcRegex = /(?<=player\.src\()\s*{\s*type:\s*"[^"]+",\s*src:\s*"([^"]+)"\s*}\s*(?=\);)/s;
        const playerSrc = embed.match(playerSrcRegex) ?? [];
        const streamUrl = playerSrc[1];
        if (!streamUrl)
            throw new Error('Stream url not found in embed code');
        return {
            stream: [
                {
                    id: 'primary',
                    type: 'file',
                    flags: [targets_1.flags.CORS_ALLOWED],
                    captions: [],
                    qualities: {
                        '1080': {
                            type: 'mp4',
                            url: streamUrl,
                        },
                    },
                },
            ],
        };
    },
});
