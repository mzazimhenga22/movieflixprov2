import { Fetcher, FetcherOptions, UseableFetcher } from '../fetchers/types';
export type FullUrlOptions = Pick<FetcherOptions, 'query' | 'baseUrl'>;
export declare function makeFullUrl(url: string, ops?: FullUrlOptions): string;
export declare function makeFetcher(fetcher: Fetcher): UseableFetcher;
