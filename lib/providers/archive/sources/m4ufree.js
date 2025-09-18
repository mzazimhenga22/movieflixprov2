"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.m4uScraper = void 0;
// kinda based on m4uscraper by Paradox_77
// thanks Paradox_77
const cheerio_1 = require("cheerio");
const base_1 = require("../../../providers/base");
const compare_1 = require("../../../utils/compare");
const cookie_1 = require("../../../utils/cookie");
const errors_1 = require("../../../utils/errors");
let baseUrl = 'https://m4ufree.se';
const universalScraper = async (ctx) => {
    // this redirects to ww1.m4ufree.tv or ww2.m4ufree.tv
    // if i explicitly keep the base ww1 while the load balancers thinks ww2 is optimal
    // it will keep redirecting all the requests
    // not only that but the last iframe request will fail
    const homePage = await ctx.proxiedFetcher.full(baseUrl);
    baseUrl = new URL(homePage.finalUrl).origin;
    const searchSlug = ctx.media.title
        .replace(/'/g, '')
        .replace(/!|@|%|\^|\*|\(|\)|\+|=|<|>|\?|\/|,|\.|:|;|'| |"|&|#|\[|\]|~|$|_/g, '-')
        .replace(/-+-/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/Ă¢â‚¬â€œ/g, '');
    const searchPage$ = (0, cheerio_1.load)(await ctx.proxiedFetcher(`/search/${searchSlug}.html`, {
        baseUrl,
        query: {
            type: ctx.media.type === 'movie' ? 'movie' : 'tvs',
        },
    }));
    const searchResults = [];
    searchPage$('.item').each((_, element) => {
        const [, title, year] = searchPage$(element)
            // the title emement on their page is broken
            // it just breaks when the titles are too big
            .find('.imagecover a')
            .attr('title')
            // ex-titles: Home Alone 1990, Avengers Endgame (2019), The Curse (2023-)
            ?.match(/^(.*?)\s*(?:\(?\s*(\d{4})(?:\s*-\s*\d{0,4})?\s*\)?)?\s*$/) || [];
        const url = searchPage$(element).find('a').attr('href');
        if (!title || !url)
            return;
        searchResults.push({ title, year: year ? parseInt(year, 10) : undefined, url });
    });
    const watchPageUrl = searchResults.find((x) => x && (0, compare_1.compareMedia)(ctx.media, x.title, x.year))?.url;
    if (!watchPageUrl)
        throw new errors_1.NotFoundError('No watchable item found');
    ctx.progress(25);
    const watchPage = await ctx.proxiedFetcher.full(watchPageUrl, {
        baseUrl,
        readHeaders: ['Set-Cookie'],
    });
    ctx.progress(50);
    let watchPage$ = (0, cheerio_1.load)(watchPage.body);
    const csrfToken = watchPage$('script:contains("_token:")')
        .html()
        ?.match(/_token:\s?'(.*)'/m)?.[1];
    if (!csrfToken)
        throw new Error('Failed to find csrfToken');
    const laravelSession = (0, cookie_1.parseSetCookie)(watchPage.headers.get('Set-Cookie') ?? '').laravel_session;
    if (!laravelSession?.value)
        throw new Error('Failed to find cookie');
    const cookie = (0, cookie_1.makeCookieHeader)({ [laravelSession.name]: laravelSession.value });
    if (ctx.media.type === 'show') {
        const s = ctx.media.season.number < 10 ? `0${ctx.media.season.number}` : ctx.media.season.number.toString();
        const e = ctx.media.episode.number < 10 ? `0${ctx.media.episode.number}` : ctx.media.episode.number.toString();
        const episodeToken = watchPage$(`button:contains("S${s}-E${e}")`).attr('idepisode');
        if (!episodeToken)
            throw new Error('Failed to find episodeToken');
        watchPage$ = (0, cheerio_1.load)(await ctx.proxiedFetcher('/ajaxtv', {
            baseUrl,
            method: 'POST',
            body: new URLSearchParams({
                idepisode: episodeToken,
                _token: csrfToken,
            }),
            headers: {
                cookie,
            },
        }));
    }
    ctx.progress(75);
    const embeds = [];
    const sources = watchPage$('div.row.justify-content-md-center div.le-server')
        .map((_, element) => {
        const name = watchPage$(element).find('span').text().toLowerCase().replace('#', '');
        const data = watchPage$(element).find('span').attr('data');
        if (!data || !name)
            return null;
        return { name, data };
    })
        .get();
    for (const source of sources) {
        let embedId;
        if (source.name === 'm')
            embedId = 'playm4u-m'; // TODO
        else if (source.name === 'nm')
            embedId = 'playm4u-nm';
        else if (source.name === 'h')
            embedId = 'hydrax';
        else
            continue;
        const iframePage$ = (0, cheerio_1.load)(await ctx.proxiedFetcher('/ajax', {
            baseUrl,
            method: 'POST',
            body: new URLSearchParams({
                m4u: source.data,
                _token: csrfToken,
            }),
            headers: {
                cookie,
            },
        }));
        const url = iframePage$('iframe').attr('src')?.trim();
        if (!url)
            continue;
        ctx.progress(100);
        embeds.push({ embedId, url });
    }
    return {
        embeds,
    };
};
exports.m4uScraper = (0, base_1.makeSourcerer)({
    id: 'm4ufree',
    name: 'M4UFree',
    rank: 181,
    disabled: true,
    flags: [],
    scrapeMovie: universalScraper,
    scrapeShow: universalScraper,
});
