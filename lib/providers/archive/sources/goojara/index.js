"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.goojaraScraper = void 0;
const base_1 = require("../../../../providers/base");
const errors_1 = require("../../../../utils/errors");
const util_1 = require("./util");
async function universalScraper(ctx) {
    const goojaraData = await (0, util_1.searchAndFindMedia)(ctx, ctx.media);
    if (!goojaraData)
        throw new errors_1.NotFoundError('Media not found');
    ctx.progress(30);
    const embeds = await (0, util_1.scrapeIds)(ctx, ctx.media, goojaraData);
    if (embeds?.length === 0)
        throw new errors_1.NotFoundError('No embeds found');
    ctx.progress(60);
    return {
        embeds,
    };
}
exports.goojaraScraper = (0, base_1.makeSourcerer)({
    id: 'goojara',
    name: 'Goojara',
    rank: 180,
    flags: [],
    disabled: true,
    scrapeShow: universalScraper,
    scrapeMovie: universalScraper,
});
