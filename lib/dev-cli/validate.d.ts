import { Embed, Sourcerer } from '../providers/base';
import { ProviderMakerOptions } from '..';
export type CommandLineArguments = {
    fetcher: string;
    sourceId: string;
    tmdbId: string;
    type: string;
    season: string;
    episode: string;
    url: string;
};
export declare function processOptions(sources: Array<Embed | Sourcerer>, options: CommandLineArguments): Promise<{
    providerOptions: ProviderMakerOptions;
    options: CommandLineArguments;
    source: Sourcerer | Embed;
}>;
