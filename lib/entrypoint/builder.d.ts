import { ProviderControls } from '../entrypoint/controls';
import { Targets } from '../entrypoint/utils/targets';
import { Fetcher } from '../fetchers/types';
import { Embed, Sourcerer } from '../providers/base';
export type ProviderBuilder = {
    setTarget(target: Targets): ProviderBuilder;
    setFetcher(fetcher: Fetcher): ProviderBuilder;
    setProxiedFetcher(fetcher: Fetcher): ProviderBuilder;
    addSource(scraper: Sourcerer): ProviderBuilder;
    addSource(name: string): ProviderBuilder;
    addEmbed(scraper: Embed): ProviderBuilder;
    addEmbed(name: string): ProviderBuilder;
    addBuiltinProviders(): ProviderBuilder;
    enableConsistentIpForRequests(): ProviderBuilder;
    build(): ProviderControls;
};
export declare function buildProviders(): ProviderBuilder;
