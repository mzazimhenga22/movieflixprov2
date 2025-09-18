"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.iosmirrorPVScraper = void 0;
const targets_1 = require("../../entrypoint/utils/targets");
const base_1 = require("../../providers/base");
const compare_1 = require("../../utils/compare");
const cookie_1 = require("../../utils/cookie");
const errors_1 = require("../../utils/errors");
const proxy_1 = require("../../utils/proxy");
// thanks @TPN for this
// See how to set this up yourself: https://gist.github.com/Pasithea0/9ba31d16580800e899c245a4379e902b
const baseUrl = 'https://iosmirror.cc';
const baseUrl2 = 'https://vercel-sucks.up.railway.app/iosmirror.cc:443/pv';
// const userAgent = navigator.userAgent.toLowerCase();
// const isIos = /iphone|ipad|ipod/.test(userAgent);
const universalScraper = async (ctx) => {
    const hash = decodeURIComponent(await ctx.fetcher('https://iosmirror-hash.pstream.org/'));
    if (!hash)
        throw new errors_1.NotFoundError('No hash found');
    ctx.progress(10);
    const searchRes = await ctx.proxiedFetcher('/search.php', {
        baseUrl: baseUrl2,
        query: { s: ctx.media.title },
        headers: { cookie: (0, cookie_1.makeCookieHeader)({ t_hash_t: hash, hd: 'on' }) },
    });
    if (!searchRes.searchResult)
        throw new errors_1.NotFoundError(searchRes.error);
    async function getMeta(id) {
        return ctx.proxiedFetcher('/post.php', {
            baseUrl: baseUrl2,
            query: { id },
            headers: { cookie: (0, cookie_1.makeCookieHeader)({ t_hash_t: hash, hd: 'on' }) },
        });
    }
    ctx.progress(30);
    let id = searchRes.searchResult.find(async (x) => {
        const metaRes = await getMeta(x.id);
        return ((0, compare_1.compareTitle)(x.t, ctx.media.title) &&
            (Number(x.y) === ctx.media.releaseYear || metaRes.type === (ctx.media.type === 'movie' ? 'm' : 't')));
    })?.id;
    if (!id)
        throw new errors_1.NotFoundError('No watchable item found');
    if (ctx.media.type === 'show') {
        const metaRes = await getMeta(id);
        const showMedia = ctx.media;
        const seasonId = metaRes?.season.find((x) => Number(x.s) === showMedia.season.number)?.id;
        if (!seasonId)
            throw new errors_1.NotFoundError('Season not available');
        const episodeRes = await ctx.proxiedFetcher('/episodes.php', {
            baseUrl: baseUrl2,
            query: { s: seasonId, series: id },
            headers: { cookie: (0, cookie_1.makeCookieHeader)({ t_hash_t: hash, hd: 'on' }) },
        });
        let episodes = [...episodeRes.episodes];
        let currentPage = 2;
        while (episodeRes.nextPageShow === 1) {
            const nextPageRes = await ctx.proxiedFetcher('/episodes.php', {
                baseUrl: baseUrl2,
                query: { s: seasonId, series: id, page: currentPage.toString() },
                headers: { cookie: (0, cookie_1.makeCookieHeader)({ t_hash_t: hash, hd: 'on' }) },
            });
            episodes = [...episodes, ...nextPageRes.episodes];
            episodeRes.nextPageShow = nextPageRes.nextPageShow;
            currentPage++;
        }
        const episodeId = episodes.find((x) => x.ep === `E${showMedia.episode.number}` && x.s === `S${showMedia.season.number}`)?.id;
        if (!episodeId)
            throw new errors_1.NotFoundError('Episode not available');
        id = episodeId;
    }
    const playlistRes = await ctx.proxiedFetcher('/playlist.php?', {
        baseUrl: baseUrl2,
        query: { id },
        headers: { cookie: (0, cookie_1.makeCookieHeader)({ t_hash_t: hash, hd: 'on' }) },
    });
    ctx.progress(50);
    let autoFile = playlistRes[0].sources.find((source) => source.label === 'Auto')?.file;
    if (!autoFile) {
        autoFile = playlistRes[0].sources.find((source) => source.label === 'Full HD')?.file;
    }
    if (!autoFile) {
        // eslint-disable-next-line no-console
        console.log('"Full HD" or "Auto" file not found, falling back to first source');
        autoFile = playlistRes[0].sources[0].file;
    }
    if (!autoFile)
        throw new Error('Failed to fetch playlist');
    const headers = {
        referer: baseUrl,
        cookie: (0, cookie_1.makeCookieHeader)({ hd: 'on' }),
    };
    const playlist = (0, proxy_1.createM3U8ProxyUrl)(`${baseUrl}${autoFile}`, headers);
    ctx.progress(90);
    return {
        embeds: [],
        stream: [
            {
                id: 'primary',
                playlist,
                type: 'hls',
                flags: [targets_1.flags.CORS_ALLOWED],
                captions: [],
            },
        ],
    };
};
exports.iosmirrorPVScraper = (0, base_1.makeSourcerer)({
    id: 'iosmirrorpv',
    name: 'PrimeMirror',
    rank: 183,
    // disabled: !!isIos,
    disabled: true,
    flags: [targets_1.flags.CORS_ALLOWED],
    scrapeMovie: universalScraper,
    scrapeShow: universalScraper,
});
