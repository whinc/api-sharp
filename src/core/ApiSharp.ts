import {
  isString,
  getSortedString,
  identity,
  invariant,
  warning,
  formatFullUrl,
  isUndefined
} from "../utils"
import {
  ApiResponse,
  LogType,
  ApiConfig,
  HttpMethod,
  IResponse,
  IRequest,
  IHttpClient,
  ICache
} from "../types"
import { MemoryCache } from "../cache"
import { WebXhrClient } from "../http_client"

const httpMethodRegExp = /GET|POST|DELETE|HEAD|OPTIONS|PUT|PATCH/i

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

export const defaultOptions: Required<ApiConfig> = {
  httpClient: new WebXhrClient(),
  cache: new MemoryCache<IResponse>(),
  withCredentials: false,
  baseURL: "",
  headers: {
    "Content-Type": "application/json"
  },
  url: "",
  description: "",
  params: null,
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
    if (res.status < 200 && res.status >= 300) {
      return res.statusText
    }
    return true
  },
  enableRetry: false,
  retryTimes: 0,
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
  private readonly options: Required<ApiConfig>
  private readonly httpClient: IHttpClient
  private readonly cache: ICache<IResponse>

  constructor(options: Omit<ApiConfig, "url"> = {}) {
    this.options = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers
      }
    }
    this.httpClient = this.options.httpClient
    this.cache = this.options.cache
  }

  /**
   * 发送 HTTP 请求
   * @param api - 接口描述符
   * @return 响应数据
   */
  async request<T = any>(apiConfig: ApiConfig | string): Promise<ApiResponse<T>> {
    const _apiConfig = this.processApiConfig(apiConfig)
    const requestConfig: IRequest = this.createRequestConfig(_apiConfig)

    // 转换请求
    Object.assign(_apiConfig, requestConfig)

    this.logRequest(_apiConfig)

    // 处理 mock 数据
    if (_apiConfig.enableMock) {
      // TODO: 使用 setTimeout 模拟异步返回
      return {
        data: _apiConfig.mockData,
        from: "mock",
        api: _apiConfig,
        headers: {},
        status: 200,
        statusText: "OK"
      }
    }

    let requestPromise: Promise<IResponse<T>>
    let cachedKey
    let hitCache = false

    // 处理缓存
    if (_apiConfig.enableCache) {
      cachedKey = this.generateCachedKey(_apiConfig)
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
      if (_apiConfig.enableCache && cachedKey) {
        this.cache.delete(cachedKey)
      }
      if (_apiConfig.enableRetry && _apiConfig.retryTimes >= 1) {
        return this.request({ ..._apiConfig, retryTimes: _apiConfig.retryTimes - 1 })
      } else {
        this.logResponseError(err, _apiConfig)
        throw err
      }
    }

    // 处理请求返回情况
    const result = _apiConfig.validateResponse(response)
    const isValid = isUndefined(result) ? true : isString(result) ? false : !!result
    const message = isString(result) ? result : ""

    if (isValid) {
      // 请求成功，缓存结果（如果本次结果来自缓存，则不更新缓存，避免缓存期无限延长）
      if (_apiConfig.enableCache && cachedKey && !hitCache) {
        this.cache.set(cachedKey, response, _apiConfig.cacheTime)
      }
    } else {
      // 请求失败，重置缓存
      if (_apiConfig.enableCache && cachedKey) {
        this.cache.delete(cachedKey)
      }
      // 失败重试
      if (_apiConfig.enableRetry && _apiConfig.retryTimes >= 1) {
        return this.request({ ..._apiConfig, retryTimes: _apiConfig.retryTimes - 1 })
      } else {
        this.logResponseError(_apiConfig, response.data)
        // __DEV__ && console.error(res)
        throw new Error(message)
      }
    }

    // 打印原始数据
    if (hitCache) {
      this.logResponseCache(_apiConfig, response.data)
    } else {
      this.logResponse(_apiConfig, response.data)
    }

    // 转换响应
    response = _apiConfig.transformResponse(response)

    return {
      ...response,
      from: hitCache ? "cache" : "network",
      api: _apiConfig
    }
  }

  public processApiConfig(_apiConfig: ApiConfig | string): Required<ApiConfig> {
    // 处理 apiConfig 为 url 的情形
    if (isString(_apiConfig)) {
      _apiConfig = { url: _apiConfig }
    }

    // 合并配置项
    const apiConfig = {
      ...defaultOptions,
      ...this.options,
      ..._apiConfig,
      headers: {
        ...defaultOptions.headers,
        ...this.options.headers,
        ..._apiConfig.headers
      }
    }

    invariant(apiConfig.url && isString(apiConfig.url), "url 为空")

    invariant(httpMethodRegExp.test(apiConfig.method), `无效的 HTTP 方法："${apiConfig.method}"`)
    apiConfig.method = apiConfig.method.toUpperCase() as HttpMethod

    warning(
      apiConfig.method === "GET" || !apiConfig.enableCache,
      `只有 GET 请求支持开启缓存，当前请求方法为"${apiConfig.method}"，缓存开启不会生效`
    )

    apiConfig.timeout = Math.ceil(Math.max(apiConfig.timeout, 0))

    return apiConfig
  }

  /**
   * 清除全部缓存
   */
  public clearCache() {
    return this.cache.clear()
  }

  private generateCachedKey(api: ApiConfig) {
    return `${api.method} ${api.baseURL}${api.url}?${getSortedString(api.params)}`
  }

  public createRequestConfig(apiConfig: Required<ApiConfig>) {
    const fullUrl = formatFullUrl(
      apiConfig.baseURL,
      apiConfig.url,
      apiConfig.method === "GET" ? apiConfig.params : {}
    )
    return apiConfig.transformRequest({ ...apiConfig, fullUrl })
  }

  private logRequest(api: Required<ApiConfig>) {
    api.enableLog && api.formatLog(LogType.Request, api)
  }

  private logResponse(api: Required<ApiConfig>, data) {
    api.enableLog && api.formatLog(LogType.Response, api, data)
  }

  private logResponseError(api: Required<ApiConfig>, data?: any) {
    api.enableLog && api.formatLog(LogType.ResponseError, api, data)
  }

  private logResponseCache(api: Required<ApiConfig>, data) {
    api.enableLog && api.formatLog(LogType.ResponseCache, api, data)
  }
}
