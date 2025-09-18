"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redStarScraper = void 0;
const targets_1 = require("../../../entrypoint/utils/targets");
const base_1 = require("../../../providers/base");
const errors_1 = require("../../../utils/errors");
const universalScraper = async (ctx) => {
    try {
        const res = await ctx.fetcher.full(`https://red-star.ningai.workers.dev/scrape/showbox`, {
            query: {
                type: ctx.media.type,
                title: ctx.media.title,
                releaseYear: ctx.media.releaseYear.toString(),
                tmdbId: ctx.media.tmdbId,
                imdbId: ctx.media.imdbId ?? '',
                ...(ctx.media.type === 'show' && {
                    episodeNumber: ctx.media.episode.number.toString(),
                    episodeTmdbId: ctx.media.episode.tmdbId,
                    seasonNumber: ctx.media.season.number.toString(),
                    seasonTmdbId: ctx.media.season.tmdbId,
                }),
            },
        });
        if (res.statusCode === 200 && res.body.stream?.length)
            return { stream: res.body.stream, embeds: [] };
        if (res.statusCode === 404)
            throw new errors_1.NotFoundError('No watchable item found');
        throw new Error(res.body.message ?? 'An error has occurred!');
    }
    catch (e) {
        if (e instanceof errors_1.NotFoundError)
            throw new errors_1.NotFoundError(e.message);
        throw new Error(e.message ?? 'An error has occurred!');
    }
};
exports.redStarScraper = (0, base_1.makeSourcerer)({
    id: 'redstar',
    name: 'redStar',
    disabled: true,
    externalSource: true,
    rank: 280,
    flags: [targets_1.flags.CORS_ALLOWED],
    scrapeMovie: universalScraper,
    scrapeShow: universalScraper,
});
