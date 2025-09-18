import { MovieMedia, ShowMedia } from '../../../../entrypoint/utils/media';
import { ScrapeContext } from '../../../../utils/context';
import { EmbedsResult, Result } from './type';
export declare function searchAndFindMedia(ctx: ScrapeContext, media: MovieMedia | ShowMedia): Promise<Result | undefined>;
export declare function scrapeIds(ctx: ScrapeContext, media: MovieMedia | ShowMedia, result: Result): Promise<EmbedsResult>;
