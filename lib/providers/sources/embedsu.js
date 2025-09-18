"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.embedsuScraper = void 0;
const base_1 = require("../../providers/base");
const errors_1 = require("../../utils/errors");
// custom atob 💀
async function stringAtob(input) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    const str = input.replace(/=+$/, '');
    let output = '';
    if (str.length % 4 === 1) {
        throw new Error('The string to be decoded is not correctly encoded.');
    }
    for (let bc = 0, bs = 0, i = 0; i < str.length; i++) {
        const buffer = str.charAt(i);
        const charIndex = chars.indexOf(buffer);
        if (charIndex === -1)
            continue;
        bs = bc % 4 ? bs * 64 + charIndex : charIndex;
        if (bc++ % 4) {
            output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)));
        }
    }
    return output;
}
async function comboScraper(ctx) {
    const embedUrl = `https://embed.su/embed/${ctx.media.type === 'movie' ? `movie/${ctx.media.tmdbId}` : `tv/${ctx.media.tmdbId}/${ctx.media.season.number}/${ctx.media.episode.number}`}`;
    const embedPage = await ctx.proxiedFetcher(embedUrl, {
        headers: {
            Referer: 'https://embed.su/',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        },
    });
    const vConfigMatch = embedPage.match(/window\.vConfig\s*=\s*JSON\.parse\(atob\(`([^`]+)/i);
    const encodedConfig = vConfigMatch?.[1];
    if (!encodedConfig)
        throw new errors_1.NotFoundError('No encoded config found');
    const decodedConfig = JSON.parse(await stringAtob(encodedConfig));
    if (!decodedConfig?.hash)
        throw new errors_1.NotFoundError('No stream hash found');
    const firstDecode = (await stringAtob(decodedConfig.hash))
        .split('.')
        .map((item) => item.split('').reverse().join(''));
    const secondDecode = JSON.parse(await stringAtob(firstDecode.join('').split('').reverse().join('')));
    if (!secondDecode?.length)
        throw new errors_1.NotFoundError('No servers found');
    ctx.progress(50);
    const embeds = secondDecode.map((server) => ({
        embedId: 'viper',
        url: `https://embed.su/api/e/${server.hash}`,
    }));
    ctx.progress(90);
    return { embeds };
}
exports.embedsuScraper = (0, base_1.makeSourcerer)({
    id: 'embedsu',
    name: 'embed.su',
    rank: 165,
    disabled: true,
    flags: [],
    scrapeMovie: comboScraper,
    scrapeShow: comboScraper,
});
