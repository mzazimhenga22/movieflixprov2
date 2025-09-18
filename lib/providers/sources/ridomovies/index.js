"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ridooMoviesScraper = void 0;
const cheerio_1 = require("cheerio");
const base_1 = require("../../../providers/base");
const closeload_1 = require("../../../providers/embeds/closeload");
const ridoo_1 = require("../../../providers/embeds/ridoo");
const errors_1 = require("../../../utils/errors");
const ridoMoviesBase = `https://ridomovies.tv`;
const ridoMoviesApiBase = `${ridoMoviesBase}/core/api`;
const universalScraper = async (ctx) => {
    const searchResult = await ctx.proxiedFetcher('/search', {
        baseUrl: ridoMoviesApiBase,
        query: {
            q: ctx.media.title,
        },
    });
    const mediaData = searchResult.data.items.map((movieEl) => {
        const name = movieEl.title;
        const year = movieEl.contentable.releaseYear;
        const fullSlug = movieEl.fullSlug;
        return { name, year, fullSlug };
    });
    const targetMedia = mediaData.find((m) => m.name === ctx.media.title && m.year === ctx.media.releaseYear.toString());
    if (!targetMedia?.fullSlug)
        throw new errors_1.NotFoundError('No watchable item found');
    ctx.progress(40);
    let iframeSourceUrl = `/${targetMedia.fullSlug}/videos`;
    if (ctx.media.type === 'show') {
        const showPageResult = await ctx.proxiedFetcher(`/${targetMedia.fullSlug}`, {
            baseUrl: ridoMoviesBase,
        });
        const fullEpisodeSlug = `season-${ctx.media.season.number}/episode-${ctx.media.episode.number}`;
        const regexPattern = new RegExp(`\\\\"id\\\\":\\\\"(\\d+)\\\\"(?=.*?\\\\\\"fullSlug\\\\\\":\\\\\\"[^"]*${fullEpisodeSlug}[^"]*\\\\\\")`, 'g');
        const matches = [...showPageResult.matchAll(regexPattern)];
        const episodeIds = matches.map((match) => match[1]);
        if (episodeIds.length === 0)
            throw new errors_1.NotFoundError('No watchable item found');
        const episodeId = episodeIds.at(-1);
        iframeSourceUrl = `/episodes/${episodeId}/videos`;
    }
    const iframeSource = await ctx.proxiedFetcher(iframeSourceUrl, {
        baseUrl: ridoMoviesApiBase,
    });
    const iframeSource$ = (0, cheerio_1.load)(iframeSource.data[0].url);
    const iframeUrl = iframeSource$('iframe').attr('data-src');
    if (!iframeUrl)
        throw new errors_1.NotFoundError('No watchable item found');
    ctx.progress(60);
    const embeds = [];
    if (iframeUrl.includes('closeload')) {
        embeds.push({
            embedId: closeload_1.closeLoadScraper.id,
            url: iframeUrl,
        });
    }
    if (iframeUrl.includes('ridoo')) {
        embeds.push({
            embedId: ridoo_1.ridooScraper.id,
            url: iframeUrl,
        });
    }
    ctx.progress(90);
    return {
        embeds,
    };
};
exports.ridooMoviesScraper = (0, base_1.makeSourcerer)({
    id: 'ridomovies',
    name: 'RidoMovies',
    rank: 210,
    flags: [],
    disabled: false,
    scrapeMovie: universalScraper,
    scrapeShow: universalScraper,
});
