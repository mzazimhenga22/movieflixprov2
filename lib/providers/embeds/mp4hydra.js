"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.mp4hydraServer2Scraper = exports.mp4hydraServer1Scraper = void 0;
const targets_1 = require("../../entrypoint/utils/targets");
const base_1 = require("../../providers/base");
const quality_1 = require("../../utils/quality");
const providers = [
    {
        id: 'mp4hydra-1',
        name: 'MP4Hydra Server 1',
        rank: 36,
    },
    {
        id: 'mp4hydra-2',
        name: 'MP4Hydra Server 2',
        rank: 35,
        disabled: true,
    },
];
function embed(provider) {
    return (0, base_1.makeEmbed)({
        id: provider.id,
        name: provider.name,
        // disabled: provider.disabled,
        disabled: true,
        rank: provider.rank,
        async scrape(ctx) {
            const [url, quality] = ctx.url.split('|');
            return {
                stream: [
                    {
                        id: 'primary',
                        type: 'file',
                        qualities: {
                            [(0, quality_1.getValidQualityFromString)(quality || '')]: { url, type: 'mp4' },
                        },
                        flags: [targets_1.flags.CORS_ALLOWED],
                        captions: [],
                    },
                ],
            };
        },
    });
}
_a = providers.map(embed), exports.mp4hydraServer1Scraper = _a[0], exports.mp4hydraServer2Scraper = _a[1];
