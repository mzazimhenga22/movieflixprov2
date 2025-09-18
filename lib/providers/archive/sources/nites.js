"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nitesScraper = void 0;
const cheerio_1 = require("cheerio");
const base_1 = require("../../../providers/base");
const compare_1 = require("../../../utils/compare");
const errors_1 = require("../../../utils/errors");
const baseUrl = 'https://w1.nites.is';
async function comboScraper(ctx) {
    const searchPage = await ctx.proxiedFetcher('/wp-admin/admin-ajax.php', {
        baseUrl,
        method: 'POST',
        body: new URLSearchParams({
            action: 'ajax_pagination',
            query_vars: 'mixed',
            search: ctx.media.title,
        }),
    });
    const $search = (0, cheerio_1.load)(searchPage);
    const searchResults = [];
    $search('li').each((_, element) => {
        const title = $search(element).find('.entry-title').first().text().trim();
        const year = parseInt($search(element).find('.year').first().text().trim(), 10);
        const url = $search(element).find('.lnk-blk').attr('href');
        if (!title || !year || !url)
            return;
        searchResults.push({ title, year, url });
    });
    let watchPageUrl = searchResults.find((x) => x && (0, compare_1.compareMedia)(ctx.media, x.title, x.year))?.url;
    if (!watchPageUrl)
        throw new errors_1.NotFoundError('No watchable item found');
    if (ctx.media.type === 'show') {
        const match = watchPageUrl.match(/\/series\/([^/]+)\/?/);
        if (!match)
            throw new Error('Failed to parse watch page url');
        watchPageUrl = watchPageUrl.replace(`/series/${match[1]}`, `/episode/${match[1]}-${ctx.media.season.number}x${ctx.media.episode.number}`);
    }
    const watchPage = (0, cheerio_1.load)(await ctx.proxiedFetcher(watchPageUrl));
    // it embeds vidsrc when it bflix does not has the stream
    // i think all shows embed vidsrc, not sure
    const embedUrl = watchPage('ul.bx-lst li a:contains("- Bflix")')
        .closest('aside')
        .next('div.video-options')
        .find('iframe')
        .attr('data-lazy-src');
    if (!embedUrl)
        throw new Error('Failed to find embed url');
    const embedPage = (0, cheerio_1.load)(await ctx.proxiedFetcher(embedUrl));
    const url = embedPage('iframe').attr('src');
    if (!url)
        throw new Error('Failed to find embed url');
    return {
        embeds: [
            {
                embedId: 'bflix',
                url,
            },
        ],
    };
}
exports.nitesScraper = (0, base_1.makeSourcerer)({
    id: 'nites',
    name: 'Nites',
    disabled: true,
    rank: 80,
    flags: [],
    scrapeMovie: comboScraper,
    scrapeShow: comboScraper,
});
