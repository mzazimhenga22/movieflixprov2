"use strict";
/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const dotenv_1 = __importDefault(require("dotenv"));
const enquirer_1 = require("enquirer");
const scraper_1 = require("../dev-cli/scraper");
const validate_1 = require("../dev-cli/validate");
const __1 = require("..");
dotenv_1.default.config();
const sourceScrapers = [...(0, __1.getBuiltinSources)(), ...(0, __1.getBuiltinExternalSources)()].sort((a, b) => b.rank - a.rank);
const embedScrapers = (0, __1.getBuiltinEmbeds)().sort((a, b) => b.rank - a.rank);
const sources = [...sourceScrapers, ...embedScrapers];
function joinMediaTypes(mediaTypes) {
    if (mediaTypes) {
        const formatted = mediaTypes
            .map((type) => {
            return `${type[0].toUpperCase() + type.substring(1).toLowerCase()}s`;
        })
            .join(' / ');
        return `(${formatted})`;
    }
    return ''; // * Embed sources pass through here too
}
async function runQuestions() {
    const options = {
        fetcher: 'node-fetch',
        sourceId: '',
        tmdbId: '',
        type: 'movie',
        season: '0',
        episode: '0',
        url: '',
    };
    const answers = await (0, enquirer_1.prompt)([
        {
            type: 'select',
            name: 'fetcher',
            message: 'Select a fetcher mode',
            choices: [
                {
                    message: 'Native',
                    name: 'native',
                },
                {
                    message: 'Node fetch',
                    name: 'node-fetch',
                },
                {
                    message: 'Browser',
                    name: 'browser',
                },
            ],
        },
        {
            type: 'select',
            name: 'source',
            message: 'Select a source',
            choices: sources.map((source) => ({
                message: `[${source.type.toLocaleUpperCase()}] [${source.rank}] ${source.name} ${joinMediaTypes(source.mediaTypes)}`.trim(),
                name: source.id,
            })),
        },
    ]);
    options.fetcher = answers.fetcher;
    options.sourceId = answers.source;
    const source = sources.find(({ id }) => id === answers.source);
    if (!source) {
        throw new Error(`No source with ID ${answers.source} found`);
    }
    if (source.type === 'embed') {
        const sourceAnswers = await (0, enquirer_1.prompt)([
            {
                type: 'input',
                name: 'url',
                message: 'Embed URL',
            },
        ]);
        options.url = sourceAnswers.url;
    }
    else {
        const sourceAnswers = await (0, enquirer_1.prompt)([
            {
                type: 'input',
                name: 'id',
                message: 'TMDB ID',
            },
            {
                type: 'select',
                name: 'type',
                message: 'Media type',
                choices: [
                    {
                        message: 'Movie',
                        name: 'movie',
                    },
                    {
                        message: 'TV Show',
                        name: 'show',
                    },
                ],
            },
        ]);
        options.tmdbId = sourceAnswers.id;
        options.type = sourceAnswers.type;
        if (sourceAnswers.type === 'show') {
            const seriesAnswers = await (0, enquirer_1.prompt)([
                {
                    type: 'input',
                    name: 'season',
                    message: 'Season',
                },
                {
                    type: 'input',
                    name: 'episode',
                    message: 'Episode',
                },
            ]);
            options.season = seriesAnswers.season;
            options.episode = seriesAnswers.episode;
        }
    }
    const { providerOptions, source: validatedSource, options: validatedOps } = await (0, validate_1.processOptions)(sources, options);
    await (0, scraper_1.runScraper)(providerOptions, validatedSource, validatedOps);
}
async function runCommandLine() {
    commander_1.program
        .option('-f, --fetcher <fetcher>', "Fetcher to use. Either 'native' or 'node-fetch'", 'node-fetch')
        .option('-sid, --source-id <id>', 'ID for the source to use. Either an embed or provider', '')
        .option('-tid, --tmdb-id <id>', 'TMDB ID for the media to scrape. Only used if source is a provider', '')
        .option('-t, --type <type>', "Media type. Either 'movie' or 'show'. Only used if source is a provider", 'movie')
        .option('-s, --season <number>', "Season number. Only used if type is 'show'", '0')
        .option('-e, --episode <number>', "Episode number. Only used if type is 'show'", '0')
        .option('-u, --url <embed URL>', 'URL to a video embed. Only used if source is an embed', '');
    commander_1.program.parse();
    const { providerOptions, source: validatedSource, options: validatedOps, } = await (0, validate_1.processOptions)(sources, commander_1.program.opts());
    await (0, scraper_1.runScraper)(providerOptions, validatedSource, validatedOps);
}
if (process.argv.length === 2) {
    runQuestions()
        .catch(() => console.error('Exited.'))
        .finally(() => process.exit(0));
}
else {
    runCommandLine()
        .catch(() => console.error('Exited.'))
        .finally(() => process.exit(0));
}
