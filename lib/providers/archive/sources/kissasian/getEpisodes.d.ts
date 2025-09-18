import type { CheerioAPI } from 'cheerio';
export declare function getEpisodes(dramaPage: CheerioAPI): {
    number: string;
    url: string | undefined;
}[];
