import * as PropTypes from "./PropTypes"
import { isString, getSortedString, identity, invariant, warning, isPlainObject } from "./utils"
import { ICache, MemoryCache } from "./cache"
import {
  WebXhrClient,
  IHttpClient,
  IResponse,
  HttpMethod,
  HttpHeader,
  BodyType,
  QueryType,
  ResponseType
} from "./http_client"
import { formatFullUrl } from "./utils"

const removeUndefinedValue = target => {
  return Object.keys(target)
    .filter(key => target[key] !== undefined)
    .reduce((obj, key) => Object.assign(obj, { [key]: target[key] }), {})
}

const httpMethodRegExp = /GET|POST|DELETE|HEAD|OPTIONS|PUT|PATCH/i

export interface ApiResponse<T> extends IResponse<T> {
  /**
   * 请求接口描述符
   */
  api: ProcessedApiDescriptor
  /**
   * 响应数据的来源
   */
  from: "cache" | "network" | "mock"
}

export type ApiDescriptor = CommonApiDescriptor & WebXhrApiDescriptor

interface CommonApiDescriptor {
  /**
   * 请求地址
   *
   * 支持相对地址（如`"/a/b/c"`）和绝对地址（如`"http://xyz.com/a/b/c"`）
   */
  url: string
  /**
   * 基地址
   *
   * 默认`""`
   *
   * 例如：`'http://xyz.com'`, `'http://xyz.com/a/b'`
   */
  baseURL?: string
  /**
   * HTTP 请求方法
   *
   * 支持 `GET|POST|DELETE|HEAD|OPTIONS|PUT|PATCH`
   *
   * 默认`"GET"`
   */
  method?: HttpMethod
  /**
   * HTTP 请求头
   *
   * 如果设置了全局 headers，接口中的 headers 将于全局 headers 合并，且接口中的 header 优先级更高
   *
   * 默认`{"Content-Type": "application/json"}`
   */
  headers?: HttpHeader
  /**
   * 接口描述
   *
   * 默认`""`
   */
  description?: string
  /**
   * 请求 URL 中的查询参数
   *
   * 对象会转换成 URL 查询字符串并拼接在 URL 后面，转换规则：encodeURIComponent(k1)=encodeURIComponent(v1)&encodeURIComponent(k2)=encodeURIComponent(v2)...
   *
   * 例如：`{a: 1, b: 2}`会转换成`"a=1&b=2"`
   */
  query?: QueryType
  /**
   * 请求 URL 中的查询参数类型
   *
   * 仅当 query 为`Object`类型且`process.env.NODE_ENV !== 'production'`时执行检查
   *
   * 例如：`{ id: PropTypes.number.isRequired }`
   */
  queryPropTypes?: { [key: string]: PropTypes.Validator } | null
  /**
   * 请求体中的数据
   *
   * 仅支持 POST 请求，数据会转换成字符串传输，转换规则由请求头`Content-Type`决定：
   * 请求头包含`Content-Type: application/json`时，数据序列化为 JSON 字符串
   *
   * 例如：`{a: 1, b: 2}`
   */
  body?: BodyType
  /**
   * 传入的`body`的数据类型
   *
   * 仅当 body 为`Object`类型且`process.env.NODE_ENV !== 'production'`时执行类型检查，类型检查时机发生在使用`transformRequest`进行数据转换之前
   *
   * 例如：`{ id: PropTypes.number.isRequired }`
   */
  bodyPropTypes?: { [key: string]: PropTypes.Validator } | null
  /**
   * 响应的数据类型
   *
   * 支持类型如下：
   *
   * `"text"`：返回字符串
   * `"json"`：返回`JSON.parse()`后的结果，如果解析失败返回`null`
   *
   * 默认`"json"`
   */
  responseType?: ResponseType
  /**
   * 转换请求数据
   */
  transformRequest?: (body: BodyType, headers: Object) => any
  /**
   * 检查响应数据是否有效
   *
   * 检查函数返回 true 表示成功，返回 false 表示失败（失败信息为 HTTP 状态码描述)，返回 Error 也表示失败（失败信息为 Error 中的错误消息）
   *
   * 默认：`(res) => res.status >= 200 && res.status < 300`
   */
  validateResponse?: (res: IResponse) => boolean | Error
  /**
   * 转换响应数据
   */
  transformResponse?: (data: any) => any
  /**
   * 开启缓存
   *
   * 开启后，优先返回缓存，如果无可用缓存则请求网络，并缓存返回结果
   *
   * 默认`false`
   */
  enableCache?: boolean
  /**
   * 缓存持续时间，单位毫秒
   *
   * 本次网络请求结果缓存的时间，仅当 enableCache 为 true 时有效
   *
   * 默认 `5*60*1000`ms
   */
  cacheTime?: number
  /**
   * 开启接口数据模拟
   *
   * 默认`false`
   */
  enableMock?: boolean
  /**
   * 模拟的接口数据
   *
   * 默认`undefined`
   *
   * 例如：`{id: 1, name: 'jim'}`
   */
  mockData?: any
  /**
   * 开启失败重试
   *
   * 默认`false`
   */
  enableRetry?: boolean
  /**
   * 重试最大次数
   *
   * 默认`1`
   */
  retryTimes?: number
  /**
   * 接口超时时间，单位毫秒
   *
   * 从发出请求起，如果 timeout 毫秒后接口未返回，接口调用失败。
   *
   * 默认`60*1000`ms
   */
  timeout?: number
  /**
   * 开启控制台日志
   *
   * 默认为`process.env.NODE_ENV !== "production"`
   */
  enableLog?: boolean
  /**
   * 格式化日志
   */
  formatLog?: (type: LogType, api: ProcessedApiDescriptor, data?: any) => void
}

interface WebXhrApiDescriptor {
  /**
   * 跨域请求时是否带上用户信息（如Cookie和认证的HTTP头）
   *
   * 默认`false`
   */
  withCredentials?: boolean
}

export type ProcessedApiDescriptor = Required<ApiDescriptor>

export enum LogType {
  Request,
  Response,
  ResponseError,
  ResponseCache
}

/**
 * 全局配置项
 */
export interface ApiSharpOptions extends Partial<ApiDescriptor> {
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

// 永不 resolve 或 reject 的 Promise
const neverPromise = new Promise(() => {})

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

    let res: IResponse<T>

    // 获取请求结果
    try {
      res = await requestPromise
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
    const result = api.validateResponse(res)
    if (result === true) {
      // 请求成功，缓存结果（如果本次结果来自缓存，则不更新缓存，避免缓存期无限延长）
      if (api.enableCache && cachedKey && !hitCache) {
        this.cache.set(cachedKey, res, api.cacheTime)
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
        this.logResponseError(api, res.data)
        // __DEV__ && console.error(res)
        throw result instanceof Error ? result : new Error(res.statusText)
      }
    }

    // 打印原始数据
    if (hitCache) {
      this.logResponseCache(api, res.data)
    } else {
      this.logResponse(api, res.data)
    }

    // 转换后的数据
    const transformedData = api.transformResponse(res.data)

    return {
      data: transformedData,
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
    const fullUrl = formatFullUrl(api.baseURL, api.url, api.method === "GET" ? api.query : null)
    return this.httpClient.request<T>({
      url: fullUrl,
      method: api.method,
      headers: api.headers,
      body: api.method === "POST" ? api.body : null,
      responseType: api.responseType,
      timeout: api.timeout
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
    const _api = removeUndefinedValue(api) as Required<ApiSharpOptions>
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
    // 转换请求数据
    _api.body = _api.transformRequest.call(null, _body, _api.headers)

    return _api
  }

  protected checkResponseData(_data: any): { success: boolean; errMsg?: string } {
    // return {
    //   success: false,
    //   errMsg: ''
    // }
    return {
      success: true
    }
  }

  private logRequest(api: ProcessedApiDescriptor) {
    api.enableLog && api.formatLog(LogType.Response, api)
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
