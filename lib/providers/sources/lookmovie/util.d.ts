import { MovieMedia, ShowMedia } from '../../../entrypoint/utils/media';
import { ScrapeContext } from '../../../utils/context';
import { ResultItem } from './type';
export declare const baseUrl = "https://lmscript.xyz";
export declare function searchAndFindMedia(ctx: ScrapeContext, media: MovieMedia | ShowMedia): Promise<ResultItem | undefined>;
export declare function scrape(ctx: ScrapeContext, media: MovieMedia | ShowMedia, result: ResultItem): Promise<{
    playlist: string | null;
    captions: import("../../captions").Caption[];
}>;
