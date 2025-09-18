"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.voeScraper = void 0;
const targets_1 = require("../../../entrypoint/utils/targets");
const base_1 = require("../../../providers/base");
const linkRegex = /'hls': ?'(http.*?)',/;
const tracksRegex = /previewThumbnails:\s{.*src:\["([^"]+)"]/;
exports.voeScraper = (0, base_1.makeEmbed)({
    id: 'voe',
    name: 'voe.sx',
    rank: 180,
    async scrape(ctx) {
        const embedRes = await ctx.proxiedFetcher.full(ctx.url);
        const embed = embedRes.body;
        const playerSrc = embed.match(linkRegex) ?? [];
        const thumbnailTrack = embed.match(tracksRegex);
        const streamUrl = playerSrc[1];
        if (!streamUrl)
            throw new Error('Stream url not found in embed code');
        return {
            stream: [
                {
                    type: 'hls',
                    id: 'primary',
                    playlist: streamUrl,
                    flags: [targets_1.flags.CORS_ALLOWED, targets_1.flags.IP_LOCKED],
                    captions: [],
                    headers: {
                        Referer: 'https://voe.sx',
                    },
                    ...(thumbnailTrack
                        ? {
                            thumbnailTrack: {
                                type: 'vtt',
                                url: new URL(embedRes.finalUrl).origin + thumbnailTrack[1],
                            },
                        }
                        : {}),
                },
            ],
        };
    },
});
