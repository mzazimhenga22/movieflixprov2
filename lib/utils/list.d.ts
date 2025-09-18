export declare function reorderOnIdList<T extends {
    rank: number;
    id: string;
}[]>(order: string[], list: T): T;
