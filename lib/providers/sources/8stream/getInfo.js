"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = getStream;
const cheerio = __importStar(require("cheerio"));
const errors_1 = require("../../../utils/errors");
async function getStream(ctx, id) {
    try {
        const baseUrl = 'https://ftmoh345xme.com';
        const headers = {
            Origin: 'https://friness-cherlormur-i-275.site',
            Referer: 'https://google.com/',
            Dnt: '1',
        };
        const url = `${baseUrl}/play/${id}`;
        const result = await ctx.proxiedFetcher(url, {
            headers: {
                ...headers,
            },
            method: 'GET',
        });
        const $ = cheerio.load(result);
        const script = $('script').last().html();
        if (!script) {
            throw new errors_1.NotFoundError('Failed to extract script data');
        }
        const content = script.match(/(\{[^;]+});/)?.[1] || script.match(/\((\{.*\})\)/)?.[1];
        if (!content) {
            throw new errors_1.NotFoundError('Media not found');
        }
        const data = JSON.parse(content);
        let file = data.file;
        if (!file) {
            throw new errors_1.NotFoundError('File not found');
        }
        if (file.startsWith('/')) {
            file = baseUrl + file;
        }
        const key = data.key;
        const headers2 = {
            Origin: 'https://friness-cherlormur-i-275.site',
            Referer: 'https://google.com/',
            Dnt: '1',
            'X-Csrf-Token': key,
        };
        const PlayListRes = await ctx.proxiedFetcher(file, {
            headers: {
                ...headers2,
            },
            method: 'GET',
        });
        const playlist = PlayListRes;
        return {
            success: true,
            data: {
                playlist,
                key,
            },
        };
    }
    catch (error) {
        if (error instanceof errors_1.NotFoundError)
            throw error;
        throw new errors_1.NotFoundError('Failed to fetch media info');
    }
}
