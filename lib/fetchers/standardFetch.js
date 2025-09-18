"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeStandardFetcher = makeStandardFetcher;
const body_1 = require("../fetchers/body");
const common_1 = require("../fetchers/common");
function getHeaders(list, res) {
    const output = new Headers();
    list.forEach((header) => {
        const realHeader = header.toLowerCase();
        const realValue = res.headers.get(realHeader);
        const extraValue = res.extraHeaders?.get(realHeader);
        const value = extraValue ?? realValue;
        if (!value)
            return;
        output.set(realHeader, value);
    });
    return output;
}
function makeStandardFetcher(f) {
    const normalFetch = async (url, ops) => {
        const fullUrl = (0, common_1.makeFullUrl)(url, ops);
        const seralizedBody = (0, body_1.serializeBody)(ops.body);
        // AbortController
        const controller = new AbortController();
        const timeout = 15000; // 15s timeout
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        try {
            const res = await f(fullUrl, {
                method: ops.method,
                headers: {
                    ...seralizedBody.headers,
                    ...ops.headers,
                },
                body: seralizedBody.body,
                credentials: ops.credentials,
                signal: controller.signal, // Pass the signal to fetch
            });
            clearTimeout(timeoutId);
            let body;
            const isJson = res.headers.get('content-type')?.includes('application/json');
            if (isJson)
                body = await res.json();
            else
                body = await res.text();
            return {
                body,
                finalUrl: res.extraUrl ?? res.url,
                headers: getHeaders(ops.readHeaders, res),
                statusCode: res.status,
            };
        }
        catch (error) {
            if (error.name === 'AbortError') {
                throw new Error(`Fetch request to ${fullUrl} timed out after ${timeout}ms`);
            }
            throw error;
        }
    };
    return normalFetch;
}
