"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEmbeds = getEmbeds;
const cheerio_1 = require("cheerio");
const cookie_1 = require("../../../../utils/cookie");
const type_1 = require("./type");
async function getEmbeds(ctx, id) {
    const data = await ctx.fetcher.full(`/${id}`, {
        baseUrl: type_1.baseUrl2,
        headers: {
            Referer: type_1.baseUrl,
            cookie: '',
        },
        readHeaders: ['Set-Cookie'],
        method: 'GET',
    });
    const cookies = (0, cookie_1.parseSetCookie)(data.headers.get('Set-Cookie') || '');
    const RandomCookieName = data.body.split(`_3chk('`)[1].split(`'`)[0];
    const RandomCookieValue = data.body.split(`_3chk('`)[1].split(`'`)[2];
    let aGoozCookie = '';
    let cookie = '';
    if (cookies && cookies.aGooz && RandomCookieName && RandomCookieValue) {
        aGoozCookie = cookies.aGooz.value;
        cookie = (0, cookie_1.makeCookieHeader)({
            aGooz: aGoozCookie,
            [RandomCookieName]: RandomCookieValue,
        });
    }
    const $ = (0, cheerio_1.load)(data.body);
    const embedRedirectURLs = $('a')
        .map((index, element) => $(element).attr('href'))
        .get()
        .filter((href) => href && href.includes(`${type_1.baseUrl2}/go.php`));
    const embedPages = await Promise.all(embedRedirectURLs.map((url) => ctx.fetcher
        .full(url, {
        headers: {
            cookie,
            Referer: type_1.baseUrl2,
        },
        method: 'GET',
    })
        .catch(() => null)));
    // Initialize an array to hold the results
    const results = [];
    // Process each page result
    for (const result of embedPages) {
        if (result) {
            const embedId = ['wootly', 'upstream', 'mixdrop', 'dood'].find((a) => result.finalUrl.includes(a));
            if (embedId) {
                results.push({ embedId, url: result.finalUrl });
            }
        }
    }
    return results;
}
