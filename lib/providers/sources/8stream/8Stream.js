"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMovie = getMovie;
exports.getTV = getTV;
const errors_1 = require("../../../utils/errors");
const getInfo_1 = __importDefault(require("./getInfo"));
const getStream_1 = __importDefault(require("./getStream"));
async function getMovie(ctx, id, lang = 'English') {
    try {
        const mediaInfo = await (0, getInfo_1.default)(ctx, id);
        if (mediaInfo?.success) {
            const playlist = mediaInfo?.data?.playlist;
            if (!playlist || !Array.isArray(playlist)) {
                throw new errors_1.NotFoundError('Playlist not found or invalid');
            }
            let file = playlist.find((item) => item?.title === lang);
            if (!file) {
                file = playlist?.[0];
            }
            if (!file) {
                throw new errors_1.NotFoundError('No file found');
            }
            const availableLang = playlist.map((item) => item?.title);
            const key = mediaInfo?.data?.key;
            ctx.progress(70);
            const streamUrl = await (0, getStream_1.default)(ctx, file?.file, key);
            if (streamUrl?.success) {
                return { success: true, data: streamUrl?.data, availableLang };
            }
            throw new errors_1.NotFoundError('No stream url found');
        }
        throw new errors_1.NotFoundError('No media info found');
    }
    catch (error) {
        if (error instanceof errors_1.NotFoundError)
            throw error;
        throw new errors_1.NotFoundError('Failed to fetch movie data');
    }
}
async function getTV(ctx, id, season, episode, lang) {
    try {
        const mediaInfo = await (0, getInfo_1.default)(ctx, id);
        if (!mediaInfo?.success) {
            throw new errors_1.NotFoundError('No media info found');
        }
        const playlist = mediaInfo?.data?.playlist;
        const getSeason = playlist.find((item) => item?.id === season.toString());
        if (!getSeason) {
            throw new errors_1.NotFoundError('No season found');
        }
        const getEpisode = getSeason?.folder.find((item) => item?.episode === episode.toString());
        if (!getEpisode) {
            throw new errors_1.NotFoundError('No episode found');
        }
        let file = getEpisode?.folder.find((item) => item?.title === lang);
        if (!file) {
            file = getEpisode?.folder?.[0];
        }
        if (!file) {
            throw new errors_1.NotFoundError('No file found');
        }
        const availableLang = getEpisode?.folder.map((item) => {
            return item?.title;
        });
        const filterLang = availableLang.filter((item) => item?.length > 0);
        const key = mediaInfo?.data?.key;
        ctx.progress(70);
        const streamUrl = await (0, getStream_1.default)(ctx, file?.file, key);
        if (streamUrl?.success) {
            return {
                success: true,
                data: streamUrl?.data,
                availableLang: filterLang,
            };
        }
        throw new errors_1.NotFoundError('No stream url found');
    }
    catch (error) {
        if (error instanceof errors_1.NotFoundError)
            throw error;
        throw new errors_1.NotFoundError('Failed to fetch TV data');
    }
}
