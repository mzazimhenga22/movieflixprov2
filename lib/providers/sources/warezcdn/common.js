"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.warezcdnWorkerProxy = exports.warezcdnPlayerBase = exports.warezcdnApiBase = exports.warezcdnBase = void 0;
exports.getExternalPlayerUrl = getExternalPlayerUrl;
exports.warezcdnBase = 'https://embed.warezcdn.link';
exports.warezcdnApiBase = 'https://warezcdn.link/embed';
exports.warezcdnPlayerBase = 'https://warezcdn.link/player';
exports.warezcdnWorkerProxy = 'https://workerproxy.warezcdn.workers.dev';
async function getExternalPlayerUrl(ctx, embedId, embedUrl) {
    const params = {
        id: embedUrl,
        sv: embedId,
    };
    const realUrl = await ctx.proxiedFetcher(`/getPlay.php`, {
        baseUrl: exports.warezcdnApiBase,
        headers: {
            Referer: `${exports.warezcdnApiBase}/getEmbed.php?${new URLSearchParams(params)}`,
        },
        query: params,
    });
    const realEmbedUrl = realUrl.match(/window\.location\.href="([^"]*)";/);
    if (!realEmbedUrl)
        throw new Error('Could not find embed url');
    return realEmbedUrl[1];
}
