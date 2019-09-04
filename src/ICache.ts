export default interface ICache<V = any, K = string> {
  has(key: K): boolean
  get(key: K): V | undefined
  set(key: K, value: V, extra?: any): V
  delete(key: K): boolean
  clear(): void
}
