import { FileBasedStream } from '../../../providers/streams';
declare function generateRandomFavs(): string;
declare function parseSubtitleLinks(inputString?: string | boolean): FileBasedStream['captions'];
declare function parseVideoLinks(inputString?: string): FileBasedStream['qualities'];
declare function extractTitleAndYear(input: string): {
    title: string;
    year: number | null;
} | null;
export { extractTitleAndYear, parseSubtitleLinks, parseVideoLinks, generateRandomFavs };
