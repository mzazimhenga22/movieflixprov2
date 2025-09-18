"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.alphaScraper = exports.deltaScraper = void 0;
const base_1 = require("../../../providers/base");
const errors_1 = require("../../../utils/errors");
const providers = [
    {
        id: 'delta',
        rank: 699,
    },
    {
        id: 'alpha',
        rank: 695,
    },
];
function embed(provider) {
    return (0, base_1.makeEmbed)({
        id: provider.id,
        name: provider.id.charAt(0).toUpperCase() + provider.id.slice(1),
        rank: provider.rank,
        disabled: false,
        async scrape(ctx) {
            const [query, baseUrl] = ctx.url.split('|');
            const search = await ctx.fetcher.full('/search', {
                query: {
                    query,
                    provider: provider.id,
                },
                credentials: 'include',
                baseUrl,
            });
            if (search.statusCode === 429)
                throw new Error('Rate limited');
            if (search.statusCode !== 200)
                throw new errors_1.NotFoundError('Failed to search');
            ctx.progress(50);
            const result = await ctx.fetcher('/provider', {
                query: {
                    resourceId: search.body.url,
                    provider: provider.id,
                },
                credentials: 'include',
                baseUrl,
            });
            ctx.progress(100);
            return result;
        },
    });
}
_a = providers.map(embed), exports.deltaScraper = _a[0], exports.alphaScraper = _a[1];
