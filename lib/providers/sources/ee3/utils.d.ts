import { MovieScrapeContext, ShowScrapeContext } from '../../../utils/context';
export declare function login(user: string, pass: string, ctx: ShowScrapeContext | MovieScrapeContext): Promise<string | null>;
export declare function parseSearch(body: string): {
    title: string;
    year: number;
    id: string;
}[];
