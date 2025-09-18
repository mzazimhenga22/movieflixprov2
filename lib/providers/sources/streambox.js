"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamboxScraper = void 0;
/* eslint-disable no-console */
const targets_1 = require("../../entrypoint/utils/targets");
const base_1 = require("../../providers/base");
const errors_1 = require("../../utils/errors");
const streamboxBase = 'https://vidjoy.pro/embed/api/fastfetch';
async function comboScraper(ctx) {
    const apiRes = await ctx.proxiedFetcher(ctx.media.type === 'movie'
        ? `${streamboxBase}/${ctx.media.tmdbId}?sr=0`
        : `${streamboxBase}/${ctx.media.tmdbId}/${ctx.media.season.number}/${ctx.media.episode.number}?sr=0`);
    if (!apiRes) {
        throw new errors_1.NotFoundError('Failed to fetch StreamBox data');
    }
    console.log(apiRes);
    const data = await apiRes;
    const streams = {};
    data.url.forEach((stream) => {
        streams[stream.resulation] = stream.link;
    });
    const captions = data.tracks.map((track) => ({
        id: track.lang,
        url: track.url,
        language: track.code,
        type: 'srt',
    }));
    if (data.provider === 'MovieBox') {
        return {
            embeds: [],
            stream: [
                {
                    id: 'primary',
                    captions,
                    qualities: {
                        ...(streams['1080'] && {
                            1080: {
                                type: 'mp4',
                                url: streams['1080'],
                            },
                        }),
                        ...(streams['720'] && {
                            720: {
                                type: 'mp4',
                                url: streams['720'],
                            },
                        }),
                        ...(streams['480'] && {
                            480: {
                                type: 'mp4',
                                url: streams['480'],
                            },
                        }),
                        ...(streams['360'] && {
                            360: {
                                type: 'mp4',
                                url: streams['360'],
                            },
                        }),
                    },
                    type: 'file',
                    flags: [targets_1.flags.CORS_ALLOWED],
                    preferredHeaders: {
                        Referer: data.headers?.Referer,
                    },
                },
            ],
        };
    }
    const hlsStream = data.url.find((stream) => stream.type === 'hls') || data.url[0];
    return {
        embeds: [],
        stream: [
            {
                id: 'primary',
                captions,
                playlist: hlsStream.link,
                type: 'hls',
                flags: [targets_1.flags.CORS_ALLOWED],
                preferredHeaders: {
                    Referer: data.headers?.Referer,
                },
            },
        ],
    };
}
exports.streamboxScraper = (0, base_1.makeSourcerer)({
    id: 'streambox',
    name: 'StreamBox',
    rank: 119,
    disabled: true,
    flags: [targets_1.flags.CORS_ALLOWED],
    scrapeMovie: comboScraper,
    scrapeShow: comboScraper,
});
