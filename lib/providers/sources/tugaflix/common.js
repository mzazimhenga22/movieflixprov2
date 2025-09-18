"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.baseUrl = void 0;
exports.parseSearch = parseSearch;
const cheerio_1 = require("cheerio");
exports.baseUrl = 'https://tugaflix.love/';
function parseSearch(page) {
    const results = [];
    const $ = (0, cheerio_1.load)(page);
    $('.items .poster').each((_, element) => {
        const $link = $(element).find('a');
        const url = $link.attr('href');
        // ex title: Home Alone (1990)
        const [, title, year] = $link.attr('title')?.match(/^(.*?)\s*(?:\((\d{4})\))?\s*$/) || [];
        if (!title || !url)
            return;
        // tiles dont always have the year
        results.push({ title, year: year ? parseInt(year, 10) : undefined, url });
    });
    return results;
}
