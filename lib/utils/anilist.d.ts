import { MovieMedia, ShowMedia } from '../entrypoint/utils/media';
import { ScrapeContext } from '../utils/context';
export declare function getAnilistIdFromMedia(ctx: ScrapeContext, media: MovieMedia | ShowMedia): Promise<number>;
