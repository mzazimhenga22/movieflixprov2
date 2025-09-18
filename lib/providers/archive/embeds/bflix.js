"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bflixScraper = void 0;
const unpacker_1 = require("unpacker");
const base_1 = require("../../../providers/base");
const evalCodeRegex = /eval\((.*)\)/g;
const mp4Regex = /https?:\/\/.*\.mp4/;
exports.bflixScraper = (0, base_1.makeEmbed)({
    id: 'bflix',
    name: 'bFlix',
    disabled: true,
    rank: 113,
    scrape: async (ctx) => {
        const mainPage = await ctx.proxiedFetcher(ctx.url);
        const evalCode = mainPage.match(evalCodeRegex);
        if (!evalCode)
            throw new Error('Failed to find eval code');
        const unpacked = (0, unpacker_1.unpack)(evalCode[0]);
        const file = unpacked.match(mp4Regex);
        if (!file?.[0])
            throw new Error('Failed to find file');
        return {
            stream: [
                {
                    id: 'primary',
                    type: 'file',
                    flags: [],
                    captions: [],
                    qualities: {
                        unknown: {
                            type: 'mp4',
                            url: file[0],
                        },
                    },
                    headers: {
                        Referer: 'https://bflix.gs/',
                    },
                },
            ],
        };
    },
});
