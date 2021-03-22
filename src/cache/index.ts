import { MemoryCache } from "./MemoryCache"
import { StorageCache, StorageType } from "./StorageCache"
import { IResponse } from "../types"

/** 基于内存的缓存 */
export const memoryCache = new MemoryCache<IResponse>()
/** 基于 localStorage 的缓存 */
export const localStorageCache = new StorageCache(StorageType.LocalStorage)
/** 基于 sessionStorage 的缓存 */
export const sessionStorageCache = new StorageCache(StorageType.SessionStorage)
