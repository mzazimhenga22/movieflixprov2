import * as FormData from 'form-data';
export type FetcherOptions = {
    baseUrl?: string;
    headers?: Record<string, string>;
    query?: Record<string, string>;
    method?: 'HEAD' | 'GET' | 'POST';
    readHeaders?: string[];
    body?: Record<string, any> | string | FormData | URLSearchParams;
    credentials?: 'include' | 'same-origin' | 'omit';
};
export type DefaultedFetcherOptions = {
    baseUrl?: string;
    body?: Record<string, any> | string | FormData;
    headers: Record<string, string>;
    query: Record<string, string>;
    readHeaders: string[];
    method: 'HEAD' | 'GET' | 'POST';
    credentials?: 'include' | 'same-origin' | 'omit';
};
export type FetcherResponse<T = any> = {
    statusCode: number;
    headers: Headers;
    finalUrl: string;
    body: T;
};
export type Fetcher = {
    <T = any>(url: string, ops: DefaultedFetcherOptions): Promise<FetcherResponse<T>>;
};
export type UseableFetcher = {
    <T = any>(url: string, ops?: FetcherOptions): Promise<T>;
    full: <T = any>(url: string, ops?: FetcherOptions) => Promise<FetcherResponse<T>>;
};
