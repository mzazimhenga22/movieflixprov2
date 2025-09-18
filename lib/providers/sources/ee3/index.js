"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ee3Scraper = void 0;
const targets_1 = require("../../../entrypoint/utils/targets");
const base_1 = require("../../../providers/base");
const compare_1 = require("../../../utils/compare");
const cookie_1 = require("../../../utils/cookie");
const errors_1 = require("../../../utils/errors");
const common_1 = require("./common");
const utils_1 = require("./utils");
// this source only has movies
async function comboScraper(ctx) {
    const pass = await (0, utils_1.login)(common_1.username, common_1.password, ctx);
    if (!pass)
        throw new Error('Login failed');
    const search = (0, utils_1.parseSearch)(await ctx.proxiedFetcher('/get', {
        baseUrl: common_1.baseUrl,
        method: 'POST',
        body: new URLSearchParams({ query: ctx.media.title, action: 'search' }),
        headers: {
            cookie: (0, cookie_1.makeCookieHeader)({ PHPSESSID: pass }),
        },
    }));
    const id = search.find((v) => v && (0, compare_1.compareMedia)(ctx.media, v.title, v.year))?.id;
    if (!id)
        throw new errors_1.NotFoundError('No watchable item found');
    ctx.progress(20);
    const details = JSON.parse(await ctx.proxiedFetcher('/get', {
        baseUrl: common_1.baseUrl,
        method: 'POST',
        body: new URLSearchParams({ id, action: 'get_movie_info' }),
        headers: {
            cookie: (0, cookie_1.makeCookieHeader)({ PHPSESSID: pass }),
        },
    }));
    if (!details.message.video)
        throw new Error('Failed to get the stream');
    ctx.progress(40);
    const keyParams = JSON.parse(await ctx.proxiedFetcher('/renew', {
        baseUrl: common_1.baseUrl,
        method: 'POST',
        headers: {
            cookie: (0, cookie_1.makeCookieHeader)({ PHPSESSID: pass }),
        },
    }));
    if (!keyParams.k)
        throw new Error('Failed to get the key');
    ctx.progress(60);
    const server = details.message.server === '1' ? 'https://vid.ee3.me/vid/' : 'https://vault.rips.cc/video/';
    const k = keyParams.k;
    const url = `${server}${details.message.video}?${new URLSearchParams({ k })}`;
    const captions = [];
    // this how they actually deal with subtitles
    if (details.message.subs?.toLowerCase() === 'yes' && details.message.imdbID) {
        captions.push({
            id: `https://rips.cc/subs/${details.message.imdbID}.vtt`,
            url: `https://rips.cc/subs/${details.message.imdbID}.vtt`,
            type: 'vtt',
            hasCorsRestrictions: false,
            language: 'en',
        });
    }
    ctx.progress(90);
    return {
        embeds: [],
        stream: [
            {
                id: 'primary',
                type: 'file',
                flags: [targets_1.flags.CORS_ALLOWED],
                captions,
                qualities: {
                    // should be unknown, but all the videos are 720p
                    720: {
                        type: 'mp4',
                        url,
                    },
                },
            },
        ],
    };
}
exports.ee3Scraper = (0, base_1.makeSourcerer)({
    id: 'ee3',
    name: 'EE3',
    rank: 120,
    disabled: true,
    flags: [targets_1.flags.CORS_ALLOWED],
    scrapeMovie: comboScraper,
});
