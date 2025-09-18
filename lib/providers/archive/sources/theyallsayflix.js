"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TASFScraper = void 0;
const targets_1 = require("../../../entrypoint/utils/targets");
const base_1 = require("../../../providers/base");
const captions_1 = require("../../../providers/captions");
const errors_1 = require("../../../utils/errors");
const baseUrl = 'https://theyallsayflix.su/';
async function comboScraper(ctx) {
    const apiRes = await ctx.proxiedFetcher.full('/api/v1/search', {
        query: {
            type: ctx.media.type,
            tmdb_id: ctx.media.tmdbId,
            ...(ctx.media.type === 'show' && {
                season: ctx.media.season.number.toString(),
                episode: ctx.media.episode.number.toString(),
            }),
        },
        baseUrl,
    });
    const data = apiRes.body;
    if (apiRes.statusCode !== 200 || !data.streams[0].play_url)
        throw new errors_1.NotFoundError('No watchable item found');
    const captions = [];
    if (data.subtitles) {
        for (const caption of data.subtitles) {
            const language = (0, captions_1.labelToLanguageCode)(caption.label);
            if (!language)
                continue;
            captions.push({
                id: caption.url,
                url: caption.url,
                type: 'vtt',
                hasCorsRestrictions: false,
                language,
            });
        }
    }
    return {
        embeds: [],
        stream: [
            {
                id: 'primary',
                playlist: data.streams[0].play_url,
                type: 'hls',
                flags: [targets_1.flags.CORS_ALLOWED],
                captions,
            },
        ],
    };
}
exports.TASFScraper = (0, base_1.makeSourcerer)({
    id: 'tasf',
    name: 'theyallsayflix.su',
    rank: 225,
    disabled: true,
    flags: [targets_1.flags.CORS_ALLOWED],
    scrapeMovie: comboScraper,
    scrapeShow: comboScraper,
});
