import axios, { AxiosStatic, AxiosResponse, AxiosInstance } from "axios"
import { ApiDescriptor, HTTPMethod } from "./ApiDescriptor"
import invariant from "tiny-invariant"
import warning from "tiny-warning"
import { isString, isFunction, getSortedString, isUndefined, isNumber } from "./utils"
import ICache from "./ICache"
import ExpireCache from "./ExpireCache"

export interface ApiSharpOptions {
  axios?: AxiosStatic
  cache?: ICache
  enableLog?: boolean
}

export interface ApiSharpResponse<T> {
  data: T
  from: "cache" | "network"
}

const defaultMethod = 'GET'
const defaultDescription = ''
const defaultCacheTime = 5 * 1000

export class ApiSharp {
  private axios: AxiosInstance
  private cache: ICache<Promise<AxiosResponse>>
  private enableLog: boolean

  constructor(options: ApiSharpOptions = {}) {
    this.enableLog = options.enableLog !== undefined ? !!options.enableLog : true
    this.axios = options.axios || axios.create()
    this.cache = options.cache || new ExpireCache<Promise<AxiosResponse>>()
  }

  /**
   * 发送请求
   */
  async request(api: ApiDescriptor): Promise<ApiSharpResponse<any>> {
    api = this.processApi(api)

    this.logRequest(api)

    let requestPromise: Promise<AxiosResponse>
    let cachedKey
    let hitCache = false

    if (api.enableCache) {
      cachedKey = this.generateCachedKey(api)
      if (this.cache.has(cachedKey)) {
        requestPromise = this.cache.get(cachedKey)!
        hitCache = true
      } else {
        requestPromise = this.sendRequest(api)
        hitCache = false
        this.cache.set(cachedKey, requestPromise)
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
      this.logErrorResponse(api, null)
      // 重新抛出错误
      throw err
    }

    const checkResult = this.checkResponseData(res.data)
    if (!checkResult.success) {
      if (api.enableCache) {
        this.cache.delete(cachedKey)
      }
      this.logErrorResponse(api, res.data)
      throw new Error(checkResult.errMsg)
    }

    if (hitCache) {
      this.logHitCache(api, res.data)
    } else {
      this.logResponse(api, res.data)
    }

    return { data: res.data, from: hitCache ? "cache" : "network" }
  }

  /**
   * 清除全部缓存
   */
  public clearCache () {
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
    return `${api.baseURL}${api.url}:${api.method}:${getSortedString(api.params)}`
  }

  private processApi(api: ApiDescriptor): ApiDescriptor {
    invariant(api, "api 为空")

    const _api = { ...api }

    // 移除首部多余分隔符
    if (isString(api.url) && !!api.url) {
      _api.url = api.url.replace(/^\/{2,}/, "/")
    } else {
      invariant(false, `url 期望类型为 string，实际值为"${api.url}"`)
    }

    // 移除尾部多余分隔符
    _api.baseURL = (api.baseURL || this.axios.defaults.baseURL || "").replace(/\/+$/, "")

    // 请求方法
    if (isUndefined(api.method)) {
      _api.method = defaultMethod
    } else if (isString(api.method) && /get|post|delete|head|options|put|patch/i.test(api.method)){
      _api.method = api.method.toUpperCase() as HTTPMethod
    } else {
      invariant(false, `method 期望值为 get|post|delete|head|options|put|patch 其一，实际值为"${api.method}"`)
    }

    // 描述
    if (isUndefined(api.description)) {
      _api.description = defaultDescription
    } else if (isFunction(api.description)) {
      _api.description = api.description.call(null, api)
    } else if (isString(api.description)) {
      _api.description = api.description
    } else {
      invariant(false, `description 期望类型为 string/function，实际值为"${api.description}"`)
    }

    // 开启缓存
    _api.enableCache = isFunction(api.enableCache) ? api.enableCache.call(null, api) : !!api.enableCache

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
      invariant(false, `cacheTime 期望是 number/function 类型，实际值是"${api.cacheTime}"`)
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

  private logRequest(api: ApiDescriptor) {
    this.enableLog &&
      console.log(
        `%cRequest %c %c${api.method}|${api.description}|${api.url}%c|%O`,
        "color: white; background-color: rgba(0, 116, 217, 0.69); padding: 2px 5px; border-radius: 2px",
        "",
        "color: #0074D9",
        "",
        api.params
      )
  }

  private logResponse(api: ApiDescriptor, data) {
    this.enableLog &&
      console.log(
        `%cResponse%c %c${api.method}|${api.description}|${api.url}%c|%O|%O`,
        "color: white; background-color: rgba(61, 153, 112, 0.69); padding: 2px 5px; border-radius: 2px",
        "",
        "color: #3D9970",
        "",
        api.params,
        data
      )
  }

  private logErrorResponse(api: ApiDescriptor, data) {
    this.enableLog &&
      console.log(
        `%cResponse%c %c${api.method}|${api.description}|${api.url}%c|%O|%O`,
        "color: white; background-color: rgba(255, 65, 54, 0.69); padding: 2px 5px; border-radius: 2px",
        "",
        "color: #FF4136",
        "",
        api.params,
        data
      )
  }

  private logHitCache(api: ApiDescriptor, data) {
    this.enableLog &&
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
