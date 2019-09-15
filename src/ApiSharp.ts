import {
  ApiDescriptor,
  HttpMethod,
  ProcessedApiDescriptor,
  ApiSharpResponse,
  HttpHeader,
  Transformer,
  LogFormatter,
  Params
} from "./types/ApiDescriptor"
import invariant from "tiny-invariant"
import warning from "tiny-warning"
import PropTypes from "prop-types"
import { isString, isFunction, getSortedString, isUndefined, isNumber, isObject, identity, getDefault } from "./utils"
import {ICache, ExpireCache} from './cache'
import {IHttpClient, IResponse, WebXhrClient} from './http_client'

// 全局配置
export interface ApiSharpOptions {
  baseURL?: string
  method?: HttpMethod
  headers?: HttpHeader
  paramsTransformer?: Transformer<Params>
  returnsTransformer?: Transformer<any>
  enableCache?: boolean
  cacheTime?: number
  enableRetry?: boolean
  retryTimes?: number
  timeout?: number
  enableLog?: boolean
  logFormatter?: LogFormatter
}

export class ApiSharpRequestError extends Error {
  constructor(message?: string, public api?: ProcessedApiDescriptor) {
    super(message)
  }
}

export const defaultConfig = {
  url: '',
  baseURL: "",
  headers: {},
  enableMock: false,
  mockData: undefined,
  method: "GET",
  params: {},
  description: "",
  enableCache: false,
  cacheTime: 5 * 1000,
  paramsTransformer: identity,
  returnsTransformer: identity,
  enableRetry: false,
  retryTimes: 1,
  timeout: 60 * 1000,
  enableLog: process.env.NODE_ENV !== "production",
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
  private readonly httpClient: IHttpClient
  private readonly cache: ICache<Promise<IResponse>>
  private readonly baseURL: string
  private readonly method: HttpMethod
  private readonly headers: HttpHeader
  private readonly paramsTransformer: Transformer<Params>
  private readonly returnsTransformer: Transformer<any>
  private readonly enableCache: boolean
  private readonly cacheTime: number
  private readonly enableRetry: boolean
  private readonly retryTimes: number
  private readonly timeout: number
  private readonly enableLog: boolean
  private readonly logFormatter: LogFormatter

  constructor(options: ApiSharpOptions = {}) {
    this.httpClient = new WebXhrClient()
    // this.httpClient = new WebAxiosClient()
    this.cache = new ExpireCache<Promise<IResponse>>()
    this.baseURL = getDefault(options.baseURL, defaultConfig.baseURL)
    this.method = getDefault(options.method, defaultConfig.method)
    this.headers = getDefault(options.headers, defaultConfig.headers)
    this.paramsTransformer = getDefault(options.paramsTransformer, defaultConfig.paramsTransformer)
    this.returnsTransformer = getDefault(options.returnsTransformer, defaultConfig.returnsTransformer)
    this.enableCache = getDefault(options.enableCache, defaultConfig.enableCache)
    this.cacheTime = getDefault(options.cacheTime, defaultConfig.cacheTime)
    this.enableRetry = getDefault(options.enableRetry, defaultConfig.enableRetry)
    this.retryTimes = getDefault(options.retryTimes, defaultConfig.retryTimes)
    this.timeout = getDefault(options.timeout, defaultConfig.timeout)
    this.enableLog = getDefault(options.enableLog, defaultConfig.enableLog)
    this.logFormatter = getDefault(options.logFormatter, defaultConfig.logFormatter)
  }

  /**
   * 发送请求
   */
  async request(_api: ApiDescriptor): Promise<ApiSharpResponse<any>> {
    const api = this.processApi(_api)

    this.logRequest(api)

    // 处理 mock 数据
    if (api.enableMock) {
      return { data: api.mockData, from: "mock", api, headers: {}, status: 200, statusText: "OK(mock)" }
    }

    let requestPromise: Promise<IResponse>
    let cachedKey
    let hitCache = false

    // 构造一个超时时自动 reject 的 Promise
    const timeoutPromise: Promise<ApiSharpRequestError> = new Promise((_resolve, reject) => {
      const error = new Error(`请求超时(${api.timeout}ms)`)
      setTimeout(() => reject(error), api.timeout)
    })

    // 处理缓存
    if (api.enableCache) {
      cachedKey = this.generateCachedKey(api)
      if (this.cache.has(cachedKey)) {
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

    let res: IResponse

    try {
      // 发起请求
      res = await Promise.race([requestPromise, timeoutPromise]) as IResponse
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
      data: api.returnsTransformer(res.data),
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

  private sendRequest(api: ProcessedApiDescriptor): Promise<IResponse> {
    return this.httpClient.request({
      baseURL: api.baseURL,
      url: api.url,
      method: api.method,
      headers: api.headers,
      query: api.method === "GET" ? api.params : {},
      body: api.method === "POST" ? api.params : {}
    })
  }

  private generateCachedKey(api: ApiDescriptor) {
    return `${api.method} ${api.baseURL}${api.url}?${getSortedString(api.params)}`
  }

  private processApi(api: ApiDescriptor): ProcessedApiDescriptor {
    invariant(api, "api 为空")

    const _api = { ...api } as ProcessedApiDescriptor

    // 请求地址
    if (!api.url || !String(api.url)) {
      invariant(false, `url 为空`)
    } else {
      _api.url = String(api.url)
    }

    // 基地址
    if (isUndefined(api.baseURL)) {
      _api.baseURL = this.baseURL
    } else {
      _api.baseURL = api.baseURL
    }
    _api.baseURL = _api.baseURL.replace(/\/+$/, '')

    // 请求方法
    if (isUndefined(api.method)) {
      _api.method = this.method
    } else if (isString(api.method) && /get|post/i.test(api.method)) {
      _api.method = api.method.toUpperCase() as HttpMethod
    } else {
      invariant(false, `method 期望值为 get|post 其一，实际值为"${api.method}"`)
    }

    if (isUndefined(api.headers)) {
      _api.headers = this.headers
    } else {
      _api.headers = api.headers
    }

    // 描述
    if (isUndefined(api.description)) {
      _api.description = defaultConfig.description
    } else if (isFunction(api.description)) {
      _api.description = String(api.description.call(null, api))
    } else {
      _api.description = String(api.description)
    }

    // 开启缓存
    if (isUndefined(api.enableCache)) {
      _api.enableCache = this.enableCache
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
      _api.cacheTime = this.cacheTime
    } else if (isNumber(api.cacheTime)) {
      _api.cacheTime = api.cacheTime
    } else if (isFunction(api.cacheTime)) {
      _api.cacheTime = api.cacheTime.call(null, api)
    } else {
      _api.cacheTime = this.cacheTime
      warning(false, `cacheTime 期望 number/function 类型，实际类型为${typeof api.cacheTime}，自动使用默认值`)
    }

    if (isUndefined(api.enableMock)) {
      _api.enableMock = defaultConfig.enableMock
    } else if (isFunction(api.enableMock)) {
      _api.enableMock = !!api.enableMock.call(null, api)
    } else {
      _api.enableMock = !!api.enableMock
    }

    if (isUndefined(api.mockData)) {
      _api.mockData = defaultConfig.mockData
    } else if (isFunction(api.mockData)) {
      _api.mockData = api.mockData.call(null, api)
    } else {
      _api.mockData = api.mockData
    }

    if (isUndefined(api.enableRetry)) {
      _api.enableRetry = this.enableRetry
    } else if (isFunction(api.enableRetry)) {
      _api.enableRetry = !!api.enableRetry.call(null, api)
    } else {
      _api.enableRetry = !!api.enableRetry
    }

    if (isUndefined(api.retryTimes)) {
      _api.retryTimes = this.retryTimes
    } else if (isNumber(api.retryTimes)) {
      _api.retryTimes = api.retryTimes
    } else if (isFunction(api.retryTimes)) {
      _api.retryTimes = api.retryTimes.call(null, api)
    } else {
      _api.retryTimes = this.retryTimes
      warning(false, `retryTimes 期望 number/function 类型，实际类型为${typeof api.retryTimes}，自动使用默认值`)
    }

    if (isUndefined(api.timeout)) {
      _api.timeout = this.timeout
    } else {
      _api.timeout = api.timeout
    }

    if (isUndefined(api.enableLog)) {
      _api.enableLog = this.enableLog
    } else if (isFunction(api.enableLog)) {
      _api.enableLog = !!api.enableLog.call(null, api)
    } else {
      _api.enableLog = !!api.enableLog
    }

    if (isUndefined(api.logFormatter)) {
      _api.logFormatter = this.logFormatter
    } else if (isObject(api.logFormatter)) {
      _api.logFormatter = {
        logRequest: api.logFormatter.logRequest || this.logFormatter.logRequest,
        logResponse: api.logFormatter.logResponse || this.logFormatter.logResponse,
        logResponseError: api.logFormatter.logResponseError || this.logFormatter.logResponseError,
        logResponseCache: api.logFormatter.logResponseCache || this.logFormatter.logResponseCache
      }
    } else {
      _api.logFormatter = this.logFormatter
    }

    /**
     * 参数转换 + 类型校验
     */
    let _params = isUndefined(api.params) ? defaultConfig.params : api.params
    let _paramsTransformer
    if (isUndefined(api.paramsTransformer)) {
      _paramsTransformer = this.paramsTransformer
    } else if (isFunction(api.paramsTransformer)) {
      _paramsTransformer = api.paramsTransformer
    } else {
      _paramsTransformer = this.paramsTransformer
      warning(false, `paramsTransformer 期望一个函数，实际接收到${typeof api.paramsTransformer}`)
    }
    _params = _paramsTransformer.call(null, _params)
    if (!isUndefined(api.paramsType)) {
      const componentName = _api.baseURL + _api.url
      PropTypes.checkPropTypes(api.paramsType, _params, "", componentName)
    }
    _api.params = _params

    if (isUndefined(api.returnsTransformer)) {
      _api.returnsTransformer = this.returnsTransformer
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
