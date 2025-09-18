"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoembedTeluguScraper = exports.autoembedTamilScraper = exports.autoembedBengaliScraper = exports.autoembedHindiScraper = exports.autoembedEnglishScraper = void 0;
const targets_1 = require("../../entrypoint/utils/targets");
const base_1 = require("../../providers/base");
const providers = [
    {
        id: 'autoembed-english',
        rank: 10,
    },
    {
        id: 'autoembed-hindi',
        rank: 9,
        disabled: true,
    },
    {
        id: 'autoembed-tamil',
        rank: 8,
        disabled: true,
    },
    {
        id: 'autoembed-telugu',
        rank: 7,
        disabled: true,
    },
    {
        id: 'autoembed-bengali',
        rank: 6,
        disabled: true,
    },
];
function embed(provider) {
    return (0, base_1.makeEmbed)({
        id: provider.id,
        name: provider.id
            .split('-')
            .map((word) => word[0].toUpperCase() + word.slice(1))
            .join(' '),
        disabled: provider.disabled,
        rank: provider.rank,
        async scrape(ctx) {
            return {
                stream: [
                    {
                        id: 'primary',
                        type: 'hls',
                        playlist: ctx.url,
                        flags: [targets_1.flags.CORS_ALLOWED],
                        captions: [],
                    },
                ],
            };
        },
    });
}
_a = providers.map(embed), exports.autoembedEnglishScraper = _a[0], exports.autoembedHindiScraper = _a[1], exports.autoembedBengaliScraper = _a[2], exports.autoembedTamilScraper = _a[3], exports.autoembedTeluguScraper = _a[4];
