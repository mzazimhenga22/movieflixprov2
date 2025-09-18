"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nunflixScraper = void 0;
const targets_1 = require("../../entrypoint/utils/targets");
const base_1 = require("../../providers/base");
const errors_1 = require("../../utils/errors");
const mamaApiBase = 'https://mama.up.railway.app/api/showbox';
const getUserToken = () => {
    try {
        return typeof window !== 'undefined' ? window.localStorage.getItem('febbox_ui_token') : null;
    }
    catch (e) {
        console.warn('Unable to access localStorage:', e);
        return null;
    }
};
async function comboScraper(ctx) {
    const userToken = getUserToken();
    const apiUrl = ctx.media.type === 'movie'
        ? `${mamaApiBase}/movie/${ctx.media.tmdbId}?token=${userToken}`
        : `${mamaApiBase}/tv/${ctx.media.tmdbId}?season=${ctx.media.season.number}&episode=${ctx.media.episode.number}&token=${userToken}`;
    const apiRes = await ctx.proxiedFetcher(apiUrl);
    if (!apiRes) {
        throw new errors_1.NotFoundError('No response from API');
    }
    const data = (await apiRes);
    if (!data.success) {
        throw new errors_1.NotFoundError('No streams found');
    }
    const streamItems = Array.isArray(data.streams) ? data.streams : [data.streams];
    if (streamItems.length === 0 || !streamItems[0].player_streams) {
        throw new errors_1.NotFoundError('No valid streams found');
    }
    let bestStreamItem = streamItems[0];
    for (const item of streamItems) {
        if (item.quality.includes('4K') || item.quality.includes('2160p')) {
            bestStreamItem = item;
            break;
        }
    }
    const streams = bestStreamItem.player_streams.reduce((acc, stream) => {
        let qualityKey;
        if (stream.quality === '4K' || stream.quality.includes('4K')) {
            qualityKey = 2160;
        }
        else if (stream.quality === 'ORG' || stream.quality.includes('ORG')) {
            return acc; // Skip original quality
        }
        else {
            qualityKey = parseInt(stream.quality.replace('P', ''), 10);
        }
        if (Number.isNaN(qualityKey) || acc[qualityKey])
            return acc;
        acc[qualityKey] = stream.file;
        return acc;
    }, {});
    return {
        embeds: [],
        stream: [
            {
                id: 'primary',
                captions: [],
                qualities: {
                    ...(streams[2160] && {
                        '4k': {
                            type: 'mp4',
                            url: streams[2160],
                        },
                    }),
                    ...(streams[1080] && {
                        1080: {
                            type: 'mp4',
                            url: streams[1080],
                        },
                    }),
                    ...(streams[720] && {
                        720: {
                            type: 'mp4',
                            url: streams[720],
                        },
                    }),
                    ...(streams[480] && {
                        480: {
                            type: 'mp4',
                            url: streams[480],
                        },
                    }),
                    ...(streams[360] && {
                        360: {
                            type: 'mp4',
                            url: streams[360],
                        },
                    }),
                },
                type: 'file',
                flags: [targets_1.flags.CORS_ALLOWED],
            },
        ],
    };
}
exports.nunflixScraper = (0, base_1.makeSourcerer)({
    id: 'nunflix',
    name: 'NFlix',
    rank: 155,
    disabled: !getUserToken(),
    // disabled: true,
    flags: [targets_1.flags.CORS_ALLOWED],
    scrapeMovie: comboScraper,
    scrapeShow: comboScraper,
});
