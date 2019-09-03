import axios from "axios"
import { ApiSharp } from "../src/ApiSharp"
import { ApiDescriptor } from "../src/ApiDescriptor"

// 设置为 any 类型，避开 TS 的类型检查，模拟 JS 调用
const apiSharp: any = new ApiSharp({ axios, enableLog: false })

const baseURL = "http://localhost:4000"

async function clearDB() {
  const response = await axios.request({
    method: "GET",
    url: `${baseURL}/posts`
  })
  const postList = response.data
  for (let i = 0; i < postList.length; ++i) {
    const post = postList[i]
    await axios.request({
      method: "DELETE",
      url: `${baseURL}/posts/${post.id}`
    })
  }
}

async function requestPostPost(newPost) {
  return apiSharp.request({
    baseURL,
    url: "/posts",
    method: "POST",
    params: newPost
  })
}

async function requestGetPost(id) {
  const data = await apiSharp.request({
    baseURL,
    url: "/posts",
    method: "GET",
    params: { id }
  })
  data.data = data.data[0]
  return data
}

function mockOnePost() {
  return { title: "post", author: "jack", date: Date.now() }
}

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
  beforeEach(async () => {
    await clearDB()
  })
  describe("测试请求", () => {
    test("POST 请求正常", async () => {
      const newPost = mockOnePost()
      const response = await requestPostPost(newPost)
      expect(response.data.date).toBe(newPost.date)
    })

    test("GET 请求正常", async () => {
      const newPost = mockOnePost()
      const response1 = await requestPostPost(newPost)
      const response2 = await requestGetPost(response1.data.id)
      expect(response1.data).toEqual(response2.data)
    })
  })
  describe("测试缓存", () => {
    beforeEach(() => {
      apiSharp.clearCache()
    })
    test("POST 请求不会被缓存，当开启或开闭缓存时", async () => {
      const api = {
        baseURL,
        url: "/posts/",
        method: "POST",
        enableCache: true,
        params: mockOnePost()
      }
      const firstResponse = await apiSharp.request(api)
      expect(firstResponse.from).toBe('network')
      const secondResponse = await apiSharp.request({...api, enableCache: false})
      expect(secondResponse.from).toBe('network')
    })
    test("GET 请求不会被缓存，当关闭缓存时", async () => {
      const newPost = mockOnePost()
      const response = await requestPostPost(newPost)
      const api = {
        baseURL,
        url: "/posts/",
        enableCache: false,
        params: {
          id: response.data.id
        }
      }
      const firstResponse = await apiSharp.request(api)
      const secondResponse = await apiSharp.request(api)
      expect(firstResponse.from).toBe("network")
      expect(secondResponse.from).toBe("network")
    })
    test("GET 请求会被缓存，当开启缓存且请求的地址和参数相同时", async () => {
      const newPost = mockOnePost()
      const response = await requestPostPost(newPost)
      const api = {
        baseURL,
        url: "/posts/",
        enableCache: true,
        params: {
          id: response.data.id
        }
      }
      const firstResponse = await apiSharp.request(api)
      const secondResponse = await apiSharp.request(api)
      expect(firstResponse.from).toBe("network")
      expect(secondResponse.from).toBe("cache")
    })
    test("GET 请求不会被缓存，当开启缓存且请求的地址不同时", async () => {
      const newPost = mockOnePost()
      const response = await requestPostPost(newPost)
      const api = {
        baseURL,
        url: "/posts/",
        enableCache: true,
        params: {
          id: response.data.id
        }
      }
      const firstResponse = await apiSharp.request(api)
      const secondResponse = await apiSharp.request({...api, url: "/posts/?a=1"})
      expect(firstResponse.from).toBe("network")
      expect(secondResponse.from).toBe("network")
    })
    test("GET 请求不会被缓存，当开启缓存且请求的参数不同时", async () => {
      const newPost = mockOnePost()
      const response = await requestPostPost(newPost)
      const api = {
        baseURL,
        url: "/posts/",
        enableCache: true,
        params: {
          id: response.data.id
        }
      }
      const firstResponse = await apiSharp.request(api)
      const secondResponse = await apiSharp.request({...api, params: {id: response.data.id + 1}})
      expect(firstResponse.from).toBe("network")
      expect(secondResponse.from).toBe("network")
    })
  })
})
