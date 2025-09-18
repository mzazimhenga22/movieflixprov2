import { Targets } from '../entrypoint/utils/targets';
import { Fetcher } from '../fetchers/types';
export interface ProviderMakerOptions {
    fetcher: Fetcher;
    proxiedFetcher?: Fetcher;
    target: Targets;
    consistentIpForRequests?: boolean;
    externalSources?: 'all' | string[];
    proxyStreams?: boolean;
}
export declare function makeProviders(ops: ProviderMakerOptions): import("../entrypoint/controls").ProviderControls;
