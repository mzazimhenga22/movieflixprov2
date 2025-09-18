"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamtapeLatinoScraper = exports.streamtapeScraper = void 0;
const targets_1 = require("../../entrypoint/utils/targets");
const base_1 = require("../../providers/base");
const providers = [
    {
        id: 'streamtape',
        name: 'Streamtape',
        rank: 160,
    },
    {
        id: 'streamtape-latino',
        name: 'Streamtape (Latino)',
        rank: 159,
    },
];
function embed(provider) {
    return (0, base_1.makeEmbed)({
        id: provider.id,
        name: provider.name,
        rank: provider.rank,
        async scrape(ctx) {
            const embedHtml = await ctx.proxiedFetcher(ctx.url);
            const match = embedHtml.match(/robotlink'\).innerHTML = (.*)'/);
            if (!match)
                throw new Error('No match found');
            const [fh, sh] = match?.[1]?.split("+ ('") ?? [];
            if (!fh || !sh)
                throw new Error('No match found');
            const url = `https:${fh?.replace(/'/g, '').trim()}${sh?.substring(3).trim()}`;
            return {
                stream: [
                    {
                        id: 'primary',
                        type: 'file',
                        flags: [targets_1.flags.CORS_ALLOWED, targets_1.flags.IP_LOCKED],
                        captions: [],
                        qualities: {
                            unknown: {
                                type: 'mp4',
                                url,
                            },
                        },
                        headers: {
                            Referer: 'https://streamtape.com',
                        },
                    },
                ],
            };
        },
    });
}
_a = providers.map(embed), exports.streamtapeScraper = _a[0], exports.streamtapeLatinoScraper = _a[1];
