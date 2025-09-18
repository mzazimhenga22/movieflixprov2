"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wecimaScraper = void 0;
const cheerio_1 = require("cheerio");
const base_1 = require("../../providers/base");
const errors_1 = require("../../utils/errors");
const baseUrl = 'https://wecima.tube';
async function comboScraper(ctx) {
    const searchPage = await ctx.proxiedFetcher(`/search/${encodeURIComponent(ctx.media.title)}/`, {
        baseUrl,
    });
    const search$ = (0, cheerio_1.load)(searchPage);
    const firstResult = search$('.Grid--WecimaPosts .GridItem a').first();
    if (!firstResult.length)
        throw new errors_1.NotFoundError('No results found');
    const contentUrl = firstResult.attr('href');
    if (!contentUrl)
        throw new errors_1.NotFoundError('No content URL found');
    ctx.progress(30);
    const contentPage = await ctx.proxiedFetcher(contentUrl, { baseUrl });
    const content$ = (0, cheerio_1.load)(contentPage);
    let embedUrl;
    if (ctx.media.type === 'movie') {
        embedUrl = content$('meta[itemprop="embedURL"]').attr('content');
    }
    else {
        const seasonLinks = content$('.List--Seasons--Episodes a');
        let seasonUrl;
        for (const element of seasonLinks) {
            const text = content$(element).text().trim();
            if (text.includes(`موسم ${ctx.media.season}`)) {
                seasonUrl = content$(element).attr('href');
                break;
            }
        }
        if (!seasonUrl)
            throw new errors_1.NotFoundError(`Season ${ctx.media.season} not found`);
        const seasonPage = await ctx.proxiedFetcher(seasonUrl, { baseUrl });
        const season$ = (0, cheerio_1.load)(seasonPage);
        const episodeLinks = season$('.Episodes--Seasons--Episodes a');
        for (const element of episodeLinks) {
            const epTitle = season$(element).find('episodetitle').text().trim();
            if (epTitle === `الحلقة ${ctx.media.episode}`) {
                const episodeUrl = season$(element).attr('href');
                if (episodeUrl) {
                    const episodePage = await ctx.proxiedFetcher(episodeUrl, { baseUrl });
                    const episode$ = (0, cheerio_1.load)(episodePage);
                    embedUrl = episode$('meta[itemprop="embedURL"]').attr('content');
                }
                break;
            }
        }
    }
    if (!embedUrl)
        throw new errors_1.NotFoundError('No embed URL found');
    ctx.progress(60);
    // Get the final video URL
    const embedPage = await ctx.proxiedFetcher(embedUrl);
    const embed$ = (0, cheerio_1.load)(embedPage);
    const videoSource = embed$('source[type="video/mp4"]').attr('src');
    if (!videoSource)
        throw new errors_1.NotFoundError('No video source found');
    ctx.progress(90);
    return {
        embeds: [],
        stream: [
            {
                id: 'primary',
                type: 'file',
                flags: [],
                headers: {
                    referer: baseUrl,
                },
                qualities: {
                    unknown: {
                        type: 'mp4',
                        url: videoSource,
                    },
                },
                captions: [],
            },
        ],
    };
}
exports.wecimaScraper = (0, base_1.makeSourcerer)({
    id: 'wecima',
    name: 'Wecima (Arabic)',
    rank: 3,
    disabled: false,
    flags: [],
    scrapeMovie: comboScraper,
    scrapeShow: comboScraper,
});
