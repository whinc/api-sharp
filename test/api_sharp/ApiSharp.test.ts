import axios from "axios"
import PropTypes from "prop-types"
import { ApiSharp, defaultOptions, ApiSharpOptions, ApiDescriptor, ProcessedApiDescriptor } from "../../src/ApiSharp"
import { WebXhrClient, WebAxiosClient, HttpMethod } from "../../src/http_client"

// 设置为 any 类型，避开 TS 的类型检查，模拟 JS 调用
const apiSharp = new ApiSharp({ enableLog: false, httpClient: new WebXhrClient() })
const _apiSharp = new ApiSharp({ enableLog: false, httpClient: new WebAxiosClient() })

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
    body: newPost
  })
}

async function requestGetPost(id) {
  const data = await apiSharp.request({
    baseURL,
    url: "/posts",
    method: "GET",
    body: { id }
  })
  data.data = data.data[0]
  return data
}

function mockOnePost() {
  return { title: "post", author: "jack", date: Date.now() }
}

// 包裹console方法，并返回获取最近输出参数的方法，该方法调用后还原console方法
function wrapConsole(method) {
  let _args: null | any[] = null
  const originMethod = console[method]
  console[method] = function(...args) {
    originMethod.call(this, ...args)
    _args = args
  }
  return {
    getArgsAndUnwrap() {
      console[method] = originMethod
      return _args
    }
  }
}

beforeEach(() => {
  // 重置告警缓存（默认输出过一次的告警会被缓存，第二次出现重复告警时不会打印，导致依赖打印的测试失效）
  PropTypes.resetWarningCache()
})

afterAll(async () => {
  await clearDB()
})

describe("测试 new ApiSharp(options) 配置", () => {
  test("配置项未出现在 ApiSharp.request() 和 new ApiSharp() 中时，使用默认配置项", () => {
    const api = { url: "http://anything" }
    const apiSharp: any = new ApiSharp()
    const _api: ProcessedApiDescriptor = apiSharp.processApi(api)
    const ignoreKeys = ["url"]
    Object.keys(_api)
      .filter(key => !ignoreKeys.includes(key))
      .forEach(key => {
        expect(_api[key]).toEqual(defaultOptions[key])
      })
  })

  test("配置项出现在 ApiSharp.request()，但出现在 new ApiSharp() 中时，使用 new ApiSharp() 配置项", () => {
    const api = { url: "http://anything" }
    const options: ApiSharpOptions = defaultOptions
    const apiSharp: any = new ApiSharp(options)
    const _api: ProcessedApiDescriptor = apiSharp.processApi(api)
    const ignoreKeys = ["url"]
    Object.keys(_api)
      .filter(key => !ignoreKeys.includes(key))
      .forEach(key => {
        try {
          expect(_api[key]).toEqual(options[key])
        } catch (err) {
          console.error("出错配置项：" + key)
          throw err
        }
      })
  })
  test("配置项同时出现在 ApiSharp.request() 和 new ApiSharp() 中时，使用 ApiSharp.request() 配置，同时部分配置项进行合并", () => {
    const api: ApiDescriptor = {
      ...defaultOptions,
      url: "http://anything",
      headers: {
        a: "a"
      }
    }
    const options: ApiSharpOptions = {
      headers: {
        b: "b"
      }
    }
    const apiSharp = new ApiSharp(options)
    const _api: ProcessedApiDescriptor = apiSharp.processApi(api)
    const ignoreKeys = ["headers"]
    Object.keys(_api)
      .filter(key => !ignoreKeys.includes(key))
      .forEach(key => {
        try {
          expect(_api[key]).toEqual(api[key])
        } catch (err) {
          console.error("出错配置项：" + key)
          throw err
        }
      })
    // 合并配置项
    expect(_api.headers).toEqual({
      ...defaultOptions.headers,
      ...options.headers,
      ...api.headers
    })
  })
})

describe("测试 ApiSharp.processApi() 方法", () => {
  describe("测试 api 的取值", () => {
    test("api === null 时抛出异常", () => {
      const api = null
      expect(() => apiSharp.processApi(api!)).toThrow()
    })
    test("api 为 string 时，等价于 {url: string}", () => {
      const api = "http://xyz.com"
      const _api = apiSharp.processApi(api)
      expect(_api).toHaveProperty("url", api)
    })
  })

  describe("测试 api.url 取值", () => {
    test("api.url 为空(空串/undefined/null)时抛出异常", () => {
      const api = {}
      expect(() => apiSharp.processApi({ ...api, url: undefined! })).toThrow()
      expect(() => apiSharp.processApi({ ...api, url: null! })).toThrow()
      expect(() => apiSharp.processApi({ ...api, url: "" })).toThrow()
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
    const values = [[undefined, ""], ["", ""], ["hello", "hello"]]
    values.forEach(([received, expected]) => {
      api.description = received
      expect(apiSharp.processApi(api).description).toBe(expected)
    })
  })

  describe("测试 api.enableMock 取值", () => {
    const api: ApiDescriptor = { url: baseURL }
    test("api.enableMock  默认为 false", () => {
      expect(apiSharp.processApi(api).enableMock).toBeFalsy()
    })
    test("api.enableMock 为 true，当设置为 true 后", () => {
      expect(apiSharp.processApi({ ...api, enableMock: true }).enableMock).toBeTruthy()
    })
  })

  describe("测试 api.mockData 取值", () => {
    const api: ApiDescriptor = { url: baseURL }
    const data = { a: 1 }
    test("api.mockData 默认为 undefined", () => {
      expect(apiSharp.processApi(api).mockData).toBeUndefined()
    })
    test(`api.mockData 为 ${JSON.stringify(data)}，当设置为 ${JSON.stringify(data)} 后`, () => {
      expect(apiSharp.processApi({ ...api, mockData: data }).mockData).toEqual(data)
    })
  })

  describe("测试 api.enableRetry 取值", () => {
    const api: ApiDescriptor = { url: baseURL }
    test("api.enableRetry 默认为 false", () => {
      expect(apiSharp.processApi(api).enableRetry).toBeFalsy()
    })
    test("api.enableRetry 为 true，当设置为 true 后", () => {
      expect(apiSharp.processApi({ ...api, enableRetry: true }).enableRetry).toBeTruthy()
    })
  })

  describe("测试 api.retryTimes 取值", () => {
    const api: ApiDescriptor = { url: baseURL }
    test("api.retryTimes 默认为 1", () => {
      expect(apiSharp.processApi(api).retryTimes).toBe(1)
    })
  })

  describe("测试 api.search", () => {
    const api: ApiDescriptor = { url: baseURL }
    test("api.search 默认为 null", () => {
      expect(apiSharp.processApi(api).query).toBeNull()
    })
  })

  describe("测试 api.body", () => {
    const api: ApiDescriptor = { url: baseURL }
    test("api.body 默认为 null", () => {
      expect(apiSharp.processApi(api).body).toBeNull()
    })
  })

  // 参考： https://github.com/facebook/prop-types/blob/master/factoryWithTypeCheckers.js
  describe("测试 api.searchPropTypes", () => {
    test("测试必填参数", () => {
      const { getArgsAndUnwrap } = wrapConsole("error")
      const api: ApiDescriptor = {
        url: baseURL,
        queryPropTypes: {
          id: PropTypes.number.isRequired
        },
        query: {}
      }
      const _api = apiSharp.processApi(api)
      const location = ""
      const propFullName = "id"
      const componentName = _api.baseURL + _api.url
      const message =
        "Warning: Failed  type: " +
        "The " +
        location +
        " `" +
        propFullName +
        "` is marked as required in " +
        ("`" + componentName + "`, but its value is `undefined`.")
      expect(getArgsAndUnwrap()).toEqual([message])
    })
  })

  describe("测试 api.bodyPropTypes", () => {
    test("测试必填参数", () => {
      const { getArgsAndUnwrap } = wrapConsole("error")
      const api: ApiDescriptor = {
        url: baseURL,
        method: "post",
        bodyPropTypes: {
          name: PropTypes.number.isRequired
        },
        body: {}
      }
      const _api = apiSharp.processApi(api)
      const location = ""
      const propFullName = "name"
      const componentName = _api.baseURL + _api.url
      const message =
        "Warning: Failed  type: " +
        "The " +
        location +
        " `" +
        propFullName +
        "` is marked as required in " +
        ("`" + componentName + "`, but its value is `undefined`.")
      expect(getArgsAndUnwrap()).toEqual([message])
    })
  })

  describe("测试 api.transformRequest", () => {
    test("转换请求数据", () => {
      const api: ApiDescriptor = {
        url: baseURL,
        method: "post",
        bodyPropTypes: {
          id: PropTypes.string.isRequired
        },
        body: {
          id: 10
        },
        transformRequest: (body: any) => ({ ...body, name: "jack" })
      }
      const _api = apiSharp.processApi(api)
      expect(_api.body).toEqual({ id: 10, name: "jack" })
    })
    test("在转换请求数据前，进行类型检查", () => {
      const api: ApiDescriptor = {
        url: baseURL,
        method: "post",
        bodyPropTypes: {
          name: PropTypes.string.isRequired
        },
        body: {
          id: 10
        },
        transformRequest: (body: any) => ({ ...body, name: "jack" })
      }
      const {getArgsAndUnwrap} = wrapConsole("error")
      const _api = apiSharp.processApi(api)
      expect(getArgsAndUnwrap()).not.toBeNull()
      expect(_api.body).toEqual({ id: 10, name: "jack" })
    })
  })

  describe("测试 api.responseType", () => {
    test("默认值是 json", () => {
      const api: ApiDescriptor = { url: baseURL }
      const _api = apiSharp.processApi(api)
      expect(_api.responseType).toBe("json")
    })
    test("指定值是 json", () => {
      const api: ApiDescriptor = { url: baseURL, responseType: "json" }
      const _api = apiSharp.processApi(api)
      expect(_api.responseType).toBe("json")
    })
    test("指定值是 text", () => {
      const api: ApiDescriptor = { url: baseURL, responseType: "text" }
      const _api = apiSharp.processApi(api)
      expect(_api.responseType).toBe("text")
    })
  })
})

describe("测试 ApiSharp.request()", () => {
  beforeEach(async () => {
    // 清除数据
    await clearDB()
    // 清除缓存
    apiSharp.clearCache()
  })
  describe("测试 method", () => {
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
  describe("测试 cacheTime", () => {
    test("POST 请求不会被缓存，当开启或开闭缓存时", async () => {
      const api = {
        baseURL,
        url: "/posts/",
        method: "POST" as HttpMethod,
        enableCache: true,
        params: mockOnePost()
      }
      const firstResponse = await apiSharp.request(api)
      expect(firstResponse.from).toBe("network")
      const secondResponse = await apiSharp.request({ ...api, enableCache: false })
      expect(secondResponse.from).toBe("network")
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
      const secondResponse = await apiSharp.request({ ...api, url: "/posts/?a=1" })
      expect(firstResponse.from).toBe("network")
      expect(secondResponse.from).toBe("network")
    })
    test("GET 请求不会被缓存，当开启缓存且请求的参数不同时", async () => {
      const newPost = mockOnePost()
      const response = await requestPostPost(newPost)
      const api: ApiDescriptor = {
        baseURL,
        url: "/posts/",
        enableCache: true,
        query: {
          id: response.data.id
        }
      }
      const firstResponse = await apiSharp.request(api)
      const secondResponse = await apiSharp.request({ ...api, query: { id: response.data.id + 1 } })
      expect(firstResponse.from).toBe("network")
      expect(secondResponse.from).toBe("network")
    })
    test("GET 请求命中缓存，当开启缓存并且在缓存期内", async () => {
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
      const firstResponse = await apiSharp.request({ ...api, cacheTime: Infinity })
      expect(firstResponse.from).toBe("network")
      const secondResponse = await apiSharp.request(api)
      expect(secondResponse.from).toBe("cache")
    })
    test("GET 请求不命中缓存，当开启缓存并且超出缓存期", async () => {
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
      const firstResponse = await apiSharp.request({ ...api, cacheTime: 0 })
      expect(firstResponse.from).toBe("network")
      const secondResponse = await apiSharp.request(api)
      expect(secondResponse.from).toBe("network")
    })
  })
  describe("测试 mockData", () => {
    test("返回mock数据，当开启mock", async () => {
      const data = "hello"
      const api = {
        baseURL,
        url: "/posts/",
        enableCache: true,
        params: {
          id: 1
        },
        enableMock: true,
        mockData: data
      }
      const response = await apiSharp.request(api)
      expect(response.from).toBe("mock")
      expect(response.data).toEqual(data)
    })
    test("返回网络数据，当关闭mock", async () => {
      const data = "hello"
      const api = {
        baseURL,
        url: "/posts/",
        enableCache: true,
        params: {
          id: 1
        },
        enableMock: false,
        mockData: data
      }
      const response = await apiSharp.request(api)
      expect(response.from).toBe("network")
    })
  })

  describe("测试 retryTimes", () => {
    // test("请求失败不会重试，当关闭重试时", async () => {
    //   // 构造一个不存在的地址，触发请求失败
    //   const api = {
    //     baseURL,
    //     url: "/posts-any/",
    //     enableRetry: false
    //   }
    //   try {
    //     await apiSharp.request(api)
    //   } catch (err) {
    //     expect(err.api.__retry).toBeFalsy()
    //   }
    // })
    // test("请求失败会重试，当开启重试时", async () => {
    //   // 构造一个不存在的地址，触发请求失败
    //   const api = {
    //     baseURL,
    //     url: "/posts-any/",
    //     enableRetry: true
    //   }
    //   try {
    //     await apiSharp.request(api)
    //   } catch (err) {
    //     expect(err.api.__retry).toBeTruthy()
    //   }
    // })
  })

  describe("测试 formatLog", () => {
    test("不打印日志，当关闭日志时", async () => {
      const { getArgsAndUnwrap } = wrapConsole("log")
      try {
        const api = {
          baseURL,
          url: "/posts/",
          params: {
            id: 1
          },
          // 关闭日志
          enableLog: false
        }
        await apiSharp.request(api)
      } catch (err) {}
      expect(getArgsAndUnwrap()).toBeNull()
    })
    test("打印日志，当开启日志时", async () => {
      const { getArgsAndUnwrap } = wrapConsole("log")
      try {
        const api = {
          baseURL,
          url: "/posts/",
          params: {
            id: 1
          },
          // 开启日志
          enableLog: true
        }
        await apiSharp.request(api)
      } catch (err) {}
      expect(getArgsAndUnwrap()).toBeInstanceOf(Array)
    })
    test("按自定义格式打印日志，当开启日志并设置了自定义格式化方法时", async () => {
      const { getArgsAndUnwrap } = wrapConsole("log")
      try {
        const api = {
          baseURL,
          url: "/posts/",
          params: {
            id: 1
          },
          // 开启日志
          enableLog: true,
          formatLog: (_type, _api, _data) => console.log("hello")
        }
        await apiSharp.request(api)
      } catch (err) {}
      expect(getArgsAndUnwrap()).toEqual(["hello"])
    })
  })

  describe("测试 transformResponse", () => {
    test("返回数据是对象，转换后数字后，实际调用返回的应该是这个数字", async () => {
      const newPost = mockOnePost()
      const response = await apiSharp.request({
        baseURL,
        url: "/posts",
        method: "POST",
        body: newPost,
        transformResponse: returns => ({ ...returns, extra: 100 })
      })
      expect(response.data.extra).toEqual(100)
    })
  })
  describe("测试 timeout", () => {
    test("接口请求未超时，不抛出异常", async () => {
      const newPost = mockOnePost()
      expect.assertions(0)
      try {
        await apiSharp.request({
          baseURL,
          url: "/posts",
          method: "POST",
          body: newPost,
          timeout: 100 * 1000
        })
      } catch (err) {
        expect(err).toBeInstanceOf(Error)
      }
    })
    test("timeout 为 0 时，接口请求不会超时，不抛出异常", async () => {
      const newPost = mockOnePost()
      expect.assertions(0)
      try {
        await apiSharp.request({
          baseURL,
          url: "/posts",
          method: "POST",
          body: newPost,
          timeout: 0
        })
      } catch (err) {
        expect(err).toBeInstanceOf(Error)
      }
    })
    test("接口请求超时，抛出异常", async () => {
      const newPost = mockOnePost()
      expect.assertions(1)
      try {
        await apiSharp.request({
          baseURL,
          url: "/posts",
          method: "POST",
          body: newPost,
          timeout: 1
        })
      } catch (err) {
        expect(err.message).toMatch("请求超时")
      }
    })
  })

  describe("测试 responseType", () => {
    test("请求 json 数据且指定 responseType 为 json 时返回JS对象", async () => {
      const res = await apiSharp.request({
        baseURL,
        url: "/date/json",
        responseType: "json"
      })
      expect(res.data).toHaveProperty("server_date")
    })
    test("请求 json 数据且指定 responseType 为 text 时返回字符串", async () => {
      const res = await apiSharp.request({
        baseURL,
        url: "/date/json",
        responseType: "text"
      })
      expect(res.data).toMatch("server_date")
    })
    test("请求 text 数据且指定 responseType 为 text 时返回字符串", async () => {
      const res = await apiSharp.request({
        baseURL,
        url: "/date/text",
        responseType: "text"
      })
      expect(res.data).toMatch("server_date")
    })
    test("请求 text 数据且指定 responseType 为 json 时返回null", async () => {
      const res = await apiSharp.request({
        baseURL,
        url: "/date/text",
        responseType: "json"
      })
      expect(res.data).toBeNull()
    })
  })
  describe("测试 headers", () => {
    test("测试默认请求头", async () => {
      const res = await apiSharp.request({
        baseURL,
        url: "/echo/headers"
      })
      expect(res.data["content-type"]).toBe(defaultOptions.headers["Content-Type"])
    })
    test("测试指定请求头", async () => {
      const res = await apiSharp.request({
        baseURL,
        url: "/echo/headers",
        headers: {
          "Content-Type": "text/plain"
        }
      })
      expect(res.data["content-type"]).toBe("text/plain")
    })
  })
  describe("测试 search", () => {
    test("查询参数正确传到服务端", async () => {
      const res = await apiSharp.request({
        baseURL,
        url: "/echo/query",
        query: {
          a: 1,
          b: 2
        }
      })
      expect(res.data).toEqual({
        a: "1",
        b: "2"
      })
    })
  })
  describe("测试 body", () => {
    test("请求数据正确传到服务端", async () => {
      const res = await apiSharp.request({
        baseURL,
        url: "/echo/body",
        method: "post",
        body: {
          a: 1,
          b: 2
        }
      })
      expect(res.data).toEqual({
        a: 1,
        b: 2
      })
    })
  })
})
