import ICache from "./ICache"
import {isNumber} from '../utils'

interface MemoryCacheItem<T = any> {
  data: T,
  timeout: number,
  cacheTime: number
}

export default class MemoryCache<V> implements ICache<V> {
  private cacheMap: {[key: string]: MemoryCacheItem<V>} = {}

  // 数据是否超时
  isOverTime(key: string) {
    const data = this.cacheMap[key]

    if (!data || (Date.now() - data.cacheTime) > data.timeout) {
      delete this.cacheMap[key]
      return true
    } else {
      return false
    }
  }

  has(key) {
    return !this.isOverTime(key)
  }

  delete(key: string) {
    return delete this.cacheMap[key]
  }

  get(key) {
    if (this.isOverTime(key)) {
      return undefined
    }
    const value = this.cacheMap[key]
    if (!value) {
      return undefined
    }
    return value.data
  }

  set(key, data, timeout) {
    if (!isNumber(timeout) || timeout <= 0) return data

    this.cacheMap[key] = {
      data,
      timeout,
      cacheTime: Date.now()
    }
    return data
  }

  clear() {
    this.cacheMap = {}
  }
}
