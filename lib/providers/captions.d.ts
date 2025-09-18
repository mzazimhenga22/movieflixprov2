export declare const captionTypes: {
    srt: string;
    vtt: string;
};
export type CaptionType = keyof typeof captionTypes;
export type Caption = {
    type: CaptionType;
    id: string;
    opensubtitles?: boolean;
    url: string;
    hasCorsRestrictions: boolean;
    language: string;
    flagUrl?: string;
    display?: string;
    media?: string;
    isHearingImpaired?: boolean;
    source?: string;
    encoding?: string;
};
export declare function getCaptionTypeFromUrl(url: string): CaptionType | null;
export declare function labelToLanguageCode(label: string): string | null;
export declare function isValidLanguageCode(code: string | null): boolean;
export declare function removeDuplicatedLanguages(list: Caption[]): Caption[];
