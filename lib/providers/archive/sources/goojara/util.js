"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchAndFindMedia = searchAndFindMedia;
exports.scrapeIds = scrapeIds;
const cheerio_1 = require("cheerio");
const compare_1 = require("../../../../utils/compare");
const errors_1 = require("../../../../utils/errors");
const getEmbeds_1 = require("./getEmbeds");
const type_1 = require("./type");
let data;
// The cookie for this headerData doesn't matter, Goojara just checks it's there.
const headersData = {
    cookie: `aGooz=t9pmkdtef1b3lg3pmo1u2re816; bd9aa48e=0d7b89e8c79844e9df07a2; _b414=2151C6B12E2A88379AFF2C0DD65AC8298DEC2BF4; 9d287aaa=8f32ad589e1c4288fe152f`,
    Referer: 'https://www.goojara.to/',
};
async function searchAndFindMedia(ctx, media) {
    data = await ctx.fetcher(`/xhrr.php`, {
        baseUrl: type_1.baseUrl,
        headers: headersData,
        method: 'POST',
        body: new URLSearchParams({ q: media.title }),
    });
    const $ = (0, cheerio_1.load)(data);
    const results = [];
    $('.mfeed > li').each((index, element) => {
        const title = $(element).find('strong').text();
        const yearMatch = $(element)
            .text()
            .match(/\((\d{4})\)/);
        const typeDiv = $(element).find('div').attr('class');
        const type = typeDiv === 'it' ? 'show' : typeDiv === 'im' ? 'movie' : '';
        const year = yearMatch ? yearMatch[1] : '';
        const slug = $(element).find('a').attr('href')?.split('/')[3];
        if (!slug)
            throw new errors_1.NotFoundError('Not found');
        if (media.type === type) {
            results.push({ title, year, slug, type });
        }
    });
    const result = results.find((res) => (0, compare_1.compareMedia)(media, res.title, Number(res.year)));
    return result;
}
async function scrapeIds(ctx, media, result) {
    // Find the relevant id
    let id = null;
    if (media.type === 'movie') {
        id = result.slug;
    }
    else if (media.type === 'show') {
        data = await ctx.fetcher(`/${result.slug}`, {
            baseUrl: type_1.baseUrl,
            headers: headersData,
            method: 'GET',
            query: { s: media.season.number.toString() },
        });
        let episodeId = '';
        const $2 = (0, cheerio_1.load)(data);
        $2('.seho').each((index, element) => {
            // Extracting the episode number as a string
            const episodeNumber = $2(element).find('.seep .sea').text().trim();
            // Comparing with the desired episode number as a string
            if (parseInt(episodeNumber, 10) === media.episode.number) {
                const href = $2(element).find('.snfo h1 a').attr('href');
                const idMatch = href?.match(/\/([a-zA-Z0-9]+)$/);
                if (idMatch && idMatch[1]) {
                    episodeId = idMatch[1];
                    return false; // Break out of the loop once the episode is found
                }
            }
        });
        id = episodeId;
    }
    // Check ID
    if (id === null)
        throw new errors_1.NotFoundError('Not found');
    const embeds = await (0, getEmbeds_1.getEmbeds)(ctx, id);
    return embeds;
}
