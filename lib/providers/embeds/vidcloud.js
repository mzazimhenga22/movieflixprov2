"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vidCloudScraper = void 0;
const base_1 = require("../../providers/base");
const upcloud_1 = require("./upcloud");
exports.vidCloudScraper = (0, base_1.makeEmbed)({
    id: 'vidcloud',
    name: 'VidCloud',
    rank: 201,
    disabled: true,
    async scrape(ctx) {
        // Both vidcloud and upcloud have the same embed domain (rabbitstream.net)
        const result = await upcloud_1.upcloudScraper.scrape(ctx);
        return {
            stream: result.stream.map((s) => ({
                ...s,
                flags: [],
            })),
        };
    },
});
