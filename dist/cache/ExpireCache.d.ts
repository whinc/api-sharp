import ICache from "./ICache";
export default class ExpireCache<V> implements ICache<V> {
    private readonly cacheMap;
    private readonly defaultCacheTime;
    constructor(defaultCacheTime?: number);
    isOverTime(key: string): boolean;
    has(key: any): boolean;
    delete(key: string): boolean;
    get(key: any): V | undefined;
    set(key: any, data: any, { timeout }?: {
        timeout?: any;
    }): any;
    clear(): void;
}
