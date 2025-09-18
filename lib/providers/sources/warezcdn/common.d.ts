import { ScrapeContext } from '../../../utils/context';
export declare const warezcdnBase = "https://embed.warezcdn.link";
export declare const warezcdnApiBase = "https://warezcdn.link/embed";
export declare const warezcdnPlayerBase = "https://warezcdn.link/player";
export declare const warezcdnWorkerProxy = "https://workerproxy.warezcdn.workers.dev";
export declare function getExternalPlayerUrl(ctx: ScrapeContext, embedId: string, embedUrl: string): Promise<string>;
