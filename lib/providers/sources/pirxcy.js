"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pirxcyScraper = void 0;
const targets_1 = require("../../entrypoint/utils/targets");
const base_1 = require("../../providers/base");
const errors_1 = require("../../utils/errors");
const baseUrl = 'https://mbp.pirxcy.dev'; // the dev of this api asked it to be removed. however you can host this endpoint yourself. https://github.com/HyperKiko/mbp-api
function buildQualitiesFromStreams(data) {
    // Process streams data from the list array
    const streams = data.list.reduce((acc, stream) => {
        const { path, quality, format } = stream;
        const realQuality = stream.real_quality;
        // Only process MP4 streams
        if (format !== 'mp4')
            return acc;
        let qualityKey;
        if (quality === '4K' || realQuality === '4K') {
            qualityKey = 2160;
        }
        else {
            const qualityStr = quality.replace('p', '');
            qualityKey = parseInt(qualityStr, 10);
        }
        if (Number.isNaN(qualityKey) || acc[qualityKey])
            return acc;
        acc[qualityKey] = path;
        return acc;
    }, {});
    // Filter qualities based on provider type
    const filteredStreams = Object.entries(streams).reduce((acc, [quality, url]) => {
        // Skip unknown for cached provider if needed
        // For now, include all qualities
        acc[quality] = url;
        return acc;
    }, {});
    return {
        ...(filteredStreams[2160] && {
            '4k': {
                type: 'mp4',
                url: filteredStreams[2160],
            },
        }),
        ...(filteredStreams[1080] && {
            1080: {
                type: 'mp4',
                url: filteredStreams[1080],
            },
        }),
        ...(filteredStreams[720] && {
            720: {
                type: 'mp4',
                url: filteredStreams[720],
            },
        }),
        ...(filteredStreams[480] && {
            480: {
                type: 'mp4',
                url: filteredStreams[480],
            },
        }),
        ...(filteredStreams[360] && {
            360: {
                type: 'mp4',
                url: filteredStreams[360],
            },
        }),
        ...(filteredStreams.unknown && {
            unknown: {
                type: 'mp4',
                url: filteredStreams.unknown,
            },
        }),
    };
}
async function findMediaByTMDBId(ctx, tmdbId, title, type, year) {
    const searchUrl = `${baseUrl}/search?q=${encodeURIComponent(title)}&type=${type}${year ? `&year=${year}` : ''}`;
    const searchRes = await ctx.proxiedFetcher(searchUrl);
    if (!searchRes.data || searchRes.data.length === 0) {
        throw new errors_1.NotFoundError('No results found in search');
    }
    // Find the correct internal ID by matching TMDB ID
    for (const result of searchRes.data) {
        const detailUrl = `${baseUrl}/details/${type}/${result.id}`;
        const detailRes = await ctx.proxiedFetcher(detailUrl);
        if (detailRes.data && detailRes.data.tmdb_id.toString() === tmdbId) {
            return result.id;
        }
    }
    throw new errors_1.NotFoundError('Could not find matching media item for TMDB ID');
}
async function scrapeMovie(ctx) {
    const tmdbId = ctx.media.tmdbId;
    const title = ctx.media.title;
    const year = ctx.media.releaseYear?.toString();
    if (!tmdbId || !title) {
        throw new errors_1.NotFoundError('Missing required media information');
    }
    // Find internal media ID
    const mediaId = await findMediaByTMDBId(ctx, tmdbId, title, 'movie', year);
    // Get stream links
    const streamUrl = `${baseUrl}/movie/${mediaId}`;
    const streamData = await ctx.proxiedFetcher(streamUrl);
    if (!streamData.data || !streamData.data.list) {
        throw new errors_1.NotFoundError('No streams found for this movie');
    }
    const qualities = buildQualitiesFromStreams(streamData.data);
    return {
        stream: [
            {
                id: 'pirxcy',
                type: 'file',
                qualities,
                flags: [targets_1.flags.CORS_ALLOWED],
                captions: [],
            },
        ],
        embeds: [],
    };
}
async function scrapeShow(ctx) {
    const tmdbId = ctx.media.tmdbId;
    const title = ctx.media.title;
    const year = ctx.media.releaseYear?.toString();
    const season = ctx.media.season.number;
    const episode = ctx.media.episode.number;
    if (!tmdbId || !title || !season || !episode) {
        throw new errors_1.NotFoundError('Missing required media information');
    }
    // Find internal media ID
    const mediaId = await findMediaByTMDBId(ctx, tmdbId, title, 'tv', year);
    // Get stream links
    const streamUrl = `${baseUrl}/tv/${mediaId}/${season}/${episode}`;
    const streamData = await ctx.proxiedFetcher(streamUrl);
    if (!streamData.data || !streamData.data.list) {
        throw new errors_1.NotFoundError('No streams found for this episode');
    }
    const qualities = buildQualitiesFromStreams(streamData.data);
    return {
        embeds: [],
        stream: [
            {
                id: 'primary',
                type: 'file',
                qualities,
                flags: [targets_1.flags.CORS_ALLOWED],
                captions: [],
            },
        ],
    };
}
exports.pirxcyScraper = (0, base_1.makeSourcerer)({
    id: 'pirxcy',
    name: 'Pirxcy',
    rank: 230,
    disabled: true,
    flags: [targets_1.flags.CORS_ALLOWED],
    scrapeMovie,
    scrapeShow,
});
