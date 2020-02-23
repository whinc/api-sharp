import { ICache } from "../types"
import { isNumber } from "../utils"

interface StorageCacheItem<T = any> {
  data: T
  timeout: number
  cacheTime: number
}

export enum StorageType {
  LocalStorage = "LocalStorage",
  SessionStorage = "SessionStorage"
}

/**
 * 基于持久化存储的缓存
 */
export class StorageCache<V> implements ICache<V> {
  private readonly storage: Storage

  constructor(type: StorageType) {
    if (type === StorageType.LocalStorage) {
      this.storage = window.localStorage
    } else if (type === StorageType.SessionStorage) {
      this.storage = window.sessionStorage
    } else {
      throw new Error("Invalid storage type:" + type)
    }
  }

  has(key: string): boolean {
    return this.get(key) !== undefined
  }

  get(key: string): V | undefined {
    let strCacheItem = this.storage.getItem(key)
    if (strCacheItem === null) return undefined
    try {
      // 解析 string -> value
      const cacheItem = JSON.parse(strCacheItem) as StorageCacheItem<V>
      // 超时
      if (!cacheItem.data || Date.now() - cacheItem.cacheTime > cacheItem.timeout) {
        return undefined
      }
      return cacheItem.data
    } catch (err) {
      if (__DEV__) {
        console.error(err)
      }
      return undefined
    }
  }
  set(key: string, value: V, timeout: number): V {
    if (!isNumber(timeout) || timeout <= 0) return value

    try {
      const cacheItem: StorageCacheItem = {
        data: value,
        cacheTime: Date.now(),
        timeout
      }
      // 序列化 value -> string
      const strCacheItem = JSON.stringify(cacheItem)
      this.storage.setItem(key, strCacheItem)
    } catch (err) {
      if (__DEV__) {
        console.error(err)
      }
    }
    return value
  }
  delete(key: string): boolean {
    this.storage.removeItem(key)
    return true
  }
  clear(): void {
    this.storage.clear()
  }
}
