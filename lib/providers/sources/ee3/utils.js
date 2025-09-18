"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.parseSearch = parseSearch;
const cheerio_1 = require("cheerio");
const cookie_1 = require("../../../utils/cookie");
const common_1 = require("./common");
async function login(user, pass, ctx) {
    const req = await ctx.proxiedFetcher.full('/login', {
        baseUrl: common_1.baseUrl,
        method: 'POST',
        body: new URLSearchParams({ user, pass, action: 'login' }),
        readHeaders: ['Set-Cookie'],
    });
    const res = JSON.parse(req.body);
    const cookie = (0, cookie_1.parseSetCookie)(
    // It retruns a cookie even when the login failed
    // I have the backup cookie here just in case
    res.status === 1 ? (req.headers.get('Set-Cookie') ?? '') : 'PHPSESSID=mk2p73c77qc28o5i5120843ruu;');
    return cookie.PHPSESSID.value;
}
function parseSearch(body) {
    const result = [];
    const $ = (0, cheerio_1.load)(body);
    $('div').each((_, element) => {
        const title = $(element).find('.title').text().trim();
        const year = parseInt($(element).find('.details span').first().text().trim(), 10);
        const id = $(element).find('.control-buttons').attr('data-id');
        if (title && year && id) {
            result.push({ title, year, id });
        }
    });
    return result;
}
