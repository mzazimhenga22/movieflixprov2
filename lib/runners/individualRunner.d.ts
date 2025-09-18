import { IndividualScraperEvents } from '../entrypoint/utils/events';
import { ScrapeMedia } from '../entrypoint/utils/media';
import { FeatureMap } from '../entrypoint/utils/targets';
import { UseableFetcher } from '../fetchers/types';
import { EmbedOutput, SourcererOutput } from '../providers/base';
import { ProviderList } from '../providers/get';
export type IndividualSourceRunnerOptions = {
    features: FeatureMap;
    fetcher: UseableFetcher;
    proxiedFetcher: UseableFetcher;
    media: ScrapeMedia;
    id: string;
    events?: IndividualScraperEvents;
    proxyStreams?: boolean;
};
export declare function scrapeInvidualSource(list: ProviderList, ops: IndividualSourceRunnerOptions): Promise<SourcererOutput>;
export type IndividualEmbedRunnerOptions = {
    features: FeatureMap;
    fetcher: UseableFetcher;
    proxiedFetcher: UseableFetcher;
    url: string;
    id: string;
    events?: IndividualScraperEvents;
    proxyStreams?: boolean;
};
export declare function scrapeIndividualEmbed(list: ProviderList, ops: IndividualEmbedRunnerOptions): Promise<EmbedOutput>;
