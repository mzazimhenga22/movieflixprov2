"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filelionsScraper = void 0;
const targets_1 = require("../../../entrypoint/utils/targets");
const base_1 = require("../../../providers/base");
const linkRegex = /file: ?"(http.*?)"/;
// the white space charecters may seem useless, but without them it breaks
const tracksRegex = /\{file:\s"([^"]+)",\skind:\s"thumbnails"\}/g;
exports.filelionsScraper = (0, base_1.makeEmbed)({
    id: 'filelions',
    name: 'filelions',
    rank: 115,
    async scrape(ctx) {
        const mainPageRes = await ctx.proxiedFetcher.full(ctx.url, {
            headers: {
                referer: ctx.url,
            },
        });
        const mainPage = mainPageRes.body;
        const mainPageUrl = new URL(mainPageRes.finalUrl);
        const streamUrl = mainPage.match(linkRegex) ?? [];
        const thumbnailTrack = tracksRegex.exec(mainPage);
        const playlist = streamUrl[1];
        if (!playlist)
            throw new Error('Stream url not found');
        return {
            stream: [
                {
                    id: 'primary',
                    type: 'hls',
                    playlist,
                    flags: [targets_1.flags.IP_LOCKED, targets_1.flags.CORS_ALLOWED],
                    captions: [],
                    ...(thumbnailTrack
                        ? {
                            thumbnailTrack: {
                                type: 'vtt',
                                url: mainPageUrl.origin + thumbnailTrack[1],
                            },
                        }
                        : {}),
                },
            ],
        };
    },
});
