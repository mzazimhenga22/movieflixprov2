"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mp4hydraScraper = void 0;
const cheerio_1 = require("cheerio");
const targets_1 = require("../../entrypoint/utils/targets");
const base_1 = require("../../providers/base");
const compare_1 = require("../../utils/compare");
const errors_1 = require("../../utils/errors");
const baseUrl = 'https://mp4hydra.org/';
async function comboScraper(ctx) {
    const searchPage = await ctx.proxiedFetcher('/search', {
        baseUrl,
        query: {
            q: ctx.media.title,
        },
    });
    ctx.progress(40);
    const $search = (0, cheerio_1.load)(searchPage);
    const searchResults = [];
    $search('.search-details').each((_, element) => {
        const [, title, year] = $search(element)
            .find('a')
            .first()
            .text()
            .trim()
            .match(/^(.*?)\s*(?:\(?\s*(\d{4})(?:\s*-\s*\d{0,4})?\s*\)?)?\s*$/) || [];
        const url = $search(element).find('a').attr('href')?.split('/')[4];
        if (!title || !url)
            return;
        searchResults.push({ title, year: year ? parseInt(year, 10) : undefined, url });
    });
    const s = searchResults.find((x) => x && (0, compare_1.compareMedia)(ctx.media, x.title, x.year))?.url;
    if (!s)
        throw new errors_1.NotFoundError('No watchable item found');
    ctx.progress(60);
    const data = await ctx.proxiedFetcher('/info2?v=8', {
        method: 'POST',
        body: new URLSearchParams({ z: JSON.stringify([{ s, t: 'movie' }]) }),
        baseUrl,
    });
    if (!data.playlist[0].src || !data.servers)
        throw new errors_1.NotFoundError('No watchable item found');
    ctx.progress(80);
    const embeds = [];
    // rank the server as suggested by the api
    [
        data.servers[data.servers.auto],
        ...Object.values(data.servers).filter((x) => x !== data.servers[data.servers.auto] && x !== data.servers.auto),
    ].forEach((server, _) => embeds.push({ embedId: `mp4hydra-${_ + 1}`, url: `${server}${data.playlist[0].src}|${data.playlist[0].label}` }));
    ctx.progress(90);
    return {
        embeds,
    };
}
exports.mp4hydraScraper = (0, base_1.makeSourcerer)({
    id: 'mp4hydra',
    name: 'Mp4Hydra',
    rank: 4,
    disabled: true,
    flags: [targets_1.flags.CORS_ALLOWED],
    scrapeMovie: comboScraper,
    scrapeShow: comboScraper,
});
