import axios, { AxiosStatic, AxiosResponse, AxiosInstance } from "axios"
import { ApiDescriptor, HTTPMethod, ProcessedApiDescriptor } from "./ApiDescriptor"
import invariant from "tiny-invariant"
import warning from "tiny-warning"
import { isString, isFunction, getSortedString, isUndefined, isNumber, isObject } from "./utils"
import ICache from "./ICache"
import ExpireCache from "./ExpireCache"

export interface ApiSharpOptions {
  axios?: AxiosStatic
  cache?: ICache
  enableLog?: boolean
}

export interface ApiSharpResponse<T> {
  data: T
  api: ProcessedApiDescriptor
  from: "cache" | "network" | "mock"
}

export class ApiSharpRequestError extends Error {
  constructor(message?: string, public api?: ProcessedApiDescriptor) {
    super(message)
  }
}

const defaultEnableMock = false
const defaultMockData = undefined
const defaultMethod = "GET"
const defaultDescription = ""
const defaultEnableCache = false
const defaultCacheTime = 5 * 1000
const defaultEnableRetry = false
const defaultRetryTimes = 1
const defaultEnableLog = process.env.NODE_ENV !== "production"
const defaultLogFormatter = {
  logRequest: (api: ProcessedApiDescriptor) => {
    console.log(
      `%cRequest %c %c${api.method}|${api.description}|${api.url}%c|%O`,
      "color: white; background-color: rgba(0, 116, 217, 0.69); padding: 2px 5px; border-radius: 2px",
      "",
      "color: #0074D9",
      "",
      api.params
    )
  },
  logResponse: (api: ProcessedApiDescriptor, data: any) => {
    console.log(
      `%cResponse%c %c${api.method}|${api.description}|${api.url}%c|%O|%O`,
      "color: white; background-color: rgba(61, 153, 112, 0.69); padding: 2px 5px; border-radius: 2px",
      "",
      "color: #3D9970",
      "",
      api.params,
      data
    )
  },
  logResponseError: (_error: Error, api: ProcessedApiDescriptor, data: any) => {
    console.log(
      `%cResponse%c %c${api.method}|${api.description}|${api.url}%c|%O|%O`,
      "color: white; background-color: rgba(255, 65, 54, 0.69); padding: 2px 5px; border-radius: 2px",
      "",
      "color: #FF4136",
      "",
      api.params,
      data
    )
  },
  logResponseCache: (api: ProcessedApiDescriptor, data: any) => {
    console.log(
      `%cResponse Cache %c %c${api.method}|${api.description}|${api.url}%c|%O|%O`,
      "color: white; background-color: rgba(177, 13, 201, 0.69); padding: 2px 5px; border-radius: 2px",
      "",
      "color: #B10DC9",
      "",
      api.params,
      data
    )
  }
}

export class ApiSharp {
  private axios: AxiosInstance
  private cache: ICache<Promise<AxiosResponse>>
  // private enableLog: boolean

  constructor(options: ApiSharpOptions = {}) {
    // this.enableLog = options.enableLog !== undefined ? !!options.enableLog : true
    this.axios = options.axios || axios.create()
    this.cache = options.cache || new ExpireCache<Promise<AxiosResponse>>()
  }

  /**
   * 发送请求
   */
  async request(_api: ApiDescriptor): Promise<ApiSharpResponse<any>> {
    const api = this.processApi(_api)

    this.logRequest(api)

    if (api.enableMock) {
      return { data: api.mockData, from: "mock", api }
    }

    let requestPromise: Promise<AxiosResponse>
    let cachedKey
    let hitCache = false

    if (api.enableCache) {
      // 开启了缓存
      cachedKey = this.generateCachedKey(api)
      if (this.cache.has(cachedKey)) {
        // 命中缓存
        requestPromise = this.cache.get(cachedKey)!
        hitCache = true
      } else {
        requestPromise = this.sendRequest(api)
        hitCache = false
        this.cache.set(cachedKey, requestPromise, { timeout: api.cacheTime })
      }
    } else {
      requestPromise = this.sendRequest(api)
    }

    let res: AxiosResponse<any>
    try {
      res = await requestPromise
    } catch (err) {
      // 请求失败时删除缓存
      if (api.enableCache) {
        this.cache.delete(cachedKey)
      }
      if (api.enableRetry && api.retryTimes >= 1) {
        return this.request({ ...api, retryTimes: api.retryTimes - 1, __retry: true })
      } else {
        this.logResponseError(err, api)
        throw new ApiSharpRequestError(err.message, api)
      }
    }

    const checkResult = this.checkResponseData(res.data)
    if (!checkResult.success) {
      if (api.enableCache) {
        this.cache.delete(cachedKey)
      }
      if (api.enableRetry && api.retryTimes >= 1) {
        return this.request({ ...api, retryTimes: api.retryTimes - 1, __retry: true })
      } else {
        this.logResponseError(new Error(checkResult.errMsg), api, res.data)
        throw new ApiSharpRequestError(checkResult.errMsg, api)
      }
    }

    if (hitCache) {
      this.logResponseCache(api, res.data)
    } else {
      this.logResponse(api, res.data)
    }

    return { data: res.data, from: hitCache ? "cache" : "network", api }
  }

  /**
   * 清除全部缓存
   */
  public clearCache() {
    return this.cache.clear()
  }

  private sendRequest(api: ApiDescriptor): Promise<AxiosResponse> {
    return this.axios.request({
      baseURL: api.baseURL,
      url: api.url,
      method: api.method,
      params: api.method === "GET" ? api.params : {},
      data: api.method === "POST" ? api.params : {}
    })
  }

  private generateCachedKey(api: ApiDescriptor) {
    return `${api.method} ${api.baseURL}${api.url}?${getSortedString(api.params)}`
  }

  private processApi(api: ApiDescriptor): ProcessedApiDescriptor {
    invariant(api, "api 为空")

    const _api = { ...api } as ProcessedApiDescriptor

    // 移除首部多余分隔符
    if (!api.url || !String(api.url)) {
      invariant(false, `url 为空`)
    } else {
      _api.url = String(api.url)
    }

    // 移除尾部多余分隔符
    _api.baseURL = (api.baseURL || this.axios.defaults.baseURL || "").replace(/\/+$/, "")

    // 请求方法
    if (isUndefined(api.method)) {
      _api.method = defaultMethod
    } else if (isString(api.method) && /get|post/i.test(api.method)) {
      _api.method = api.method.toUpperCase() as HTTPMethod
    } else {
      invariant(false, `method 期望值为 get|post 其一，实际值为"${api.method}"`)
    }

    // 描述
    if (isUndefined(api.description)) {
      _api.description = defaultDescription
    } else if (isFunction(api.description)) {
      _api.description = String(api.description.call(null, api))
    } else {
      _api.description = String(api.description)
    }

    // 开启缓存
    if (isUndefined(api.enableCache)) {
      _api.enableCache = defaultEnableCache
    } else if (isFunction(api.enableCache)) {
      _api.enableCache = !!api.enableCache.call(null, api)
    } else {
      _api.enableCache = !!api.enableCache
    }
    if (_api.method !== "GET" && _api.enableCache) {
      _api.enableCache = false
      warning(false, `只有 GET 请求支持开启缓存，当前请求方法为"${_api.method}"，缓存开启不会生效`)
    }

    // 缓存时间
    if (isUndefined(api.cacheTime)) {
      _api.cacheTime = defaultCacheTime
    } else if (isNumber(api.cacheTime)) {
      _api.cacheTime = api.cacheTime
    } else if (isFunction(api.cacheTime)) {
      _api.cacheTime = api.cacheTime.call(null, api)
    } else {
      _api.cacheTime = defaultCacheTime
      warning(false, `cacheTime 期望 number/function 类型，实际类型为${typeof api.cacheTime}，自动使用默认值`)
    }

    if (isUndefined(api.enableCache)) {
      _api.enableMock = defaultEnableMock
    } else if (isFunction(api.enableMock)) {
      _api.enableMock = !!api.enableMock.call(null, api)
    } else {
      _api.enableMock = !!api.enableMock
    }

    if (isUndefined(api.enableMock)) {
      _api.enableMock = defaultEnableMock
    } else if (isFunction(api.enableMock)) {
      _api.enableMock = !!api.enableMock.call(null, api)
    } else {
      _api.enableMock = !!api.enableMock
    }

    if (isUndefined(api.mockData)) {
      _api.mockData = defaultMockData
    } else if (isFunction(api.mockData)) {
      _api.mockData = api.mockData.call(null, api)
    } else {
      _api.mockData = api.mockData
    }

    if (isUndefined(api.enableRetry)) {
      _api.enableRetry = defaultEnableRetry
    } else if (isFunction(api.enableRetry)) {
      _api.enableRetry = !!api.enableRetry.call(null, api)
    } else {
      _api.enableRetry = !!api.enableRetry
    }

    if (isUndefined(api.retryTimes)) {
      _api.retryTimes = defaultRetryTimes
    } else if (isNumber(api.retryTimes)) {
      _api.retryTimes = api.retryTimes
    } else if (isFunction(api.retryTimes)) {
      _api.retryTimes = api.retryTimes.call(null, api)
    } else {
      _api.retryTimes = defaultRetryTimes
      warning(false, `retryTimes 期望 number/function 类型，实际类型为${typeof api.retryTimes}，自动使用默认值`)
    }

    if (isUndefined(api.enableLog)) {
      _api.enableLog = defaultEnableLog
    } else if (isFunction(api.enableLog)) {
      _api.enableLog = !!api.enableLog.call(null, api)
    } else {
      _api.enableLog = !!api.enableLog
    }

    if (isUndefined(api.logFormatter)) {
      _api.logFormatter = defaultLogFormatter
    } else if (isObject(api.logFormatter)) {
      _api.logFormatter = {
        logRequest: api.logFormatter.logRequest || defaultLogFormatter.logRequest,
        logResponse: api.logFormatter.logResponse || defaultLogFormatter.logResponse,
        logResponseError: api.logFormatter.logResponseError || defaultLogFormatter.logResponseError,
        logResponseCache: api.logFormatter.logResponseCache || defaultLogFormatter.logResponseCache
      }
    } else {
      _api.logFormatter = defaultLogFormatter
    }

    return _api
  }

  protected checkResponseData(data: any): { success: boolean; errMsg?: string } {
    // return {
    //   success: false,
    //   errMsg: ''
    // }
    return {
      success: !!data
    }
  }

  private logRequest(api: ProcessedApiDescriptor) {
    api.enableLog && api.logFormatter.logRequest(api)
  }

  private logResponse(api: ProcessedApiDescriptor, data) {
    api.enableLog && api.logFormatter.logResponse(api, data)
  }

  private logResponseError(error: Error, api: ProcessedApiDescriptor, data?: any) {
    api.enableLog && api.logFormatter.logResponseError(error, api, data)
  }

  private logResponseCache(api: ProcessedApiDescriptor, data) {
    api.enableLog && api.logFormatter.logResponseCache(api, data)
  }
}
