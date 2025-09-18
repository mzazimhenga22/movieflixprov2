import { FetchLike } from '../fetchers/fetch';
import { Fetcher } from '../fetchers/types';
export declare function makeSimpleProxyFetcher(proxyUrl: string, f: FetchLike): Fetcher;
