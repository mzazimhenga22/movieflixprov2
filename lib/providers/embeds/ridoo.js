"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ridooScraper = void 0;
const targets_1 = require("../../entrypoint/utils/targets");
const errors_1 = require("../../utils/errors");
const base_1 = require("../base");
const referer = 'https://ridomovies.tv/';
const playlistHeaders = {
    referer: 'https://ridoo.net/',
    origin: 'https://ridoo.net',
};
exports.ridooScraper = (0, base_1.makeEmbed)({
    id: 'ridoo',
    name: 'Ridoo',
    rank: 121,
    async scrape(ctx) {
        const res = await ctx.proxiedFetcher(ctx.url, {
            headers: {
                referer,
            },
        });
        const regexPattern = /file:"([^"]+)"/g;
        const url = regexPattern.exec(res)?.[1];
        if (!url)
            throw new errors_1.NotFoundError('Unable to find source url');
        return {
            stream: [
                {
                    id: 'primary',
                    type: 'hls',
                    playlist: url,
                    headers: playlistHeaders,
                    captions: [],
                    flags: [targets_1.flags.CORS_ALLOWED],
                },
            ],
        };
    },
});
