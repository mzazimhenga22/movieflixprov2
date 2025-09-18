"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.primewireScraper = void 0;
const cheerio_1 = require("cheerio");
const targets_1 = require("../../../../entrypoint/utils/targets");
const base_1 = require("../../../../providers/base");
const errors_1 = require("../../../../utils/errors");
const common_1 = require("./common");
const blowfish_1 = require("./decryption/blowfish");
async function search(ctx, imdbId) {
    const searchResult = await ctx.proxiedFetcher('/api/v1/show/', {
        baseUrl: common_1.primewireBase,
        query: {
            key: common_1.primewireApiKey,
            imdb_id: imdbId,
        },
    });
    return searchResult.id;
}
/**
 * Extract all stream embeds from the Primewire HTML page.
 */
async function getStreams(titleHtml) {
    const titlePage = (0, cheerio_1.load)(titleHtml);
    const userData = titlePage('#user-data').attr('v');
    if (!userData)
        throw new errors_1.NotFoundError('No user data found');
    const links = (0, blowfish_1.getLinks)(userData);
    if (!links)
        throw new errors_1.NotFoundError('No links found');
    const embeds = [];
    for (const linkKey in links) {
        // get the correct element for this link
        const element = titlePage(`.propper-link[link_version='${linkKey}']`);
        const sourceName = element
            .parent()
            .parent()
            .parent()
            .find('.version-host')
            .text()
            .trim();
        // map host name to a known embedId
        let embedId = null;
        switch (sourceName) {
            case 'mixdrop.co':
                embedId = 'mixdrop';
                break;
            case 'voe.sx':
                embedId = 'voe';
                break;
            case 'upstream.to':
                embedId = 'upstream';
                break;
            case 'streamvid.net':
                embedId = 'streamvid';
                break;
            case 'dood.watch':
                embedId = 'dood';
                break;
            case 'dropload.io':
                embedId = 'dropload';
                break;
            case 'filelions.to':
                embedId = 'filelions';
                break;
            case 'vtube.to':
                embedId = 'vtube';
                break;
            default:
                embedId = null;
        }
        if (!embedId)
            continue;
        embeds.push({
            url: `${common_1.primewireBase}/links/go/${links[linkKey]}`,
            embedId,
        });
    }
    return embeds;
}
exports.primewireScraper = (0, base_1.makeSourcerer)({
    id: 'primewire',
    name: 'Primewire',
    rank: 10,
    disabled: true,
    flags: [targets_1.flags.CORS_ALLOWED],
    async scrapeMovie(ctx) {
        if (!ctx.media.imdbId)
            throw new Error('No imdbId provided');
        const searchResult = await search(ctx, ctx.media.imdbId);
        const titleHtml = await ctx.proxiedFetcher(`movie/${searchResult}`, {
            baseUrl: common_1.primewireBase,
        });
        const embeds = await getStreams(titleHtml);
        return { embeds };
    },
    async scrapeShow(ctx) {
        if (!ctx.media.imdbId)
            throw new Error('No imdbId provided');
        const searchResult = await search(ctx, ctx.media.imdbId);
        const seasonHtml = await ctx.proxiedFetcher(`tv/${searchResult}`, {
            baseUrl: common_1.primewireBase,
        });
        const seasonPage = (0, cheerio_1.load)(seasonHtml);
        const episodeLink = seasonPage(`.show_season[data-id='${ctx.media.season.number}'] > div > a`)
            .toArray()
            .find((lnk) => lnk.attribs.href.includes(`-episode-${ctx.media.episode.number}`))?.attribs.href;
        if (!episodeLink)
            throw new errors_1.NotFoundError('No episode links found');
        const titleHtml = await ctx.proxiedFetcher(episodeLink, {
            baseUrl: common_1.primewireBase,
        });
        const embeds = await getStreams(titleHtml);
        return { embeds };
    },
});
