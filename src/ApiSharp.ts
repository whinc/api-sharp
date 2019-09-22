import {
  ApiDescriptor,
  HttpMethod,
  ProcessedApiDescriptor,
  ApiResponse,
  ReturnTypeFn,
} from "./types"
import invariant from "tiny-invariant"
import warning from "tiny-warning"
import PropTypes from "prop-types"
import { isString, isFunction, getSortedString, isUndefined, isNumber, isObject, identity } from "./utils"
import { ICache, ExpireCache } from "./cache"
import { IHttpClient, IResponse, WebXhrClient } from "./http_client"

type optionKeys = 'baseURL' | 'method' | 'headers' | 'enableMock' | 'enableCache' | 'cacheTime' | 'transformRequest' | 'transformResponse' | 'enableRetry' | 'retryTimes' | 'timeout' | 'enableLog' | 'logFormatter'
/**
 * 全局配置项
 */
export interface ApiSharpOptions extends Pick<ApiDescriptor, optionKeys> {
  httpClient?: IHttpClient
  cache?: ICache<Promise<IResponse<any>>>
}

export class ApiSharpRequestError extends Error {
  constructor(message?: string, public api?: ProcessedApiDescriptor) {
    super(message)
  }
}

type RemoveReturnFn<T> = {
  [K in keyof T]: Exclude<T[K], ReturnTypeFn<any>>
}

export const defaultOptions: Required<Omit<RemoveReturnFn<ApiSharpOptions>, 'transformRequest' | 'transformResponse'> & Pick<ApiSharpOptions, 'transformRequest' | 'transformResponse'>> = {
  httpClient: new WebXhrClient(),
  cache: new ExpireCache<Promise<IResponse<any>>>(),
  baseURL: "",
  headers: {},
  enableMock: false,
  method: "GET",
  enableCache: false,
  cacheTime: 5 * 1000,
  transformRequest: identity,
  transformResponse: identity,
  enableRetry: false,
  retryTimes: 1,
  timeout: 60 * 1000,
  enableLog:  process.env.NODE_ENV !== "production",
  logFormatter: {
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
}

export class ApiSharp {
  private readonly options: ApiSharpOptions
  private readonly httpClient: IHttpClient
  private readonly cache: ICache<Promise<IResponse<any>>>

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
  async request<T>(_api: ApiDescriptor | string): Promise<ApiResponse<T>> {
    const api = this.processApi(_api)

    this.logRequest(api)

    // 处理 mock 数据
    if (api.enableMock) {
      return { data: api.mockData, from: "mock", api, headers: {}, status: 200, statusText: "OK(mock)" }
    }

    let requestPromise: Promise<IResponse<T>>
    let cachedKey
    let hitCache = false

    // 处理缓存
    if (api.enableCache) {
      cachedKey = this.generateCachedKey(api)
      if (this.cache.has(cachedKey)) {
        requestPromise = this.cache.get(cachedKey)!
        hitCache = true
      } else {
        requestPromise = this.sendRequest<T>(api)
        hitCache = false
        this.cache.set(cachedKey, requestPromise, { timeout: api.cacheTime })
      }
    } else {
      requestPromise = this.sendRequest<T>(api)
    }

    let res: IResponse<T>

    try {
      // 发起请求
      res = await requestPromise
    } catch (err) {
      // 请求失败或超时，都会抛出异常并被捕获处理

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

    // 检查请求结果，并对失败情况做处理
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

    return {
      data: api.transformResponse(res.data),
      from: hitCache ? "cache" : "network",
      api,
      status: res.status,
      statusText: res.statusText,
      headers: res.headers
    }
  }

  /**
   * 清除全部缓存
   */
  public clearCache() {
    return this.cache.clear()
  }

  private sendRequest<T>(api: ProcessedApiDescriptor): Promise<IResponse<T>> {
    return this.httpClient.request<T>({
      baseURL: api.baseURL,
      url: api.url,
      method: api.method,
      headers: api.headers,
      timeout: api.timeout,
      query: api.method === "GET" ? api.params : {},
      body: api.method === "POST" ? api.params : {}
    })
  }

  private generateCachedKey(api: ApiDescriptor) {
    return `${api.method} ${api.baseURL}${api.url}?${getSortedString(api.params)}`
  }

  private mergeApi (api: ApiDescriptor, options: ApiSharpOptions): ApiDescriptor {
    return {
      ...options,
      ...Object.keys(api).filter(key => api[key] !== undefined).reduce((obj, key) => Object.assign(obj, {[key]: api[key]}), {})
    } as ApiDescriptor
  }

  private processApi(api: ApiDescriptor | string): ProcessedApiDescriptor {
    invariant(api, "api 为空")

    if (isString(api)) {
      api = { url: api }
    }
    api = this.mergeApi(api, this.options)

    const _api = {...api} as ProcessedApiDescriptor

    // 请求地址
    if (!api.url || !String(api.url)) {
      invariant(false, `url 为空`)
    } else {
      _api.url = String(api.url)
    }

    // 基地址
    if (isUndefined(api.baseURL)) {
      _api.baseURL = defaultOptions.baseURL
    } else {
      _api.baseURL = api.baseURL
    }
    _api.baseURL = _api.baseURL.replace(/\/+$/, "")

    // 请求方法
    if (isUndefined(api.method)) {
      _api.method = defaultOptions.method
    } else if (isString(api.method) && /get|post/i.test(api.method)) {
      _api.method = api.method.toUpperCase() as HttpMethod
    } else {
      invariant(false, `method 期望值为 get|post 其一，实际值为"${api.method}"`)
    }

    if (isUndefined(api.headers)) {
      _api.headers = defaultOptions.headers
    } else {
      _api.headers = api.headers
    }

    // 描述
    if (isFunction(api.description)) {
      _api.description = String(api.description.call(null, api))
    } else {
      _api.description = api.description || ''
    }

    // 开启缓存
    if (isUndefined(api.enableCache)) {
      _api.enableCache = defaultOptions.enableCache
    } else if (isFunction(api.enableCache)) {
      _api.enableCache = !!api.enableCache.call(null, api)
    } else {
      _api.enableCache = !!api.enableCache
    }
    if (_api.method.toUpperCase() !== "GET" && _api.enableCache) {
      _api.enableCache = false
      warning(false, `只有 GET 请求支持开启缓存，当前请求方法为"${_api.method}"，缓存开启不会生效`)
    }

    // 缓存时间
    if (isUndefined(api.cacheTime)) {
      _api.cacheTime = defaultOptions.cacheTime
    } else if (isNumber(api.cacheTime)) {
      _api.cacheTime = api.cacheTime
    } else if (isFunction(api.cacheTime)) {
      _api.cacheTime = api.cacheTime.call(null, api)
    } else {
      _api.cacheTime = defaultOptions.cacheTime
      warning(false, `cacheTime 期望 number/function 类型，实际类型为${typeof api.cacheTime}，自动使用默认值`)
    }

    if (isUndefined(api.enableMock)) {
      _api.enableMock = defaultOptions.enableMock
    } else if (isFunction(api.enableMock)) {
      _api.enableMock = !!api.enableMock.call(null, api)
    } else {
      _api.enableMock = !!api.enableMock
    }

    if (isFunction(api.mockData)) {
      _api.mockData = api.mockData.call(null, api)
    } else {
      _api.mockData = api.mockData
    }

    if (isUndefined(api.enableRetry)) {
      _api.enableRetry = defaultOptions.enableRetry
    } else if (isFunction(api.enableRetry)) {
      _api.enableRetry = !!api.enableRetry.call(null, api)
    } else {
      _api.enableRetry = !!api.enableRetry
    }

    if (isUndefined(api.retryTimes)) {
      _api.retryTimes = defaultOptions.retryTimes
    } else if (isNumber(api.retryTimes)) {
      _api.retryTimes = api.retryTimes
    } else if (isFunction(api.retryTimes)) {
      _api.retryTimes = api.retryTimes.call(null, api)
    } else {
      _api.retryTimes = defaultOptions.retryTimes
      warning(false, `retryTimes 期望 number/function 类型，实际类型为${typeof api.retryTimes}，自动使用默认值`)
    }

    if (isUndefined(api.timeout)) {
      _api.timeout = defaultOptions.timeout
    } else {
      _api.timeout = api.timeout
    }

    if (isUndefined(api.enableLog)) {
      _api.enableLog = defaultOptions.enableLog
    } else if (isFunction(api.enableLog)) {
      _api.enableLog = !!api.enableLog.call(null, api)
    } else {
      _api.enableLog = !!api.enableLog
    }

    if (isUndefined(api.logFormatter)) {
      _api.logFormatter = defaultOptions.logFormatter
    } else if (isObject(api.logFormatter)) {
      _api.logFormatter = {
        logRequest: api.logFormatter.logRequest || defaultOptions.logFormatter.logRequest,
        logResponse: api.logFormatter.logResponse || defaultOptions.logFormatter.logResponse,
        logResponseError: api.logFormatter.logResponseError || defaultOptions.logFormatter.logResponseError,
        logResponseCache: api.logFormatter.logResponseCache || defaultOptions.logFormatter.logResponseCache
      }
    } else {
      _api.logFormatter = defaultOptions.logFormatter
    }

    /**
     * 参数转换 + 类型校验
     */
    let _params = isUndefined(api.params) ? {} : api.params
    let _transformRequest
    if (isUndefined(api.transformRequest)) {
      _transformRequest = defaultOptions.transformRequest
    } else if (isFunction(api.transformRequest)) {
      _transformRequest = api.transformRequest
    } else {
      _transformRequest = defaultOptions.transformRequest
      warning(false, `transformRequest 期望一个函数，实际接收到${typeof api.transformRequest}`)
    }
    _params = _transformRequest.call(null, _params)

    if (!isUndefined(api.paramsType)) {
      const componentName = _api.baseURL + _api.url
      PropTypes.checkPropTypes(api.paramsType, _params, "", componentName)
    }
    _api.params = _params!

    if (isUndefined(api.transformResponse)) {
      _api.transformResponse = defaultOptions.transformResponse
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
