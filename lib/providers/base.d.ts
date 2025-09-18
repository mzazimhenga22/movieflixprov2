import { Flags } from '../entrypoint/utils/targets';
import { Stream } from '../providers/streams';
import { EmbedScrapeContext, MovieScrapeContext, ShowScrapeContext } from '../utils/context';
export type MediaScraperTypes = 'show' | 'movie';
export type SourcererEmbed = {
    embedId: string;
    url: string;
};
export type SourcererOutput = {
    embeds: SourcererEmbed[];
    stream?: Stream[];
};
export type SourcererOptions = {
    id: string;
    name: string;
    rank: number;
    disabled?: boolean;
    externalSource?: boolean;
    flags: Flags[];
    scrapeMovie?: (input: MovieScrapeContext) => Promise<SourcererOutput>;
    scrapeShow?: (input: ShowScrapeContext) => Promise<SourcererOutput>;
};
export type Sourcerer = SourcererOptions & {
    type: 'source';
    disabled: boolean;
    externalSource: boolean;
    mediaTypes: MediaScraperTypes[];
};
export declare function makeSourcerer(state: SourcererOptions): Sourcerer;
export type EmbedOutput = {
    stream: Stream[];
};
export type EmbedOptions = {
    id: string;
    name: string;
    rank: number;
    disabled?: boolean;
    scrape: (input: EmbedScrapeContext) => Promise<EmbedOutput>;
};
export type Embed = EmbedOptions & {
    type: 'embed';
    disabled: boolean;
    mediaTypes: undefined;
};
export declare function makeEmbed(state: EmbedOptions): Embed;
