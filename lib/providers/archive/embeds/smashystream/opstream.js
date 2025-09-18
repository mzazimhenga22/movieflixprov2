"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.smashyStreamOScraper = void 0;
const base_1 = require("../../../../providers/base");
const video1_1 = require("./video1");
exports.smashyStreamOScraper = (0, base_1.makeEmbed)({
    // the scraping logic for all smashystream embeds is the same
    // all the embeds can be added in the same way
    id: 'smashystream-o',
    name: 'SmashyStream (O)',
    rank: 70,
    async scrape(ctx) {
        const result = await video1_1.smashyStreamFScraper.scrape(ctx);
        return {
            stream: result.stream,
        };
    },
});
