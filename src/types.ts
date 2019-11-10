interface Validator {
  (
    props: object,
    propName: string,
    componentName: string,
    location: string,
    propFullName: string
  ): Error | null
}

export type HttpMethod =
  | "get"
  | "GET"
  | "post"
  | "POST"
  | "delete"
  | "DELETE"
  | "head"
  | "HEAD"
  | "options"
  | "OPTIONS"
  | "put"
  | "PUT"
  | "patch"
  | "PATCH"

export enum LogType {
  Request,
  Response,
  ResponseError,
  ResponseCache
}

export type ApiDescriptor<
  Query = Record<string, any>,
  Body = Record<string, any>
> = CommonApiDescriptor<Query, Body> & WebXhrApiDescriptor

interface CommonApiDescriptor<Query, Body> {
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
  headers?: Record<string, any>
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
  query?: Query | null
  /**
   * 请求 URL 中的查询参数类型
   *
   * 仅当 query 为`Object`类型且`process.env.NODE_ENV !== 'production'`时执行检查
   *
   * 例如：`{ id: PropTypes.number.isRequired }`
   */
  queryPropTypes?: Query extends object ? { [K in keyof Query]?: Validator } | null : null
  /**
   * 请求体中的数据
   *
   * 仅支持 POST 请求，数据会转换成字符串传输，转换规则由请求头`Content-Type`决定：
   * 请求头包含`Content-Type: application/json`时，数据序列化为 JSON 字符串
   *
   * 例如：`{a: 1, b: 2}`
   */
  body?: Body | null
  /**
   * 传入的`body`的数据类型
   *
   * 仅当 body 为`Object`类型且`process.env.NODE_ENV !== 'production'`时执行类型检查，类型检查时机发生在使用`transformRequest`进行数据转换之前
   *
   * 例如：`{ id: PropTypes.number.isRequired }`
   */
  bodyPropTypes?: Body extends object ? { [P in keyof Body]?: Validator } | null : null
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
  responseType?: "json" | "text"
  /**
   * 转换请求数据
   */
  transformRequest?: (body: Body | null, headers: Record<string, any>) => any
  /**
   * 检查响应数据是否有效
   *
   * 检查函数返回 true 表示成功，返回 false 表示失败（失败信息为 HTTP 状态码描述)，返回 Error 也表示失败（失败信息为 Error 中的错误消息）
   *
   * 默认：`(res) => res.status >= 200 && res.status < 300`
   */
  validateResponse?: <Data = any>(res: IResponse<Data>) => boolean | Error
  /**
   * 转换响应数据
   */
  transformResponse?: <Data = any>(data: Data) => any
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
  formatLog?: (type: LogType, api: ProcessedApiDescriptor<Query, Body>, data?: any) => void
}

interface WebXhrApiDescriptor {
  /**
   * 跨域请求时是否带上用户信息（如Cookie和认证的HTTP头）
   *
   * 默认`false`
   */
  withCredentials?: boolean
}

export type ProcessedApiDescriptor<Query = any, Body = any> = Required<ApiDescriptor<Query, Body>>

/**
 * 请求参数接口
 *
 * 由具体平台实现该接口，尽量保持接口精简，减少针对平台的实现成本
 */
export type IRequest = {
  url: string
  method: HttpMethod
  body: Record<string, any>
  headers: Record<string, any>
  timeout: number
  responseType: "json" | "text"
  [key: string]: any
}

export type IResponse<T = any> = {
  /**
   * 接口返回数据
   * 返回 HTTP 响应数据经过数据转换后的值
   */
  data: T
  /**
   * HTTP 状态码
   */
  status: number
  /**
   * HTTP 状态码描述
   */
  statusText: string
  /**
   * HTTP 响应头部
   */
  headers: Record<string, any>
}

export type ApiResponse<T = any> = IResponse<T> & {
  /**
   * 请求接口描述符
   */
  api: ProcessedApiDescriptor
  /**
   * 响应数据的来源
   */
  from: "cache" | "network" | "mock"
}
