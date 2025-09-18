"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bombtheirishScraper = void 0;
// not a joke, this is a real source
const cheerio_1 = require("cheerio");
const targets_1 = require("../../../entrypoint/utils/targets");
const base_1 = require("../../../providers/base");
async function comboScraper(ctx) {
    const embedPage = await ctx.proxiedFetcher(`https://bombthe.irish/embed/${ctx.media.type === 'movie' ? `movie/${ctx.media.tmdbId}` : `tv/${ctx.media.tmdbId}/${ctx.media.season.number}/${ctx.media.episode.number}`}`);
    const $ = (0, cheerio_1.load)(embedPage);
    const embeds = [];
    $('#dropdownMenu a').each((_, element) => {
        const url = new URL($(element).data('url')).searchParams.get('url');
        if (!url)
            return;
        embeds.push({ embedId: $(element).text().toLowerCase(), url: atob(url) });
    });
    return { embeds };
}
exports.bombtheirishScraper = (0, base_1.makeSourcerer)({
    id: 'bombtheirish',
    name: 'bombthe.irish',
    rank: 100,
    disabled: true,
    flags: [targets_1.flags.CORS_ALLOWED],
    scrapeMovie: comboScraper,
    scrapeShow: comboScraper,
});
