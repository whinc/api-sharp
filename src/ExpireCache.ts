import ICache from './ICache';

class ExpireCacheItem<V> {
  public data: V;
  public timeout: number;
  public cacheTime: number;

  constructor(data: V, timeout: number) {
    this.data = data;
    this.timeout = timeout;
    // 创建对象时候的时间，大约设定为数据获得的时间
    this.cacheTime = Date.now();
  }
}

export default class ExpireCache<V> implements ICache<V> {
  private readonly cacheMap = new Map<string, ExpireCacheItem<V>>();
  private readonly defaultCacheTime;

  constructor(defaultCacheTime = 5 * 60 * 1000) {
    this.defaultCacheTime = defaultCacheTime;
  }

  // 数据是否超时
  isOverTime(key: string) {
    const data = this.cacheMap.get(key);

    if (!data) return true;

    const overTime = Date.now() - data.cacheTime;
    if (overTime > 0 && overTime > data.timeout) {
      this.cacheMap.delete(key);
      return true;
    }

    return false;
  }

  has(key) {
    return !this.isOverTime(key);
  }

  delete(key: string) {
    return this.cacheMap.delete(key);
  }

  get(key) {
    if (this.isOverTime(key)) {
      return undefined;
    }
    const value = this.cacheMap.get(key);
    if (!value) {
      return undefined;
    }
    return value.data;
  }

  set(key, data, timeout = this.defaultCacheTime) {
    const itemCache = new ExpireCacheItem(data, timeout);
    this.cacheMap.set(key, itemCache);
    return data;
  }
}
