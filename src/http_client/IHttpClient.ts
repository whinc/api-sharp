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

export interface IRequest {
  baseURL: string
  url: string
  method: HttpMethod
  query: Object
  body: Object
  headers: HttpHeader
  timeout: number
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
