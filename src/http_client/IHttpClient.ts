export type HttpMethod = "get" | "GET" | "post" | "POST"
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

export type HttpHeader = { [key: string]: string }

/**
 * 请求参数接口
 *
 * 由具体平台实现该接口，尽量保持接口精简，减少针对平台的实现成本
 */
export interface IRequest {
  /**
   * 接口请求地址，是一个绝对路径
   *
   * 例如：`"http://xyz.com?a=b"`
   */
  url: string
  /**
   * 请求方法
   */
  method: HttpMethod
  /**
   * 请求数据
   *
   * 仅当请求方法为`"POST"`时有效
   */
  body?: Object
  /**
   * HTTP 请求头
   *
   * 例如：`{"Content-Type": "application/json"}`
   */
  headers: HttpHeader
}

export interface IResponse<T> {
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
  headers: HttpHeader
}

export default interface IHttpClient {
  request<T>(options: IRequest): Promise<IResponse<T>>
}
