"use strict";
/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runScraper = runScraper;
const fs_1 = require("fs");
const path_1 = require("path");
const puppeteer_1 = __importDefault(require("puppeteer"));
const spinnies_1 = __importDefault(require("spinnies"));
const vite_1 = require("vite");
const config_1 = require("../dev-cli/config");
const logging_1 = require("../dev-cli/logging");
const tmdb_1 = require("../dev-cli/tmdb");
const __1 = require("..");
async function runBrowserScraping(providerOptions, source, options) {
    if (!(0, fs_1.existsSync)((0, path_1.join)(__dirname, '../../lib/index.js')))
        throw new Error('Please compile before running cli in browser mode');
    const config = (0, config_1.getConfig)();
    if (!config.proxyUrl)
        throw new Error('Simple proxy url must be set in the environment (MOVIE_WEB_PROXY_URL) for browser mode to work');
    const root = (0, path_1.join)(__dirname, 'browser');
    let server;
    let browser;
    try {
        // setup browser
        await (0, vite_1.build)({
            root,
        });
        server = await (0, vite_1.preview)({
            root,
        });
        browser = await puppeteer_1.default.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const page = await browser.newPage();
        // This is the dev cli, so we can use console.log
        // eslint-disable-next-line no-console
        page.on('console', (message) => console.log(`${message.type().slice(0, 3).toUpperCase()} ${message.text()}`));
        if (!server?.resolvedUrls?.local.length)
            throw new Error('Server did not start');
        await page.goto(server?.resolvedUrls.local[0]);
        // get input media
        let input;
        if (source.type === 'embed') {
            input = {
                url: options.url,
                id: source.id,
            };
        }
        else if (source.type === 'source') {
            let media;
            if (options.type === 'movie') {
                media = await (0, tmdb_1.getMovieMediaDetails)(options.tmdbId);
            }
            else {
                media = await (0, tmdb_1.getShowMediaDetails)(options.tmdbId, options.season, options.episode);
            }
            input = {
                media,
                id: source.id,
            };
        }
        else {
            throw new Error('Wrong source input type');
        }
        return await page.evaluate(async (proxy, type, inp) => {
            return window.scrape(proxy, type, inp);
        }, config.proxyUrl, source.type, input);
    }
    finally {
        server?.httpServer.close();
        await browser?.close();
    }
}
async function runActualScraping(providerOptions, source, options) {
    if (options.fetcher === 'browser')
        return runBrowserScraping(providerOptions, source, options);
    const providers = (0, __1.makeProviders)(providerOptions);
    if (source.type === 'embed') {
        return providers.runEmbedScraper({
            disableOpensubtitles: true,
            url: options.url,
            id: source.id,
        });
    }
    if (source.type === 'source') {
        let media;
        if (options.type === 'movie') {
            media = await (0, tmdb_1.getMovieMediaDetails)(options.tmdbId);
        }
        else {
            media = await (0, tmdb_1.getShowMediaDetails)(options.tmdbId, options.season, options.episode);
        }
        return providers.runSourceScraper({
            disableOpensubtitles: true,
            media,
            id: source.id,
        });
    }
    throw new Error('Invalid source type');
}
async function runScraper(providerOptions, source, options) {
    const spinnies = new spinnies_1.default();
    spinnies.add('scrape', { text: `Running ${source.name} scraper` });
    try {
        const result = await runActualScraping(providerOptions, source, options);
        spinnies.succeed('scrape', { text: 'Done!' });
        (0, logging_1.logDeepObject)(result);
    }
    catch (error) {
        let message = 'Unknown error';
        if (error instanceof Error) {
            message = error.message;
        }
        spinnies.fail('scrape', { text: `ERROR: ${message}` });
        console.error(error);
    }
}
