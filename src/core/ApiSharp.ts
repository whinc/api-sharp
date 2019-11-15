import * as PropTypes from "../PropTypes"
import {
  isString,
  getSortedString,
  identity,
  invariant,
  warning,
  isPlainObject,
  formatFullUrl
} from "../utils"
import {
  ApiResponse,
  ProcessedApiDescriptor,
  LogType,
  ApiDescriptor,
  HttpMethod,
  IResponse
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
  queryPropTypes: null,
  body: null,
  bodyPropTypes: null,
  enableMock: false,
  mockData: undefined,
  method: "GET",
  responseType: "json",
  enableCache: false,
  cacheTime: 5 * 60 * 1000,
  transformRequest: identity,
  transformResponse: identity,
  validateResponse: res => res.status >= 200 && res.status < 300,
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

    // 转换请求
    Object.assign(api, api.transformRequest(api))

    this.logRequest(api)

    // 处理 mock 数据
    if (api.enableMock) {
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
        requestPromise = this.sendRequest<T>(api)
      }
    } else {
      requestPromise = this.sendRequest<T>(api)
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
    if (result === true) {
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
        throw result instanceof Error ? result : new Error(response.statusText)
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

  private sendRequest<T>(api: ProcessedApiDescriptor): Promise<IResponse<T>> {
    const fullUrl = formatFullUrl(api.baseURL, api.url, api.method === "GET" ? api.query : null)
    return this.httpClient.request({
      ...api,
      url: fullUrl
    })
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
   * 预处理接口，设置默认值、进行类型检查、数据转换等
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

    const _query = _api.query
    // 检查查询参数类型
    if (__DEV__) {
      if (isPlainObject(_query) && isPlainObject(_api.queryPropTypes)) {
        const name = _api.baseURL + _api.url
        PropTypes.checkPropTypes(_api.queryPropTypes, _query, "", name)
      }
    }
    _api.query = _query

    const _body = _api.body
    // 检查请求数据类型
    if (__DEV__) {
      if (isPlainObject(_body) && isPlainObject(_api.bodyPropTypes)) {
        const name = _api.baseURL + _api.url
        PropTypes.checkPropTypes(_api.bodyPropTypes, _body, "", name)
      }
    }
    return _api
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
