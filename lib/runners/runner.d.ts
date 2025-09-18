import { FullScraperEvents } from '../entrypoint/utils/events';
import { ScrapeMedia } from '../entrypoint/utils/media';
import { FeatureMap } from '../entrypoint/utils/targets';
import { UseableFetcher } from '../fetchers/types';
import { ProviderList } from '../providers/get';
import { Stream } from '../providers/streams';
export type RunOutput = {
    sourceId: string;
    embedId?: string;
    stream: Stream;
};
export type SourceRunOutput = {
    sourceId: string;
    stream: Stream[];
    embeds: [];
};
export type EmbedRunOutput = {
    embedId: string;
    stream: Stream[];
};
export type ProviderRunnerOptions = {
    fetcher: UseableFetcher;
    proxiedFetcher: UseableFetcher;
    features: FeatureMap;
    sourceOrder?: string[];
    embedOrder?: string[];
    events?: FullScraperEvents;
    media: ScrapeMedia;
    proxyStreams?: boolean;
};
export declare function runAllProviders(list: ProviderList, ops: ProviderRunnerOptions): Promise<RunOutput | null>;
