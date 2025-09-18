"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lookmovieScraper = void 0;
const targets_1 = require("../../../entrypoint/utils/targets");
const base_1 = require("../../../providers/base");
const errors_1 = require("../../../utils/errors");
const util_1 = require("./util");
async function universalScraper(ctx) {
    const lookmovieData = await (0, util_1.searchAndFindMedia)(ctx, ctx.media);
    if (!lookmovieData)
        throw new errors_1.NotFoundError('Media not found');
    ctx.progress(30);
    const video = await (0, util_1.scrape)(ctx, ctx.media, lookmovieData);
    if (!video.playlist)
        throw new errors_1.NotFoundError('No video found');
    ctx.progress(60);
    return {
        embeds: [],
        stream: [
            {
                id: 'primary',
                playlist: video.playlist,
                type: 'hls',
                flags: [targets_1.flags.IP_LOCKED],
                captions: video.captions,
            },
        ],
    };
}
exports.lookmovieScraper = (0, base_1.makeSourcerer)({
    id: 'lookmovie',
    name: 'LookMovie',
    disabled: false,
    rank: 140,
    flags: [targets_1.flags.IP_LOCKED],
    scrapeShow: universalScraper,
    scrapeMovie: universalScraper,
});
