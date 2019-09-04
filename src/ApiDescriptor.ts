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
   * 发出请求前对实际传入参数进行类型校验，校验通过才会发起实际请求，否则终止请求并抛出异常
   * TODO:
   */
  paramTypes?: Object
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
}

export interface ProcessedApiDescriptor {
  url: string
  baseURL?: string
  method?: HTTPMethod
  description?: string
  params?: Object
  paramTypes?: Object
  enableCache?: boolean
  cacheTime?: number
  enableMock?: boolean
  mockData?: any
}
