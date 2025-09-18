export type UpdateEventStatus = 'success' | 'failure' | 'notfound' | 'pending';
export type UpdateEvent = {
    id: string;
    percentage: number;
    status: UpdateEventStatus;
    error?: unknown;
    reason?: string;
};
export type InitEvent = {
    sourceIds: string[];
};
export type DiscoverEmbedsEvent = {
    sourceId: string;
    embeds: Array<{
        id: string;
        embedScraperId: string;
    }>;
};
export type SingleScraperEvents = {
    update?: (evt: UpdateEvent) => void;
};
export type FullScraperEvents = {
    update?: (evt: UpdateEvent) => void;
    init?: (evt: InitEvent) => void;
    discoverEmbeds?: (evt: DiscoverEmbedsEvent) => void;
    start?: (id: string) => void;
};
export type IndividualScraperEvents = {
    update?: (evt: UpdateEvent) => void;
};
