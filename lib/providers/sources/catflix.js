"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.catflixScraper = void 0;
const cheerio_1 = require("cheerio");
const base_1 = require("../../providers/base");
const errors_1 = require("../../utils/errors");
const baseUrl = 'https://catflix.su';
async function comboScraper(ctx) {
    const mediaTitle = ctx.media.title.replace(/ /g, '-').replace(/[():]/g, '').toLowerCase();
    const mediaType = ctx.media.type;
    const movieId = ctx.media.tmdbId;
    const watchPageUrl = mediaType === 'movie'
        ? `${baseUrl}/movie/${mediaTitle}-${movieId}`
        : `${baseUrl}/episode/${mediaTitle}-season-${ctx.media.season.number}-episode-${ctx.media.episode.number}/eid-${ctx.media.episode.tmdbId}`;
    ctx.progress(60);
    const watchPage = await ctx.proxiedFetcher(watchPageUrl);
    const $ = (0, cheerio_1.load)(watchPage);
    const scriptContent = $('script')
        .toArray()
        .find((script) => {
        const child = script.children[0];
        return (child && 'type' in child && child.type === 'text' && 'data' in child && child.data.includes('main_origin ='));
    });
    if (!scriptContent)
        throw new errors_1.NotFoundError('No embed data found');
    const scriptData = scriptContent.children[0];
    const mainOriginMatch = scriptData.data.match(/main_origin = "(.*?)";/);
    if (!mainOriginMatch)
        throw new errors_1.NotFoundError('Failed to extract embed URL');
    const decodedUrl = atob(mainOriginMatch[1]);
    ctx.progress(90);
    return {
        embeds: [
            {
                embedId: 'turbovid',
                url: decodedUrl,
            },
        ],
    };
}
exports.catflixScraper = (0, base_1.makeSourcerer)({
    id: 'catflix',
    name: 'Catflix',
    rank: 160,
    disabled: true,
    flags: [],
    scrapeMovie: comboScraper,
    scrapeShow: comboScraper,
});
