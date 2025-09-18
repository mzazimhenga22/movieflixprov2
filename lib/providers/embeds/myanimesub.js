"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.myanimesubScraper = void 0;
const targets_1 = require("../../entrypoint/utils/targets");
const base_1 = require("../../providers/base");
const captions_1 = require("../../providers/captions");
const errors_1 = require("../../utils/errors");
const proxy_1 = require("../../utils/proxy");
exports.myanimesubScraper = (0, base_1.makeEmbed)({
    id: 'myanimesub',
    name: 'MyAnime (Sub)',
    rank: 204,
    async scrape(ctx) {
        const streamData = await ctx.proxiedFetcher(`https://anime.aether.mom/api/stream?id=${ctx.url}&server=HD-2&type=sub`);
        if (!streamData.results.streamingLink?.link?.file) {
            throw new errors_1.NotFoundError('No watchable sources found');
        }
        const getValidTimestamp = (timestamp) => {
            if (!timestamp || typeof timestamp !== 'object')
                return null;
            const start = parseInt(timestamp.start, 10);
            const end = parseInt(timestamp.end, 10);
            if (Number.isNaN(start) || Number.isNaN(end) || start <= 0 || end <= 0 || start >= end)
                return null;
            return { start, end };
        };
        const intro = getValidTimestamp(streamData.results.streamingLink.intro);
        const outro = getValidTimestamp(streamData.results.streamingLink.outro);
        return {
            stream: [
                {
                    id: 'sub',
                    type: 'hls',
                    playlist: (0, proxy_1.createM3U8ProxyUrl)(streamData.results.streamingLink.link.file, {
                        Referer: 'https://rapid-cloud.co/',
                    }),
                    flags: [targets_1.flags.CORS_ALLOWED],
                    captions: streamData.results.streamingLink.tracks
                        ?.map((track) => {
                        const lang = (0, captions_1.labelToLanguageCode)(track.label);
                        const type = (0, captions_1.getCaptionTypeFromUrl)(track.file);
                        if (!lang || !type)
                            return null;
                        return {
                            id: track.file,
                            url: track.file,
                            language: lang,
                            type,
                            hasCorsRestrictions: true,
                        };
                    })
                        .filter((x) => x) ?? [],
                    intro,
                    outro,
                },
            ],
        };
    },
});
