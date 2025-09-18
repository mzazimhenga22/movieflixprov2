"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = getStream;
const errors_1 = require("../../../utils/errors");
async function getStream(ctx, file, key) {
    const f = file;
    const path = `${f.slice(1)}.txt`;
    try {
        const baseUrl = 'https://ftmoh345xme.com';
        const headers = {
            Origin: 'https://friness-cherlormur-i-275.site',
            Referer: 'https://google.com/',
            Dnt: '1',
            'X-Csrf-Token': key,
        };
        const url = `${baseUrl}/playlist/${path}`;
        const result = await ctx.proxiedFetcher(url, {
            headers: {
                ...headers,
            },
            method: 'GET',
        });
        return {
            success: true,
            data: {
                link: result,
            },
        };
    }
    catch (error) {
        throw new errors_1.NotFoundError('Failed to fetch stream data');
    }
}
