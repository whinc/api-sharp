import {MemoryCache} from '../../src/cache'

const memoryCache = new MemoryCache()
const key = "testKey"
const value = "testValue"
const longTimeout = 1 * 60 * 60 * 1000

beforeEach(() => {
  // 清除存储
  memoryCache.clear()
})

describe("测试 new MemoryCache()", () => {
  test("创建 localStorage cache", () => {
    const cache = new MemoryCache()
    expect((cache as any).cacheMap).toEqual({})
  })
})


describe("测试数据存取", () => {
  test("存入后，取出数据与存入相同", ()=> {
    memoryCache.set(key, value, longTimeout)
    const _value = memoryCache.get(key)
    expect(value).toEqual(_value)
  })
  test("存入后删除，取出为空", ()=> {
    memoryCache.set(key, value, longTimeout)
    memoryCache.delete(key)
    const _value = memoryCache.get(key)
    expect(_value).toBeUndefined()
  })
  test("存入后清空，取出为空", ()=> {
    memoryCache.set(key, value, longTimeout)
    memoryCache.clear()
    const _value = memoryCache.get(key)
    expect(_value).toBeUndefined()
  })
})

describe("测试数据超时存取", () => {
  test("存储后如果未超时，取出数据与存入相同", ()=> {
    memoryCache.set(key, value, 10)
    const _value = memoryCache.get(key)
    expect(_value).toBe(value)
  })
  test("存储后如果超时，取出数据为空", ()=> {
    memoryCache.set(key, value, 0)
    const _value = memoryCache.get(key)
    expect(_value).toBeUndefined()
  })
})