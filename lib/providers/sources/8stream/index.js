"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EightStreamScraper = void 0;
const targets_1 = require("../../../entrypoint/utils/targets");
const base_1 = require("../../../providers/base");
const errors_1 = require("../../../utils/errors");
const _8Stream_1 = require("./8Stream");
async function comboScraper(ctx) {
    const query = {
        title: ctx.media.title,
        releaseYear: ctx.media.releaseYear,
        tmdbId: ctx.media.tmdbId,
        imdbId: ctx.media.imdbId,
        type: ctx.media.type,
        season: '',
        episode: '',
    };
    if (ctx.media.type === 'show') {
        query.season = ctx.media.season.number.toString();
        query.episode = ctx.media.episode.number.toString();
    }
    if (ctx.media.type === 'movie') {
        ctx.progress(40);
        const res = await (0, _8Stream_1.getMovie)(ctx, ctx.media.imdbId);
        if (res?.success) {
            ctx.progress(90);
            return {
                embeds: [],
                stream: [
                    {
                        id: 'primary',
                        captions: [],
                        playlist: res.data.link,
                        type: 'hls',
                        flags: [targets_1.flags.CORS_ALLOWED],
                    },
                ],
            };
        }
        throw new errors_1.NotFoundError('No providers available');
    }
    if (ctx.media.type === 'show') {
        ctx.progress(40);
        const lang = 'English';
        const res = await (0, _8Stream_1.getTV)(ctx, ctx.media.imdbId, ctx.media.season.number, ctx.media.episode.number, lang);
        if (res?.success) {
            ctx.progress(90);
            return {
                embeds: [],
                stream: [
                    {
                        id: 'primary',
                        captions: [],
                        playlist: res.data.link,
                        type: 'hls',
                        flags: [targets_1.flags.CORS_ALLOWED],
                    },
                ],
            };
        }
        throw new errors_1.NotFoundError('No providers available');
    }
    throw new errors_1.NotFoundError('No providers available');
}
exports.EightStreamScraper = (0, base_1.makeSourcerer)({
    id: '8stream',
    name: '8stream',
    rank: 111,
    flags: [],
    disabled: true,
    scrapeMovie: comboScraper,
    scrapeShow: comboScraper,
});
