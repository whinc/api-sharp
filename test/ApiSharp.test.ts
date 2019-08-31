import axios from "axios"
import { ApiSharp } from "../src/ApiSharp"
import { ApiDescriptor } from "../src/ApiDescriptor"

const apiSharp: any = new ApiSharp({ axios, enableLog: false })
const mockPost = () => ({ title: "post", author: "jack", date: Date.now() })
const addPost = post =>
  apiSharp.request({
    url: "http://localhost:4000/posts/",
    method: "post",
    params: post
  })
const deletePost = id =>
  apiSharp.request({
    url: "http://localhost:4000/posts/" + id,
    method: "delete"
  })
// const listPost = () => apiSharp.request({
//   url: 'http://localhost:4000/posts/'
// })
const getPosts = id =>
  apiSharp.request({
    url: "http://localhost:4000/posts/",
    params: {
      id
    }
  })

let serverData
beforeAll(async () => {
  serverData = await apiSharp.request({ url: "http://localhost:4000/db" })
})

describe("测试 ApiSharp.processApi() 方法", () => {
  describe("测试 api 的取值", () => {
    test("api === null 时抛出异常", () => {
      const api = null
      expect(() => apiSharp.processApi(api!)).toThrow()
    })
  })

  describe("测试 api.url 取值", () => {
    test('typeof api.url !== "string" 时抛出异常', () => {
      const api: any = { url: 100 }
      expect(() => apiSharp.processApi(api)).toThrow()
    })
    test('api.url === "" 时抛出异常', () => {
      const api = { url: "" }
      expect(() => apiSharp.processApi(api)).toThrow()
    })
  })

  describe("测试 api.method 取值", () => {
    const api: any = { url: "http://www.test.com" }
    test('api.method === undefined 时使用 "GET" 方法', () => {
      expect(apiSharp.processApi({ ...api }).method).toBe("GET")
    })
    test('api.method === "GET" 时使用 "GET" 方法', () => {
      expect(apiSharp.processApi({ ...api, method: "GET" }).method).toBe("GET")
    })
    test('api.method === "get" 时使用 "GET" 方法', () => {
      expect(apiSharp.processApi({ ...api, method: "get" }).method).toBe("GET")
    })
    test('api.method === "POST" 时使用 "POST" 方法', () => {
      expect(apiSharp.processApi({ ...api, method: "POST" }).method).toBe("POST")
    })
    test('api.method === "post" 时使用 "POST" 方法', () => {
      expect(apiSharp.processApi({ ...api, method: "post" }).method).toBe("POST")
    })
  })

  test("测试 api.description 取值", () => {
    const api: ApiDescriptor = { url: "http://www.test.com" }
    const values = [
      [undefined, ""],
      ["", ""],
      ["hello", "hello"],
      [() => "hello", "hello"],
      [_api => _api.url, api.url]
    ]
    values.forEach(([received, expected]) => {
      api.description = received
      expect(apiSharp.processApi(api).description).toBe(expected)
    })
  })
})

describe("测试 ApiSharp.request()", () => {
  describe.skip("测试请求", () => {
    test("GET 请求", async () => {
      const id = 2
      const data = await getPosts(id)
      const responseData = serverData.posts.find(post => post.id === id)
      expect(data[0]).toEqual(responseData)
    })
    test("POST 请求", async () => {
      const now = Date.now()
      const data = await addPost({ title: "post", author: "jack", date: now })
      expect(data.date).toBe(now)
      await deletePost(data.id)
    })
  })
  describe("测试缓存", () => {
    test("GET 请求会被缓存", async () => {
      const api = {
        url: "http://localhost:4000/posts/",
        enableCache: true,
        params: {
          id: 1
        }
      }
      const responseData = await apiSharp.request(api)

      const _api = apiSharp.processApi(api)
      const cachedKey = apiSharp.generateCachedKey(_api)
      const cachedPromise = apiSharp.cache.get(cachedKey)
      expect(cachedPromise).toBeInstanceOf(Promise)
      const cachedData = (await cachedPromise).data
      expect(responseData).toEqual(cachedData)
    })
    test("POST 请求不会被缓存", async () => {
      const api = {
        url: "http://localhost:4000/posts/",
        method: "POST",
        enableCache: true,
        params: mockPost()
      }
      await apiSharp.request(api)
      const _api = apiSharp.processApi(api)
      const cachedKey = apiSharp.generateCachedKey(_api)
      const cachedPromise = apiSharp.cache.get(cachedKey)
      expect(cachedPromise).toBeUndefined()
    })
    test("相同请求参数的 GET 请求会被缓存", async () => {
      const id = 2
      const apiDescriptor = {
        url: "http://localhost:4000/posts/",
        enableCache: true,
        params: {
          id
        }
      }
      const [responseData] = await apiSharp.request(apiDescriptor)
      const [cachedData] = await apiSharp.request(apiDescriptor)
      const dbData = serverData.posts.find(post => post.id === id)
      expect(responseData).toEqual(dbData)
      expect(responseData).toEqual(cachedData)
    })
  })
})
