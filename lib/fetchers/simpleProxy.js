"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeSimpleProxyFetcher = makeSimpleProxyFetcher;
const common_1 = require("../fetchers/common");
const standardFetch_1 = require("../fetchers/standardFetch");
const headerMap = {
    cookie: 'X-Cookie',
    referer: 'X-Referer',
    origin: 'X-Origin',
    'user-agent': 'X-User-Agent',
    'x-real-ip': 'X-X-Real-Ip',
};
const responseHeaderMap = {
    'x-set-cookie': 'Set-Cookie',
};
function makeSimpleProxyFetcher(proxyUrl, f) {
    const proxiedFetch = async (url, ops) => {
        const fetcher = (0, standardFetch_1.makeStandardFetcher)(async (a, b) => {
            // AbortController
            const controller = new AbortController();
            const timeout = 15000; // 15s timeout
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            try {
                const res = await f(a, {
                    method: b?.method || 'GET',
                    headers: b?.headers || {},
                    body: b?.body,
                    credentials: b?.credentials,
                    signal: controller.signal, // Pass the signal to fetch
                });
                clearTimeout(timeoutId);
                // set extra headers that cant normally be accessed
                res.extraHeaders = new Headers();
                Object.entries(responseHeaderMap).forEach((entry) => {
                    const value = res.headers.get(entry[0]);
                    if (!value)
                        return;
                    res.extraHeaders?.set(entry[1].toLowerCase(), value);
                });
                // set correct final url
                res.extraUrl = res.headers.get('X-Final-Destination') ?? res.url;
                return res;
            }
            catch (error) {
                if (error.name === 'AbortError') {
                    throw new Error(`Fetch request to ${a} timed out after ${timeout}ms`);
                }
                throw error;
            }
        });
        const fullUrl = (0, common_1.makeFullUrl)(url, ops);
        const headerEntries = Object.entries(ops.headers).map((entry) => {
            const key = entry[0].toLowerCase();
            if (headerMap[key])
                return [headerMap[key], entry[1]];
            return entry;
        });
        return fetcher(proxyUrl, {
            ...ops,
            query: {
                destination: fullUrl,
            },
            headers: Object.fromEntries(headerEntries),
            baseUrl: undefined,
        });
    };
    return proxiedFetch;
}
