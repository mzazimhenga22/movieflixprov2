"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertunitScraper = void 0;
const targets_1 = require("../../../entrypoint/utils/targets");
const base_1 = require("../../../providers/base");
const errors_1 = require("../../../utils/errors");
const BASE_URL = 'https://isut.streamflix.one';
async function comboScraper(ctx) {
    const embedPage = await ctx.fetcher(`${BASE_URL}/api/source/${ctx.media.type === 'movie' ? `${ctx.media.tmdbId}` : `${ctx.media.tmdbId}/${ctx.media.season.number}/${ctx.media.episode.number}`}`);
    // Parse the response and extract the file URL from the first source
    const sources = embedPage.sources;
    if (!sources || sources.length === 0)
        throw new errors_1.NotFoundError('No sources found');
    const file = sources[0].file;
    if (!file)
        throw new errors_1.NotFoundError('No file URL found');
    ctx.progress(90);
    return {
        embeds: [],
        stream: [
            {
                id: 'primary',
                playlist: file,
                type: 'hls',
                flags: [targets_1.flags.CORS_ALLOWED],
                captions: [],
            },
        ],
    };
}
exports.insertunitScraper = (0, base_1.makeSourcerer)({
    id: 'insertunit',
    name: 'Insertunit',
    rank: 12,
    disabled: true,
    flags: [targets_1.flags.CORS_ALLOWED, targets_1.flags.IP_LOCKED],
    scrapeMovie: comboScraper,
    scrapeShow: comboScraper,
});
