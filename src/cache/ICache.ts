/**
 * 支持设置超时的缓存接口
 */
export default interface ICache<V = any, K = string> {
  has(key: K): boolean
  get(key: K): V | undefined
  set(key: K, value: V, timeout: number): V
  delete(key: K): boolean
  clear(): void
}
