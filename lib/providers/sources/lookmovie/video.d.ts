import { MovieMedia, ShowMedia } from '../../../entrypoint/utils/media';
import { Caption } from '../../../providers/captions';
import { ScrapeContext } from '../../../utils/context';
import { StreamsDataResult } from './type';
export declare function getVideoSources(ctx: ScrapeContext, id: string, media: MovieMedia | ShowMedia): Promise<StreamsDataResult>;
export declare function getVideo(ctx: ScrapeContext, id: string, media: MovieMedia | ShowMedia): Promise<{
    playlist: string | null;
    captions: Caption[];
}>;
