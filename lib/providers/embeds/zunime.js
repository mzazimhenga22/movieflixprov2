"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zunimeEmbeds = void 0;
exports.makeZunimeEmbed = makeZunimeEmbed;
const errors_1 = require("../../utils/errors");
const base_1 = require("../base");
const ZUNIME_SERVERS = ['hd-2', 'miko', 'shiro', 'zaza'];
const baseUrl = 'https://backend.xaiby.sbs';
const headers = {
    referer: 'https://vidnest.fun/',
    origin: 'https://vidnest.fun',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
};
function makeZunimeEmbed(id, rank = 100) {
    return (0, base_1.makeEmbed)({
        id: `zunime-${id}`,
        name: `${id.charAt(0).toUpperCase() + id.slice(1)}`,
        rank,
        async scrape(ctx) {
            const serverName = id;
            const query = JSON.parse(ctx.url);
            const { anilistId, episode } = query;
            const res = await ctx.proxiedFetcher(`${'/sources'}`, {
                baseUrl,
                headers,
                query: {
                    id: String(anilistId),
                    ep: String(episode ?? 1),
                    host: serverName,
                    type: 'dub',
                },
            });
            // eslint-disable-next-line no-console
            console.log(res);
            const resAny = res;
            if (!resAny?.success || !resAny?.sources?.url) {
                throw new errors_1.NotFoundError('No stream URL found in response');
            }
            const streamUrl = resAny.sources.url;
            const upstreamHeaders = resAny?.sources?.headers && Object.keys(resAny.sources.headers).length > 0 ? resAny.sources.headers : headers;
            ctx.progress(100);
            return {
                stream: [
                    {
                        id: 'primary',
                        type: 'hls',
                        playlist: `https://proxy-2.madaraverse.online/proxy?url=${encodeURIComponent(streamUrl)}`,
                        headers: upstreamHeaders,
                        flags: [],
                        captions: [],
                    },
                ],
            };
        },
    });
}
exports.zunimeEmbeds = ZUNIME_SERVERS.map((server, i) => makeZunimeEmbed(server, 260 - i));
