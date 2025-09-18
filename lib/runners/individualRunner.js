"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeInvidualSource = scrapeInvidualSource;
exports.scrapeIndividualEmbed = scrapeIndividualEmbed;
const targets_1 = require("../entrypoint/utils/targets");
const errors_1 = require("../utils/errors");
const proxy_1 = require("../utils/proxy");
const valid_1 = require("../utils/valid");
async function scrapeInvidualSource(list, ops) {
    const sourceScraper = list.sources.find((v) => ops.id === v.id);
    if (!sourceScraper)
        throw new Error('Source with ID not found');
    if (ops.media.type === 'movie' && !sourceScraper.scrapeMovie)
        throw new Error('Source is not compatible with movies');
    if (ops.media.type === 'show' && !sourceScraper.scrapeShow)
        throw new Error('Source is not compatible with shows');
    const contextBase = {
        fetcher: ops.fetcher,
        proxiedFetcher: ops.proxiedFetcher,
        progress(val) {
            ops.events?.update?.({
                id: sourceScraper.id,
                percentage: val,
                status: 'pending',
            });
        },
    };
    let output = null;
    if (ops.media.type === 'movie' && sourceScraper.scrapeMovie)
        output = await sourceScraper.scrapeMovie({
            ...contextBase,
            media: ops.media,
        });
    else if (ops.media.type === 'show' && sourceScraper.scrapeShow)
        output = await sourceScraper.scrapeShow({
            ...contextBase,
            media: ops.media,
        });
    // filter output with only valid streams
    if (output?.stream) {
        output.stream = output.stream
            .filter((stream) => (0, valid_1.isValidStream)(stream))
            .filter((stream) => (0, targets_1.flagsAllowedInFeatures)(ops.features, stream.flags));
        output.stream = output.stream.map((stream) => (0, proxy_1.requiresProxy)(stream) && ops.proxyStreams ? (0, proxy_1.setupProxy)(stream) : stream);
    }
    if (!output)
        throw new Error('output is null');
    // filter output with only valid embeds that are not disabled
    output.embeds = output.embeds.filter((embed) => {
        const e = list.embeds.find((v) => v.id === embed.embedId);
        if (!e || e.disabled)
            return false;
        return true;
    });
    if ((!output.stream || output.stream.length === 0) && output.embeds.length === 0)
        throw new errors_1.NotFoundError('No streams found');
    // only check for playable streams if there are streams, and if there are no embeds
    if (output.stream && output.stream.length > 0 && output.embeds.length === 0) {
        const playableStreams = await (0, valid_1.validatePlayableStreams)(output.stream, ops, sourceScraper.id);
        if (playableStreams.length === 0)
            throw new errors_1.NotFoundError('No playable streams found');
        output.stream = playableStreams;
    }
    return output;
}
async function scrapeIndividualEmbed(list, ops) {
    const embedScraper = list.embeds.find((v) => ops.id === v.id);
    if (!embedScraper)
        throw new Error('Embed with ID not found');
    const url = ops.url;
    const output = await embedScraper.scrape({
        fetcher: ops.fetcher,
        proxiedFetcher: ops.proxiedFetcher,
        url,
        progress(val) {
            ops.events?.update?.({
                id: embedScraper.id,
                percentage: val,
                status: 'pending',
            });
        },
    });
    output.stream = output.stream
        .filter((stream) => (0, valid_1.isValidStream)(stream))
        .filter((stream) => (0, targets_1.flagsAllowedInFeatures)(ops.features, stream.flags));
    if (output.stream.length === 0)
        throw new errors_1.NotFoundError('No streams found');
    output.stream = output.stream.map((stream) => (0, proxy_1.requiresProxy)(stream) && ops.proxyStreams ? (0, proxy_1.setupProxy)(stream) : stream);
    const playableStreams = await (0, valid_1.validatePlayableStreams)(output.stream, ops, embedScraper.id);
    if (playableStreams.length === 0)
        throw new errors_1.NotFoundError('No playable streams found');
    output.stream = playableStreams;
    return output;
}
