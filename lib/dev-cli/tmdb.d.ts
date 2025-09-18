import { MovieMedia, ShowMedia } from '..';
export declare function makeTMDBRequest(url: string, appendToResponse?: string): Promise<Response>;
export declare function getMovieMediaDetails(id: string): Promise<MovieMedia>;
export declare function getShowMediaDetails(id: string, seasonNumber: string, episodeNumber: string): Promise<ShowMedia>;
