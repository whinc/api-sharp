import { isString, getSortedString, identity, invariant, warning, formatFullUrl } from "../utils"
import {
  ApiResponse,
  ProcessedApiDescriptor,
  LogType,
  ApiDescriptor,
  HttpMethod,
  IResponse,
  IRequest
} from "../types"
import { ICache, MemoryCache } from "../cache"
import { WebXhrClient, IHttpClient } from "../http_client"

const removeUndefinedValue = target => {
  return Object.keys(target)
    .filter(key => target[key] !== undefined)
    .reduce((obj, key) => Object.assign(obj, { [key]: target[key] }), {})
}

const httpMethodRegExp = /GET|POST|DELETE|HEAD|OPTIONS|PUT|PATCH/i

/**
 * 全局配置项
 */
export interface ApiSharpOptions<QueryType = Record<string, any>, BodyType = Record<string, any>>
  extends Partial<ApiDescriptor<QueryType, BodyType>> {
  httpClient?: IHttpClient
  cache?: ICache<IResponse>
}

const configMap = {
  [LogType.Request]: { text: "Request", bgColor: "rgba(0, 116, 217, 0.69)", fgColor: "#0074D9" },
  [LogType.Response]: { text: "Response", bgColor: "rgba(61, 153, 112, 0.69)", fgColor: "#3D9970" },
  [LogType.ResponseError]: {
    text: "Response Error",
    bgColor: "rgba(255, 65, 54, 0.69)",
    fgColor: "#FF4136"
  },
  [LogType.ResponseCache]: {
    text: "Response Cache",
    bgColor: "rgba(177, 13, 201, 0.69)",
    fgColor: "#B10DC9"
  }
}

export const defaultOptions: Required<ApiSharpOptions> = {
  httpClient: new WebXhrClient(),
  cache: new MemoryCache<IResponse>(),
  withCredentials: false,
  baseURL: "",
  headers: {
    "Content-Type": "application/json"
  },
  url: "",
  description: "",
  query: null,
  body: null,
  enableMock: false,
  mockData: undefined,
  method: "GET",
  responseType: "json",
  enableCache: false,
  cacheTime: 5 * 60 * 1000,
  transformRequest: identity,
  transformResponse: identity,
  validateResponse: res => {
    return { valid: res.status >= 200 && res.status < 300, message: res.statusText }
  },
  enableRetry: false,
  retryTimes: 1,
  timeout: 0,
  enableLog: process.env.NODE_ENV !== "production",
  formatLog: (type, api, data) => {
    const config = configMap[type]
    console.log(
      `%c${config.text} %c %c${api.method}|${api.description}|${api.url}%c|%O|%O`,
      `color: white; background-color: ${config.bgColor}; padding: 2px 5px; border-radius: 2px`,
      "",
      `color: ${config.fgColor}`,
      "",
      api.body,
      data
    )
  }
}

export class ApiSharp {
  private readonly options: ApiSharpOptions
  private readonly httpClient: IHttpClient
  private readonly cache: ICache<IResponse>

  constructor(options: ApiSharpOptions = {}) {
    this.options = options
    this.httpClient = options.httpClient || defaultOptions.httpClient
    this.cache = options.cache || defaultOptions.cache
  }

  /**
   * 发送 HTTP 请求
   * @param api - 接口描述符
   * @return 响应数据
   */
  async request<T = any>(_api: ApiDescriptor | string): Promise<ApiResponse<T>> {
    const api = this.processApi(_api)
    const requestConfig: IRequest = this.castRequest(api)

    // 转换请求
    Object.assign(api, api.transformRequest(requestConfig))

    this.logRequest(api)

    // 处理 mock 数据
    if (api.enableMock) {
      // TODO: 使用 setTimeout 模拟异步返回
      return {
        data: api.mockData,
        from: "mock",
        api,
        headers: {},
        status: 200,
        statusText: "OK(mock)"
      }
    }

    let requestPromise: Promise<IResponse<T>>
    let cachedKey
    let hitCache = false

    // 处理缓存
    if (api.enableCache) {
      cachedKey = this.generateCachedKey(api)
      if (this.cache.has(cachedKey)) {
        const cachedRes = this.cache.get(cachedKey)!
        requestPromise = Promise.resolve(cachedRes)
        hitCache = true
      } else {
        requestPromise = this.httpClient.request<T>(requestConfig)
      }
    } else {
      requestPromise = this.httpClient.request<T>(requestConfig)
    }

    let response: IResponse<T>

    // 获取请求结果
    try {
      response = await requestPromise
    } catch (err) {
      // 处理请求异常情况

      // 请求失败或超时，都会抛出异常并被捕获处理

      // 请求失败时删除缓存
      if (api.enableCache && cachedKey) {
        this.cache.delete(cachedKey)
      }
      if (api.enableRetry && api.retryTimes >= 1) {
        return this.request({ ...api, retryTimes: api.retryTimes - 1 })
      } else {
        this.logResponseError(err, api)
        throw err
      }
    }

    // 处理请求返回情况
    const result = api.validateResponse(response)
    if (__DEV__) {
      console.assert(
        typeof result === "object" && result && "valid" in result,
        `validateResponse() 实际返回：${JSON.stringify(
          result
        )}，期望返回：{valid: boolean, message?: string}`
      )
    }

    if (result.valid) {
      // 请求成功，缓存结果（如果本次结果来自缓存，则不更新缓存，避免缓存期无限延长）
      if (api.enableCache && cachedKey && !hitCache) {
        this.cache.set(cachedKey, response, api.cacheTime)
      }
    } else {
      // 请求失败，重置缓存
      if (api.enableCache && cachedKey) {
        this.cache.delete(cachedKey)
      }
      // 失败重试
      if (api.enableRetry && api.retryTimes >= 1) {
        return this.request({ ...api, retryTimes: api.retryTimes - 1 })
      } else {
        this.logResponseError(api, response.data)
        // __DEV__ && console.error(res)
        throw new Error(result.message)
      }
    }

    // 打印原始数据
    if (hitCache) {
      this.logResponseCache(api, response.data)
    } else {
      this.logResponse(api, response.data)
    }

    // 转换响应
    response = api.transformResponse(response)

    return {
      ...response,
      from: hitCache ? "cache" : "network",
      api
    }
  }

  /**
   * 清除全部缓存
   */
  public clearCache() {
    return this.cache.clear()
  }

  private generateCachedKey(api: ApiDescriptor) {
    return `${api.method} ${api.baseURL}${api.url}?${getSortedString(api.query)}`
  }

  private mergeApi(
    api: ApiDescriptor,
    options: ApiSharpOptions,
    defaultOptions: Required<ApiSharpOptions>
  ): ProcessedApiDescriptor {
    const { httpClient, cache, ..._defaultOptions } = defaultOptions
    const _options = removeUndefinedValue(options) as ApiSharpOptions
    const _api = removeUndefinedValue(api) as ApiSharpOptions
    return {
      ..._defaultOptions,
      ..._options,
      ..._api,
      headers: {
        ...defaultOptions.headers,
        ..._options.headers,
        ..._api.headers
      }
    }
  }

  /**
   * 处理接口描述对象
   * 1. 确定默认值
   * 2. 参数类型检查
   * 3. 数据转换
   */
  public processApi(api: ApiDescriptor | string): ProcessedApiDescriptor {
    invariant(api, "api 为空")

    if (isString(api)) {
      api = { url: api }
    }

    const _api = this.mergeApi(api, this.options, defaultOptions)
    invariant(_api.url && isString(_api.url), "url 为空")

    _api.baseURL = _api.baseURL.replace(/\/+$/, "")

    invariant(httpMethodRegExp.test(_api.method), `无效的 HTTP 方法："${_api.method}"`)
    _api.method = _api.method.toUpperCase() as HttpMethod

    warning(
      _api.method === "GET" || !_api.enableCache,
      `只有 GET 请求支持开启缓存，当前请求方法为"${_api.method}"，缓存开启不会生效`
    )

    _api.timeout = Math.ceil(Math.max(_api.timeout, 0))
    return _api
  }

  private castRequest(api: ProcessedApiDescriptor): IRequest {
    const fullUrl = formatFullUrl(api.baseURL, api.url, api.method === "GET" ? api.query : {})
    return { ...api, fullUrl }
  }

  private logRequest(api: ProcessedApiDescriptor) {
    api.enableLog && api.formatLog(LogType.Request, api)
  }

  private logResponse(api: ProcessedApiDescriptor, data) {
    api.enableLog && api.formatLog(LogType.Response, api, data)
  }

  private logResponseError(api: ProcessedApiDescriptor, data?: any) {
    api.enableLog && api.formatLog(LogType.ResponseError, api, data)
  }

  private logResponseCache(api: ProcessedApiDescriptor, data) {
    api.enableLog && api.formatLog(LogType.ResponseCache, api, data)
  }
}
