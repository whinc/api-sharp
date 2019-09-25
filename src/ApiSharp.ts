import PropTypes from "prop-types"
import {Validator} from 'prop-types'
import { isString, getSortedString, isUndefined, identity, invariant, warning } from "./utils"
import { ICache, ExpireCache } from "./cache"
import {  WebXhrClient, IHttpClient, IResponse, HttpMethod, HttpHeader } from "./http_client"
import { formatFullUrl } from "./utils"

    const removeUndefinedValue = target => {
      return Object.keys(target).filter(key => target[key] !== undefined).reduce((obj, key) => Object.assign(obj, {[key]: target[key]}), {})
    }

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

export type ReturnTypeFn<T> = (api: ApiDescriptor) => T
export type Params = Object
export type ParamsType = { [key in keyof Params]: Validator<any> }
export type Transformer<T> = (value: T) => T

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
   * 支持 `"GET" | "POST"`
   * 
   * 默认`"GET"`
   */
  method?: HttpMethod
  /**
   * HTTP 请求头
   * 
   * 默认`{}`
   * 
   * 例如：`{"Content-Type": "application/json"}`
   */
  headers?: HttpHeader
  /**
   * 接口描述
   * 
   * 默认`""`
   */
  description?: string
  /**
   * 请求参数
   * 
   * 最终发送给服务器的数据是 string 类型，数据转换规则如下：
   * - 对于 GET 请求，数据转换成 query string（encodeURIComponent(k)=encodeURIComponent(v)&encodeURIComponent(k)=encodeURIComponent(v)...）
   * - 对于 POST 请求，会对数据进行 JSON 序列化
   * 
   * 例如：`{id: 100}`
   */
  params?: Params
  /**
   * 请求参数类型
   * 
   * 支持 PropType 类型，类型不符时控制台输出错误提示（但不影响接口继续请求），仅在`process.env.NODE_ENV !== 'production'`时有效，生产环境不会引入 prop-types 包
   * 
   * 例如：`{ id: PropTypes.number.isRequired }`
   */
  paramsType?: ParamsType
  /**
   * 转换请求参数
   * 
   * 用户发起调用 -> params(原始参数) -> transformRequest(参数转换) -> paramsType(类型校验) -> 发出 HTTP 请求
   * 
   * 例如：`(params) => ({...params, name: 'abc'})`
   */
  transformRequest?: Transformer<Params>
  /**
   * 转换响应数据
   * 
   * 接收 HTTP 响应 -> data(返回数据) -> transformResponse(数据转换) -> 用户接收结果
   * 
   * 例如：`(data) => ({...data, errMsg: 'errCode: ' + data.errCode})`
   *
   */
  transformResponse?: Transformer<any>
  /**
   * 开启缓存
   * 
   * 并发请求相同接口且参数相同时，实际只会发出一个请求，因为缓存的是请求的 Promise
   * 
   * 默认`false`
   */
  enableCache?: boolean
  /**
   * 缓存持续时间，单位毫秒
   * 
   * 下次取缓存时，如果缓存已存在的的时间超过该值，则对应缓存失效
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
  logFormatter?: LogFormatter
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
export interface LogFormatter {
  /**
   * 记录 HTTP 发出最近的数据
   */
  logRequest(api: ProcessedApiDescriptor): void
  /**
   * 记录 HTTP 响应后最近的数据
   */
  logResponse(api: ProcessedApiDescriptor, data?: any): void
  logResponseError(error: Error, api: ProcessedApiDescriptor, data?: any): void
  logResponseCache(api: ProcessedApiDescriptor, data?: any): void
}



/**
 * 全局配置项
 */
export interface ApiSharpOptions extends Omit<ApiDescriptor, 'url' | 'description' | 'params' | 'paramsType'> {
  httpClient?: IHttpClient
  cache?: ICache<Promise<IResponse<any>>>
}

export class ApiSharpRequestError extends Error {
  constructor(message?: string, public api?: ProcessedApiDescriptor) {
    super(message)
  }
}

export const defaultOptions: Required<ApiSharpOptions> = {
  httpClient: new WebXhrClient(),
  cache: new ExpireCache<Promise<IResponse<any>>>(),
  withCredentials: false,
  baseURL: "",
  headers: {},
  enableMock: false,
  mockData: undefined,
  method: "GET",
  enableCache: false,
  cacheTime: 5 * 1000,
  transformRequest: identity,
  transformResponse: identity,
  enableRetry: false,
  retryTimes: 1,
  timeout: 0,
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

// 永不 resolve 或 reject 的 Promise
const nerverPromise = new Promise(() => {})

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
  async request<T = any>(_api: ApiDescriptor | string): Promise<ApiResponse<T>> {
    const api = this.processApi(_api)

    this.logRequest(api)

    // 处理 mock 数据
    if (api.enableMock) {
      return { data: api.mockData, from: "mock", api, headers: {}, status: 200, statusText: "OK(mock)" }
    }

    let requestPromise: Promise<IResponse<T>>
    let cachedKey
    let hitCache = false

    // 构造一个超时时自动 reject 的 Promise
    let timeoutPromise: Promise<IResponse<T>> = nerverPromise as Promise<IResponse<T>>
    if (api.timeout > 0) {
      timeoutPromise = new Promise((_resolve, reject) => {
        const error = new Error(`请求超时(${api.timeout}ms)`)
        setTimeout(() => reject(error), api.timeout)
      })
    }

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
      res = await Promise.race([requestPromise, timeoutPromise])
    } catch (err) {
      // 请求失败或超时，都会抛出异常并被捕获处理

      // 请求失败时删除缓存
      if (api.enableCache) {
        this.cache.delete(cachedKey)
      }
      if (api.enableRetry && api.retryTimes >= 1) {
        return this.request({ ...api, retryTimes: api.retryTimes - 1})
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
        return this.request({ ...api, retryTimes: api.retryTimes - 1})
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
    const fullUrl = formatFullUrl(api.baseURL, api.url, api.method === 'GET' ? api.params : {})
    return this.httpClient.request<T>({
      url: fullUrl,
      method: api.method,
      headers: api.headers,
      body: api.method === "POST" ? api.params : null
    })
  }

  private generateCachedKey(api: ApiDescriptor) {
    return `${api.method} ${api.baseURL}${api.url}?${getSortedString(api.params)}`
  }

  private processApi(api: ApiDescriptor | string): ProcessedApiDescriptor {
    invariant(api, "api 为空")

    if (isString(api)) {
      api = { url: api }
    }

    const {httpClient, cache, ..._defaultOptions} = defaultOptions 
    const _api = {
      description: '',
      ..._defaultOptions,
      ...removeUndefinedValue(this.options),
      ...removeUndefinedValue(api)
    } as ProcessedApiDescriptor

    invariant(_api.url && isString(_api.url), 'url 为空')

    _api.baseURL = _api.baseURL.replace(/\/+$/, "")

    invariant(/get|post/i.test(_api.method), `method 期望值为 get|post 其一，实际值为"${_api.method}"`)
    _api.method = _api.method.toUpperCase() as HttpMethod

    warning(_api.method === 'GET' || !_api.enableCache, `只有 GET 请求支持开启缓存，当前请求方法为"${_api.method}"，缓存开启不会生效`)

    _api.timeout = Math.ceil(Math.max(_api.timeout, 0))

    const _params = _api.transformRequest.call(null, _api.params)
    if (!isUndefined(_api.paramsType)) {
      const componentName = _api.baseURL + _api.url
      PropTypes.checkPropTypes(_api.paramsType, _params, "", componentName)
    }
    _api.params = _params!

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
