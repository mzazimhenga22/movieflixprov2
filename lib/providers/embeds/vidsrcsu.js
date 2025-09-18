"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VidsrcsuServer20Scraper = exports.VidsrcsuServer12Scraper = exports.VidsrcsuServer11Scraper = exports.VidsrcsuServer10Scraper = exports.VidsrcsuServer9Scraper = exports.VidsrcsuServer8Scraper = exports.VidsrcsuServer7Scraper = exports.VidsrcsuServer6Scraper = exports.VidsrcsuServer5Scraper = exports.VidsrcsuServer4Scraper = exports.VidsrcsuServer3Scraper = exports.VidsrcsuServer2Scraper = exports.VidsrcsuServer1Scraper = void 0;
const targets_1 = require("../../entrypoint/utils/targets");
const base_1 = require("../../providers/base");
const providers = [
    {
        id: 'server-13',
        rank: 112,
    },
    {
        id: 'server-18',
        rank: 111,
    },
    {
        id: 'server-11',
        rank: 102,
    },
    {
        id: 'server-7',
        rank: 92,
    },
    {
        id: 'server-10',
        rank: 82,
    },
    {
        id: 'server-1',
        rank: 72,
    },
    {
        id: 'server-16',
        rank: 64,
    },
    {
        id: 'server-3',
        rank: 62,
    },
    {
        id: 'server-17',
        rank: 52,
    },
    {
        id: 'server-2',
        rank: 42,
    },
    {
        id: 'server-4',
        rank: 32,
    },
    {
        id: 'server-5',
        rank: 24,
    },
    {
        id: 'server-14', // catflix? uwu.m3u8
        rank: 22,
    },
    {
        id: 'server-6',
        rank: 21,
    },
    {
        id: 'server-15',
        rank: 20,
    },
    {
        id: 'server-8',
        rank: 19,
    },
    {
        id: 'server-9',
        rank: 18,
    },
    {
        id: 'server-19',
        rank: 17,
    },
    {
        id: 'server-12',
        rank: 16,
    },
    // { // Looks like this was removed
    //   id: 'server-20',
    //   rank: 1,
    //   name: 'Cineby',
    // },
];
function embed(provider) {
    return (0, base_1.makeEmbed)({
        id: provider.id,
        name: provider.name ||
            provider.id
                .split('-')
                .map((word) => word[0].toUpperCase() + word.slice(1))
                .join(' '),
        // disabled: provider.disabled,
        disabled: true,
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
_a = providers.map(embed), exports.VidsrcsuServer1Scraper = _a[0], exports.VidsrcsuServer2Scraper = _a[1], exports.VidsrcsuServer3Scraper = _a[2], exports.VidsrcsuServer4Scraper = _a[3], exports.VidsrcsuServer5Scraper = _a[4], exports.VidsrcsuServer6Scraper = _a[5], exports.VidsrcsuServer7Scraper = _a[6], exports.VidsrcsuServer8Scraper = _a[7], exports.VidsrcsuServer9Scraper = _a[8], exports.VidsrcsuServer10Scraper = _a[9], exports.VidsrcsuServer11Scraper = _a[10], exports.VidsrcsuServer12Scraper = _a[11], exports.VidsrcsuServer20Scraper = _a[12];
