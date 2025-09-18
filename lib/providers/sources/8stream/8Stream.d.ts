import { MovieScrapeContext, ShowScrapeContext } from '../../../utils/context';
export declare function getMovie(ctx: ShowScrapeContext | MovieScrapeContext, id: string, lang?: string): Promise<{
    success: boolean;
    data: any;
    availableLang: any[];
}>;
export declare function getTV(ctx: ShowScrapeContext | MovieScrapeContext, id: string, season: number, episode: number, lang: string): Promise<{
    success: boolean;
    data: any;
    availableLang: any;
}>;
