import { StorageType, StorageCache } from "../../../src/cache/StorageCache"

const storageCache = new StorageCache(StorageType.LocalStorage)
const key = "testKey"
const value = "testValue"
const longTimeout = 1 * 60 * 60 * 1000

beforeEach(() => {
  // 清除存储
  storageCache.clear()
})

describe("测试 new StorageCache()", () => {
  test("创建 localStorage cache", () => {
    const storage = new StorageCache(StorageType.LocalStorage)
    expect((storage as any).storage).toBe(window.localStorage)
  })
  test("创建 sessionStorage cache", () => {
    const storage = new StorageCache(StorageType.SessionStorage)
    expect((storage as any).storage).toBe(window.sessionStorage)
  })
  test("创建其他类型的 cache", () => {
    expect(() => {
      new StorageCache("" as StorageType)
    }).toThrow()
  })
})

describe("测试数据存取", () => {
  test("存入后，取出数据与存入相同", () => {
    storageCache.set(key, value, longTimeout)
    const _value = storageCache.get(key)
    expect(value).toEqual(_value)
  })
  test("存入后删除，取出为空", () => {
    storageCache.set(key, value, longTimeout)
    storageCache.delete(key)
    const _value = storageCache.get(key)
    expect(_value).toBeUndefined()
  })
  test("存入后清空，取出为空", () => {
    storageCache.set(key, value, longTimeout)
    storageCache.clear()
    const _value = storageCache.get(key)
    expect(_value).toBeUndefined()
  })
})

describe("测试数据超时存取", () => {
  test("存储后如果超时，取出数据为空", () => {
    storageCache.set(key, value, 0)
    const _value = storageCache.get(key)
    expect(_value).toBeUndefined()
  })
})
