"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setM3U8ProxyUrl = setM3U8ProxyUrl;
exports.getM3U8ProxyUrl = getM3U8ProxyUrl;
exports.requiresProxy = requiresProxy;
exports.setupProxy = setupProxy;
exports.createM3U8ProxyUrl = createM3U8ProxyUrl;
exports.updateM3U8ProxyUrl = updateM3U8ProxyUrl;
const targets_1 = require("../entrypoint/utils/targets");
// Default proxy URL for general purpose proxying
const DEFAULT_PROXY_URL = 'https://proxy.nsbx.ru/proxy';
// Default M3U8 proxy URL for HLS stream proxying
let CONFIGURED_M3U8_PROXY_URL = 'https://proxy2.pstream.mov';
/**
 * Set a custom M3U8 proxy URL to use for all M3U8 proxy requests
 * @param proxyUrl - The base URL of the M3U8 proxy
 */
function setM3U8ProxyUrl(proxyUrl) {
    CONFIGURED_M3U8_PROXY_URL = proxyUrl;
}
/**
 * Get the currently configured M3U8 proxy URL
 * @returns The configured M3U8 proxy URL
 */
function getM3U8ProxyUrl() {
    return CONFIGURED_M3U8_PROXY_URL;
}
function requiresProxy(stream) {
    if (!stream.flags.includes(targets_1.flags.CORS_ALLOWED) || !!(stream.headers && Object.keys(stream.headers).length > 0))
        return true;
    return false;
}
function setupProxy(stream) {
    const headers = stream.headers && Object.keys(stream.headers).length > 0 ? stream.headers : undefined;
    const options = {
        ...(stream.type === 'hls' && { depth: stream.proxyDepth ?? 0 }),
    };
    const payload = {
        headers,
        options,
    };
    if (stream.type === 'hls') {
        payload.type = 'hls';
        payload.url = stream.playlist;
        stream.playlist = `${DEFAULT_PROXY_URL}?${new URLSearchParams({ payload: Buffer.from(JSON.stringify(payload)).toString('base64url') })}`;
    }
    if (stream.type === 'file') {
        payload.type = 'mp4';
        Object.entries(stream.qualities).forEach((entry) => {
            payload.url = entry[1].url;
            entry[1].url = `${DEFAULT_PROXY_URL}?${new URLSearchParams({ payload: Buffer.from(JSON.stringify(payload)).toString('base64url') })}`;
        });
    }
    stream.headers = {};
    stream.flags = [targets_1.flags.CORS_ALLOWED];
    return stream;
}
/**
 * Creates a proxied M3U8 URL using the configured M3U8 proxy
 * @param url - The original M3U8 URL to proxy
 * @param headers - Headers to include with the request
 * @returns The proxied M3U8 URL
 */
function createM3U8ProxyUrl(url, headers = {}) {
    const encodedUrl = encodeURIComponent(url);
    const encodedHeaders = encodeURIComponent(JSON.stringify(headers));
    return `${CONFIGURED_M3U8_PROXY_URL}/m3u8-proxy?url=${encodedUrl}${headers ? `&headers=${encodedHeaders}` : ''}`;
}
/**
 * Updates an existing M3U8 proxy URL to use the currently configured proxy
 * @param url - The M3U8 proxy URL to update
 * @returns The updated M3U8 proxy URL
 */
function updateM3U8ProxyUrl(url) {
    if (url.includes('/m3u8-proxy?url=')) {
        return url.replace(/https:\/\/[^/]+\/m3u8-proxy/, `${CONFIGURED_M3U8_PROXY_URL}/m3u8-proxy`);
    }
    return url;
}
