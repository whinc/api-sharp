import {Validator} from 'prop-types'

export type HTTPMethod = "get" | "GET" | "post" | "POST"
// | 'delete'
// | 'DELETE'
// | 'head'
// | 'HEAD'
// | 'options'
// | 'OPTIONS'
// | 'put'
// | 'PUT'
// | 'patch'
// | 'PATCH'

export type ReturnTypeFn<T> = (api: ApiDescriptor) => T

export interface LogFormatter {
  logRequest(api: ProcessedApiDescriptor): void
  logResponse(api: ProcessedApiDescriptor, data?: any): void
  logResponseError(error: Error, api: ProcessedApiDescriptor, data?: any): void
  logResponseCache(api: ProcessedApiDescriptor, data?: any): void
}

export interface ApiDescriptor {
  /**
   * 请求的 HTTP 地址，支持相对地址和绝对地址
   * 如果是相对地址时，以 baseURL 作为基地址，计算最终地址
   * 如果是绝对地址，则忽略 baseURL，以该地址作为最终地址
   */
  url: string
  /**
   * 基地址
   */
  baseURL?: string
  /**
   * HTTP 请求方法，默认为 GET 方法
   */
  method?: HTTPMethod
  /**
   * 接口描述
   */
  description?: string | ReturnTypeFn<string>
  /**
   * 请求参数
   * GET 请求时，对象的键值对编码后作为 URL 后的查询字符串
   * POST 请求时，对象转换为 JSON 格式后作为 HTTP 的 body
   */
  params?: Object
  /**
   * 请求参数类型
   * 对请求参数进行运行时类型校验并打印警告，仅在 process.env.NODE_ENV !== 'production' 时生效，生产环境不会增加额外的包体积大小
   */
  paramTypes?: {[name: string]: Validator}
  /**
   * 开启缓存，默认关闭
   */
  enableCache?: boolean | ReturnTypeFn<boolean>
  /**
   * 缓存持续时间(单位毫秒)，默认 5 分钟
   * 下次取缓存时，如果缓存已存在的的时间超过该值，则对应缓存失效
   */
  cacheTime?: number | ReturnTypeFn<number>
  /**
   * 开启数据模拟，默认关闭
   */
  enableMock?: boolean | ReturnTypeFn<boolean>
  /**
   * 模拟接口返回的数据，默认 undefined
   */
  mockData?: any | ReturnTypeFn<any>
  /**
   * 开启失败重试，默认关闭
   */
  enableRetry?: boolean | ReturnTypeFn<boolean>
  /**
   * 重试最大次数，默认 1 次
   */
  retryTimes?: number | ReturnTypeFn<number>
  /**
   * 开启打印日志，默认为 process.env.NODE_ENV !== "production"
   */
  enableLog?: boolean | ReturnTypeFn<boolean>
  /**
   * 日志格式化
   */
  logFormatter?: LogFormatter

  /**
   * 其他用户自定义信息
   * 这些信息会被保留下来
   */
  [name: string]: any
}

export interface ProcessedApiDescriptor {
  url: string
  baseURL: string
  method: HTTPMethod
  description: string
  params: Object
  paramTypes: Object
  enableCache: boolean
  cacheTime: number
  enableMock: boolean
  mockData: any
  enableRetry: boolean
  retryTimes: number
  enableLog: boolean
  logFormatter: LogFormatter
  [name: string]: any
}
