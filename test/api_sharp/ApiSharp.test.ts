import axios from "axios"
import PropTypes from "prop-types"
import { ApiSharp, defaultOptions, ApiSharpOptions, ApiDescriptor, ProcessedApiDescriptor } from "../../src/ApiSharp"
import { WebXhrClient, HttpMethod } from "../../src/http_client"
import { identity } from "../../src/utils"

// 设置为 any 类型，避开 TS 的类型检查，模拟 JS 调用
const apiSharp = new ApiSharp({ enableLog: false, httpClient: new WebXhrClient() })

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

function hijackConsole(method, cb) {
  const originMethod = console[method]
  console[method] = function(...args) {
    originMethod.call(this, ...args)
    cb(args)
  }
}

let logArgs: null | any[] = null
let errorArgs: null | any[] = null
beforeAll(() => {
  hijackConsole("log", args => (logArgs = args))
  hijackConsole("error", args => (errorArgs = args))
})

afterAll(async () => {
  await clearDB()
})

beforeEach(() => {
  logArgs = null
  errorArgs = null
})

describe("测试 new ApiSharp(options) 全局配置", () => {
  test("当 ApiSharp.request() 和 new ApiSharp() 均未指定配置项时，则使用默认配置项", () => {
    const api = { url: "http://anything" }
    const apiSharp: any = new ApiSharp()
    const _api: ProcessedApiDescriptor = apiSharp.processApi(api)
    expect(_api.baseURL).toBe(defaultOptions.baseURL)
    expect(_api.method).toBe(defaultOptions.method)
    expect(_api.headers).toEqual(defaultOptions.headers)
    // expect(_api.transformRequest).toBe(defaultConfig.transformRequest)
    expect(_api.transformResponse).toBe(defaultOptions.transformResponse)
    expect(_api.enableCache).toBe(defaultOptions.enableCache)
    expect(_api.cacheTime).toBe(defaultOptions.cacheTime)
    expect(_api.enableRetry).toBe(defaultOptions.enableRetry)
    expect(_api.retryTimes).toBe(defaultOptions.retryTimes)
    expect(_api.timeout).toBe(defaultOptions.timeout)
    expect(_api.enableLog).toBe(defaultOptions.enableLog)
    expect(_api.formatLog).toBe(defaultOptions.formatLog)
  })

  test("当 ApiSharp.request() 中未指定配置项，但 new ApiSharp() 中指定了时，则使用 new ApiSharp() 中的配置，", () => {
    const api = { url: "http://anything" }
    const options: ApiSharpOptions = {
      baseURL: "x",
      method: "get",
      headers: {
        a: "a"
      },
      transformResponse: v => v,
      enableCache: true,
      cacheTime: 9999,
      enableRetry: true,
      retryTimes: 9999,
      timeout: 999,
      enableLog: true,
      formatLog: identity
    }
    const apiSharp: any = new ApiSharp(options)
    const _api: ProcessedApiDescriptor = apiSharp.processApi(api)
    expect(_api.baseURL).toBe(options.baseURL)
    expect(_api.method).toBe(options.method!.toUpperCase())
    expect(_api.headers).toEqual(options.headers)
    // expect(_api.transformRequest).toBe(options.transformRequest)
    expect(_api.transformResponse).toBe(options.transformResponse)
    expect(_api.enableCache).toBe(options.enableCache)
    expect(_api.cacheTime).toBe(options.cacheTime)
    expect(_api.enableRetry).toBe(options.enableRetry)
    expect(_api.retryTimes).toBe(options.retryTimes)
    expect(_api.timeout).toBe(options.timeout)
    expect(_api.enableLog).toBe(options.enableLog)
    expect(_api.formatLog).toEqual(options.formatLog)
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

  // 参考： https://github.com/facebook/prop-types/blob/master/factoryWithTypeCheckers.js
  describe("测试 api.searchPropTypes", () => {
    test("测试必填参数", () => {
      const api: ApiDescriptor = {
        url: baseURL,
        searchPropTypes: {
          id: PropTypes.number.isRequired
        },
        search: {}
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
      expect(errorArgs![0]).toBe(message)
    })
  })

  describe("测试 api.bodyPropTypes", () => {
    test("测试必填参数", () => {
      const api: ApiDescriptor = {
        url: baseURL,
        method: "post",
        bodyPropTypes: {
          id: PropTypes.number.isRequired
        },
        body: {}
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
      expect(errorArgs).toBeInstanceOf(Array)
      expect(errorArgs![0]).toBe(message)
    })
  })

  describe("测试请求参数转换", () => {
    test("传入数字类型参数，转换成字符串类型后，实际接收的参数是字符串类型", () => {
      const id = 10
      const api: ApiDescriptor = {
        url: baseURL,
        method: "post",
        bodyPropTypes: {
          id: PropTypes.string.isRequired
        },
        body: {
          id
        },
        transformRequest: (body: any) => ({ ...body, id: String(body.id) })
      }
      const _api = apiSharp.processApi(api)
      expect(_api.body).toEqual({ id: String(id) })
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
  describe("测试 HTTP 请求方法", () => {
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
        search: {
          id: response.data.id
        }
      }
      const firstResponse = await apiSharp.request(api)
      const secondResponse = await apiSharp.request({ ...api, search: { id: response.data.id + 1 } })
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
  describe("测试数据mock", () => {
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

  describe("测试失败重试", () => {
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

  describe("测试 HTTP 请求头", () => {
    // test("设置请求头后，实际发出的 HTTP 请求带有该请求头", async () => {
    //   const headerKey = "test-header"
    //   const headerValue = "hello"
    //   const newPost = mockOnePost()
    //   const response = await apiSharp.request({
    //     baseURL,
    //     url: "/posts",
    //     method: "POST",
    //     headers: {
    //       [headerKey]: headerValue
    //     },
    //     params: newPost
    //   })
    //   // 由于浏览器限制，部分 HTTP 头部是不能通过 js 获取的，为了方便测试服务端将HTTP头信息放到body 里面
    //   expect(response.data).toEqual({[headerKey]: headerValue})
    // })
  })

  describe("测试打印日志", () => {
    test("不打印日志，当关闭日志时", async () => {
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
      expect(logArgs).toBeNull()
    })
    test("打印日志，当开启日志时", async () => {
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
      expect(logArgs).toBeInstanceOf(Array)
    })
    test("按自定义格式打印日志，当开启日志并设置了自定义格式化方法时", async () => {
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
      expect(logArgs).toEqual(["hello"])
    })
  })

  describe("测试响应数据转换", () => {
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
  describe("测试接口超时", () => {
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
})
