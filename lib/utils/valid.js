"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidStream = isValidStream;
exports.validatePlayableStream = validatePlayableStream;
exports.validatePlayableStreams = validatePlayableStreams;
// import { alphaScraper, deltaScraper } from '@/providers/embeds/nsbx';
// import { astraScraper, novaScraper, orionScraper } from '@/providers/embeds/whvx';
const bombtheirish_1 = require("../providers/archive/sources/bombtheirish");
const mp4_1 = require("../providers/embeds/warezcdn/mp4");
const SKIP_VALIDATION_CHECK_IDS = [
    mp4_1.warezcdnembedMp4Scraper.id,
    // deltaScraper.id,
    // alphaScraper.id,
    // novaScraper.id,
    // astraScraper.id,
    // orionScraper.id,
];
const UNPROXIED_VALIDATION_CHECK_IDS = [
    // sources here are always proxied, so we dont need to validate with a proxy
    bombtheirish_1.bombtheirishScraper.id, // this one is dead, but i'll keep it here for now
];
function isValidStream(stream) {
    if (!stream)
        return false;
    if (stream.type === 'hls') {
        if (!stream.playlist)
            return false;
        return true;
    }
    if (stream.type === 'file') {
        const validQualities = Object.values(stream.qualities).filter((v) => v.url.length > 0);
        if (validQualities.length === 0)
            return false;
        return true;
    }
    // unknown file type
    return false;
}
/**
 * Check if a URL is a proxy URL that should be validated with normal fetch
 * instead of proxiedFetcher
 */
function isAlreadyProxyUrl(url) {
    return url.includes('/m3u8-proxy?url=');
}
async function validatePlayableStream(stream, ops, sourcererId) {
    if (SKIP_VALIDATION_CHECK_IDS.includes(sourcererId))
        return stream;
    const alwaysUseNormalFetch = UNPROXIED_VALIDATION_CHECK_IDS.includes(sourcererId);
    if (stream.type === 'hls') {
        // dirty temp fix for base64 urls to prep for fmhy poll
        if (stream.playlist.startsWith('data:'))
            return stream;
        const useNormalFetch = alwaysUseNormalFetch || isAlreadyProxyUrl(stream.playlist);
        let result;
        if (useNormalFetch) {
            try {
                const response = await fetch(stream.playlist, {
                    method: 'GET',
                    headers: {
                        ...stream.preferredHeaders,
                        ...stream.headers,
                    },
                });
                result = {
                    statusCode: response.status,
                    body: await response.text(),
                    finalUrl: response.url,
                };
            }
            catch (error) {
                return null;
            }
        }
        else {
            result = await ops.proxiedFetcher.full(stream.playlist, {
                method: 'GET',
                headers: {
                    ...stream.preferredHeaders,
                    ...stream.headers,
                },
            });
        }
        if (result.statusCode < 200 || result.statusCode >= 400)
            return null;
        return stream;
    }
    if (stream.type === 'file') {
        const validQualitiesResults = await Promise.all(Object.values(stream.qualities).map(async (quality) => {
            const useNormalFetch = alwaysUseNormalFetch || isAlreadyProxyUrl(quality.url);
            if (useNormalFetch) {
                try {
                    const response = await fetch(quality.url, {
                        method: 'GET',
                        headers: {
                            ...stream.preferredHeaders,
                            ...stream.headers,
                            Range: 'bytes=0-1',
                        },
                    });
                    return {
                        statusCode: response.status,
                        body: await response.text(),
                        finalUrl: response.url,
                    };
                }
                catch (error) {
                    return { statusCode: 500, body: '', finalUrl: quality.url };
                }
            }
            return ops.proxiedFetcher.full(quality.url, {
                method: 'GET',
                headers: {
                    ...stream.preferredHeaders,
                    ...stream.headers,
                    Range: 'bytes=0-1',
                },
            });
        }));
        // remove invalid qualities from the stream
        const validQualities = stream.qualities;
        Object.keys(stream.qualities).forEach((quality, index) => {
            if (validQualitiesResults[index].statusCode < 200 || validQualitiesResults[index].statusCode >= 400) {
                delete validQualities[quality];
            }
        });
        if (Object.keys(validQualities).length === 0)
            return null;
        return { ...stream, qualities: validQualities };
    }
    return null;
}
async function validatePlayableStreams(streams, ops, sourcererId) {
    if (SKIP_VALIDATION_CHECK_IDS.includes(sourcererId))
        return streams;
    return (await Promise.all(streams.map((stream) => validatePlayableStream(stream, ops, sourcererId)))).filter((v) => v !== null);
}
