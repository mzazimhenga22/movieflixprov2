"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVideoSources = getVideoSources;
exports.getVideo = getVideo;
const captions_1 = require("../../../providers/captions");
const util_1 = require("./util");
async function getVideoSources(ctx, id, media) {
    // Fetch video sources
    let path = '';
    if (media.type === 'show') {
        path = `/v1/episodes/view`;
    }
    else if (media.type === 'movie') {
        path = `/v1/movies/view`;
    }
    const data = await ctx.proxiedFetcher(path, {
        baseUrl: util_1.baseUrl,
        query: { expand: 'streams,subtitles', id },
    });
    return data;
}
async function getVideo(ctx, id, media) {
    // Get sources
    const data = await getVideoSources(ctx, id, media);
    const videoSources = data.streams;
    // Find video URL and return it
    const opts = ['auto', '1080p', '1080', '720p', '720', '480p', '480', '240p', '240', '360p', '360', '144', '144p'];
    let videoUrl = null;
    for (const res of opts) {
        if (videoSources[res] && !videoUrl) {
            videoUrl = videoSources[res];
        }
    }
    let captions = [];
    for (const sub of data.subtitles) {
        const language = (0, captions_1.labelToLanguageCode)(sub.language);
        if (!language)
            continue;
        captions.push({
            id: sub.url,
            type: 'vtt',
            url: `${util_1.baseUrl}${sub.url}`,
            hasCorsRestrictions: false,
            language,
        });
    }
    captions = (0, captions_1.removeDuplicatedLanguages)(captions);
    return {
        playlist: videoUrl,
        captions,
    };
}
