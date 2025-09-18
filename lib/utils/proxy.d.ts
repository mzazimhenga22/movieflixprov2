import { Stream } from '../providers/streams';
/**
 * Set a custom M3U8 proxy URL to use for all M3U8 proxy requests
 * @param proxyUrl - The base URL of the M3U8 proxy
 */
export declare function setM3U8ProxyUrl(proxyUrl: string): void;
/**
 * Get the currently configured M3U8 proxy URL
 * @returns The configured M3U8 proxy URL
 */
export declare function getM3U8ProxyUrl(): string;
export declare function requiresProxy(stream: Stream): boolean;
export declare function setupProxy(stream: Stream): Stream;
/**
 * Creates a proxied M3U8 URL using the configured M3U8 proxy
 * @param url - The original M3U8 URL to proxy
 * @param headers - Headers to include with the request
 * @returns The proxied M3U8 URL
 */
export declare function createM3U8ProxyUrl(url: string, headers?: Record<string, string>): string;
/**
 * Updates an existing M3U8 proxy URL to use the currently configured proxy
 * @param url - The M3U8 proxy URL to update
 * @returns The updated M3U8 proxy URL
 */
export declare function updateM3U8ProxyUrl(url: string): string;
