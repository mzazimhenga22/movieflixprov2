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
exports.mixdropScraper = void 0;
const unpacker = __importStar(require("unpacker"));
const targets_1 = require("../../entrypoint/utils/targets");
const base_1 = require("../../providers/base");
const mixdropBase = 'https://mixdrop.ag';
const packedRegex = /(eval\(function\(p,a,c,k,e,d\){.*{}\)\))/;
const linkRegex = /MDCore\.wurl="(.*?)";/;
exports.mixdropScraper = (0, base_1.makeEmbed)({
    id: 'mixdrop',
    name: 'MixDrop',
    rank: 198,
    async scrape(ctx) {
        // Example url: https://mixdrop.co/e/pkwrgp0pizgod0
        // Example url: https://mixdrop.vc/e/pkwrgp0pizgod0
        let embedUrl = ctx.url;
        if (ctx.url.includes('primewire'))
            embedUrl = (await ctx.fetcher.full(ctx.url)).finalUrl;
        const embedId = new URL(embedUrl).pathname.split('/')[2];
        // constructing the url because many times mixdrop.co is returned which does not work
        // this also handels the case where preview page urls are returned
        // Example: https://mixdrop.vc/f/pkwrgp0pizgod0
        // these don't have the packed code
        const streamRes = await ctx.proxiedFetcher(`/e/${embedId}`, {
            baseUrl: mixdropBase,
        });
        const packed = streamRes.match(packedRegex);
        // MixDrop uses a queue system for embeds
        // If an embed is too new, the queue will
        // not be completed and thus the packed
        // JavaScript not present
        if (!packed) {
            throw new Error('failed to find packed mixdrop JavaScript');
        }
        const unpacked = unpacker.unpack(packed[1]);
        const link = unpacked.match(linkRegex);
        if (!link) {
            throw new Error('failed to find packed mixdrop source link');
        }
        const url = link[1];
        return {
            stream: [
                {
                    id: 'primary',
                    type: 'file',
                    flags: [targets_1.flags.IP_LOCKED],
                    captions: [],
                    qualities: {
                        unknown: {
                            type: 'mp4',
                            url: url.startsWith('http') ? url : `https:${url}`, // URLs don't always start with the protocol
                            headers: {
                                // MixDrop requires this header on all streams
                                Referer: mixdropBase,
                            },
                        },
                    },
                },
            ],
        };
    },
});
