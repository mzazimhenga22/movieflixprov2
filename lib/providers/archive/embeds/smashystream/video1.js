"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.smashyStreamFScraper = void 0;
const targets_1 = require("../../../../entrypoint/utils/targets");
const base_1 = require("../../../../providers/base");
const captions_1 = require("../../../../providers/captions");
const errors_1 = require("../../../../utils/errors");
// if you don't understand how this is reversed
// check https://discord.com/channels/871713465100816424/1186646348137775164/1225644477188935770
// feel free to reach out atpn or ciaran_ds on discord if you've any problems
function decode(str) {
    const b = ['U0ZML2RVN0IvRGx4', 'MGNhL0JWb0kvTlM5', 'Ym94LzJTSS9aU0Zj', 'SGJ0L1dGakIvN0dX', 'eE52L1QwOC96N0Yz'];
    let formatedB64 = str.slice(2);
    for (let i = 4; i > -1; i--) {
        formatedB64 = formatedB64.replace(`//${b[i]}`, '');
    }
    return atob(formatedB64);
}
exports.smashyStreamFScraper = (0, base_1.makeEmbed)({
    id: 'smashystream-f',
    name: 'SmashyStream (F)',
    rank: 71,
    async scrape(ctx) {
        const res = await ctx.proxiedFetcher(ctx.url, {
            headers: {
                Referer: ctx.url,
            },
        });
        if (!res.sourceUrls[0])
            throw new errors_1.NotFoundError('No watchable item found');
        const playlist = decode(res.sourceUrls[0]);
        if (!playlist.includes('.m3u8'))
            throw new Error('Failed to decode');
        const captions = res.subtitles
            ?.match(/\[([^\]]+)\](https?:\/\/\S+?)(?=,\[|$)/g)
            ?.map((entry) => {
            const match = entry.match(/\[([^\]]+)\](https?:\/\/\S+?)(?=,\[|$)/);
            if (match) {
                const [, language, url] = match;
                if (language && url) {
                    const languageCode = (0, captions_1.labelToLanguageCode)(language.replace(/ - .*/, ''));
                    const captionType = (0, captions_1.getCaptionTypeFromUrl)(url);
                    if (!languageCode || !captionType)
                        return null;
                    return {
                        id: url,
                        url: url.replace(',', ''),
                        language: languageCode,
                        type: captionType,
                        hasCorsRestrictions: false,
                    };
                }
            }
            return null;
        })
            .filter((x) => x !== null) ?? [];
        return {
            stream: [
                {
                    id: 'primary',
                    playlist,
                    type: 'hls',
                    flags: [targets_1.flags.CORS_ALLOWED],
                    captions,
                },
            ],
        };
    },
});
