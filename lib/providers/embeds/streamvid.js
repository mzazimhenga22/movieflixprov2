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
exports.streamvidScraper = void 0;
const unpacker = __importStar(require("unpacker"));
const targets_1 = require("../../entrypoint/utils/targets");
const base_1 = require("../../providers/base");
const packedRegex = /(eval\(function\(p,a,c,k,e,d\).*\)\)\))/;
const linkRegex = /src:"(https:\/\/[^"]+)"/;
exports.streamvidScraper = (0, base_1.makeEmbed)({
    id: 'streamvid',
    name: 'Streamvid',
    rank: 215,
    async scrape(ctx) {
        // Example url: https://streamvid.net/fu1jaf96vofx
        const streamRes = await ctx.proxiedFetcher(ctx.url);
        const packed = streamRes.match(packedRegex);
        if (!packed)
            throw new Error('streamvid packed not found');
        const unpacked = unpacker.unpack(packed[1]);
        const link = unpacked.match(linkRegex);
        if (!link)
            throw new Error('streamvid link not found');
        return {
            stream: [
                {
                    type: 'hls',
                    id: 'primary',
                    playlist: link[1],
                    flags: [targets_1.flags.CORS_ALLOWED],
                    captions: [],
                },
            ],
        };
    },
});
