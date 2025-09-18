import FormData from 'form-data';
import { FetcherOptions } from '../fetchers/types';
export interface SeralizedBody {
    headers: Record<string, string>;
    body: FormData | URLSearchParams | string | undefined;
}
export declare function serializeBody(body: FetcherOptions['body']): SeralizedBody;
