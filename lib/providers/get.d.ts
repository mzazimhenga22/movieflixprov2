import { FeatureMap } from '../entrypoint/utils/targets';
import { Embed, Sourcerer } from '../providers/base';
export interface ProviderList {
    sources: Sourcerer[];
    embeds: Embed[];
}
export declare function getProviders(features: FeatureMap, list: ProviderList): ProviderList;
