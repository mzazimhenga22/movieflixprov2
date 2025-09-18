"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wootlyScraper = void 0;
const cheerio_1 = require("cheerio");
const targets_1 = require("../../../entrypoint/utils/targets");
const base_1 = require("../../../providers/base");
const cookie_1 = require("../../../utils/cookie");
exports.wootlyScraper = (0, base_1.makeEmbed)({
    id: 'wootly',
    name: 'wootly',
    rank: 172,
    async scrape(ctx) {
        const baseUrl = 'https://www.wootly.ch';
        const wootlyData = await ctx.proxiedFetcher.full(ctx.url, {
            method: 'GET',
            readHeaders: ['Set-Cookie'],
        });
        const cookies = (0, cookie_1.parseSetCookie)(wootlyData.headers.get('Set-Cookie') || '');
        const wootssesCookie = cookies.wootsses.value;
        let $ = (0, cheerio_1.load)(wootlyData.body); // load the html data
        const iframeSrc = $('iframe').attr('src') ?? '';
        const woozCookieRequest = await ctx.proxiedFetcher.full(iframeSrc, {
            method: 'GET',
            readHeaders: ['Set-Cookie'],
            headers: {
                cookie: (0, cookie_1.makeCookieHeader)({ wootsses: wootssesCookie }),
            },
        });
        const woozCookies = (0, cookie_1.parseSetCookie)(woozCookieRequest.headers.get('Set-Cookie') || '');
        const woozCookie = woozCookies.wooz.value;
        const iframeData = await ctx.proxiedFetcher(iframeSrc, {
            method: 'POST',
            body: new URLSearchParams({ qdf: '1' }),
            headers: {
                cookie: (0, cookie_1.makeCookieHeader)({ wooz: woozCookie }),
                Referer: iframeSrc,
            },
        });
        $ = (0, cheerio_1.load)(iframeData);
        const scriptText = $('script').html() ?? '';
        // Regular expressions to match the variables
        const tk = scriptText.match(/tk=([^;]+)/)?.[0].replace(/tk=|["\s]/g, '');
        const vd = scriptText.match(/vd=([^,]+)/)?.[0].replace(/vd=|["\s]/g, '');
        if (!tk || !vd)
            throw new Error('wootly source not found');
        const url = await ctx.proxiedFetcher(`/grabd`, {
            baseUrl,
            query: { t: tk, id: vd },
            method: 'GET',
            headers: {
                cookie: (0, cookie_1.makeCookieHeader)({ wooz: woozCookie, wootsses: wootssesCookie }),
            },
        });
        if (!url)
            throw new Error('wootly source not found');
        return {
            stream: [
                {
                    id: 'primary',
                    type: 'file',
                    flags: [targets_1.flags.IP_LOCKED],
                    captions: [],
                    qualities: {
                        unknown: {
                            type: 'mp4',
                            url,
                        },
                    },
                },
            ],
        };
    },
});
