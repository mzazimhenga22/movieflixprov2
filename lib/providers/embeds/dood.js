"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doodScraper = void 0;
const nanoid_1 = require("nanoid");
const base_1 = require("../../providers/base");
const nanoid = (0, nanoid_1.customAlphabet)('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', 10);
const baseUrl = 'https://d000d.com';
exports.doodScraper = (0, base_1.makeEmbed)({
    id: 'dood',
    name: 'dood',
    rank: 173,
    async scrape(ctx) {
        let url = ctx.url;
        if (ctx.url.includes('primewire')) {
            const request = await ctx.proxiedFetcher.full(ctx.url);
            url = request.finalUrl;
        }
        const id = url.split('/d/')[1] || url.split('/e/')[1];
        const doodData = await ctx.proxiedFetcher(`/e/${id}`, {
            method: 'GET',
            baseUrl,
        });
        const dataForLater = doodData.match(/\?token=([^&]+)&expiry=/)?.[1];
        const path = doodData.match(/\$\.get\('\/pass_md5([^']+)/)?.[1];
        const thumbnailTrack = doodData.match(/thumbnails:\s\{\s*vtt:\s'([^']*)'/);
        const doodPage = await ctx.proxiedFetcher(`/pass_md5${path}`, {
            headers: {
                Referer: `${baseUrl}/e/${id}`,
            },
            method: 'GET',
            baseUrl,
        });
        const downloadURL = `${doodPage}${nanoid()}?token=${dataForLater}&expiry=${Date.now()}`;
        if (!downloadURL.startsWith('http'))
            throw new Error('Invalid URL');
        return {
            stream: [
                {
                    id: 'primary',
                    type: 'file',
                    flags: [],
                    captions: [],
                    qualities: {
                        unknown: {
                            type: 'mp4',
                            url: downloadURL,
                        },
                    },
                    headers: {
                        Referer: baseUrl,
                    },
                    ...(thumbnailTrack
                        ? {
                            thumbnailTrack: {
                                type: 'vtt',
                                url: `https:${thumbnailTrack[1]}`,
                            },
                        }
                        : {}),
                },
            ],
        };
    },
});
