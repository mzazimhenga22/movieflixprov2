import { FullScraperEvents, IndividualScraperEvents } from '../entrypoint/utils/events';
import { ScrapeMedia } from '../entrypoint/utils/media';
import { MetaOutput } from '../entrypoint/utils/meta';
import { FeatureMap } from '../entrypoint/utils/targets';
import { Fetcher } from '../fetchers/types';
import { Embed, EmbedOutput, Sourcerer, SourcererOutput } from '../providers/base';
import { RunOutput } from '../runners/runner';
export interface ProviderControlsInput {
    fetcher: Fetcher;
    proxiedFetcher?: Fetcher;
    features: FeatureMap;
    sources: Sourcerer[];
    embeds: Embed[];
    proxyStreams?: boolean;
}
export interface RunnerOptions {
    sourceOrder?: string[];
    embedOrder?: string[];
    events?: FullScraperEvents;
    media: ScrapeMedia;
    disableOpensubtitles?: boolean;
}
export interface SourceRunnerOptions {
    events?: IndividualScraperEvents;
    media: ScrapeMedia;
    id: string;
    disableOpensubtitles?: boolean;
}
export interface EmbedRunnerOptions {
    events?: IndividualScraperEvents;
    url: string;
    id: string;
    disableOpensubtitles?: boolean;
}
export interface ProviderControls {
    runAll(runnerOps: RunnerOptions): Promise<RunOutput | null>;
    runSourceScraper(runnerOps: SourceRunnerOptions): Promise<SourcererOutput>;
    runEmbedScraper(runnerOps: EmbedRunnerOptions): Promise<EmbedOutput>;
    getMetadata(id: string): MetaOutput | null;
    listSources(): MetaOutput[];
    listEmbeds(): MetaOutput[];
}
export declare function makeControls(ops: ProviderControlsInput): ProviderControls;
