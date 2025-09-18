"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.warezcdnembedHlsScraper = void 0;
const targets_1 = require("../../../entrypoint/utils/targets");
const base_1 = require("../../../providers/base");
const errors_1 = require("../../../utils/errors");
const common_1 = require("./common");
// Method found by atpn
async function getVideowlUrlStream(ctx, decryptedId) {
    const sharePage = await ctx.proxiedFetcher('https://cloud.mail.ru/public/uaRH/2PYWcJRpH');
    const regex = /"videowl_view":\{"count":"(\d+)","url":"([^"]+)"\}/g;
    const videowlUrl = regex.exec(sharePage)?.[2];
    if (!videowlUrl)
        throw new errors_1.NotFoundError('Failed to get videoOwlUrl');
    return `${videowlUrl}/0p/${btoa(decryptedId)}.m3u8?${new URLSearchParams({
        double_encode: '1',
    })}`;
}
exports.warezcdnembedHlsScraper = (0, base_1.makeEmbed)({
    id: 'warezcdnembedhls', // WarezCDN is both a source and an embed host
    name: 'WarezCDN HLS',
    // method no longer works
    disabled: true,
    rank: 83,
    async scrape(ctx) {
        const decryptedId = await (0, common_1.getDecryptedId)(ctx);
        if (!decryptedId)
            throw new errors_1.NotFoundError("can't get file id");
        const streamUrl = await getVideowlUrlStream(ctx, decryptedId);
        return {
            stream: [
                {
                    id: 'primary',
                    type: 'hls',
                    flags: [targets_1.flags.IP_LOCKED],
                    captions: [],
                    playlist: streamUrl,
                },
            ],
        };
    },
});
