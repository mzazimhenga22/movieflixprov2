import { MediaTypes } from '../../entrypoint/utils/media';
import { ProviderList } from '../../providers/get';
export type MetaOutput = {
    type: 'embed' | 'source';
    id: string;
    rank: number;
    name: string;
    mediaTypes?: Array<MediaTypes>;
};
export declare function getAllSourceMetaSorted(list: ProviderList): MetaOutput[];
export declare function getAllEmbedMetaSorted(list: ProviderList): MetaOutput[];
export declare function getSpecificId(list: ProviderList, id: string): MetaOutput | null;
