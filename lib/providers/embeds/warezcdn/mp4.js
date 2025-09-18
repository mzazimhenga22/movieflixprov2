"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.warezcdnembedMp4Scraper = void 0;
const targets_1 = require("../../../entrypoint/utils/targets");
const base_1 = require("../../../providers/base");
const common_1 = require("../../../providers/sources/warezcdn/common");
const errors_1 = require("../../../utils/errors");
const common_2 = require("./common");
const cdnListing = [50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64];
async function checkUrls(ctx, fileId) {
    for (const id of cdnListing) {
        const url = `https://cloclo${id}.cloud.mail.ru/weblink/view/${fileId}`;
        const response = await ctx.proxiedFetcher.full(url, {
            method: 'GET',
            headers: {
                Range: 'bytes=0-1',
            },
        });
        if (response.statusCode === 206)
            return url;
    }
    return null;
}
exports.warezcdnembedMp4Scraper = (0, base_1.makeEmbed)({
    id: 'warezcdnembedmp4', // WarezCDN is both a source and an embed host
    name: 'WarezCDN MP4',
    // method no longer works
    rank: 82,
    disabled: true,
    async scrape(ctx) {
        const decryptedId = await (0, common_2.getDecryptedId)(ctx);
        if (!decryptedId)
            throw new errors_1.NotFoundError("can't get file id");
        const streamUrl = await checkUrls(ctx, decryptedId);
        if (!streamUrl)
            throw new errors_1.NotFoundError("can't get stream id");
        return {
            stream: [
                {
                    id: 'primary',
                    captions: [],
                    qualities: {
                        unknown: {
                            type: 'mp4',
                            url: `${common_1.warezcdnWorkerProxy}/?${new URLSearchParams({
                                url: streamUrl,
                            })}`,
                        },
                    },
                    type: 'file',
                    flags: [targets_1.flags.CORS_ALLOWED],
                },
            ],
        };
    },
});
