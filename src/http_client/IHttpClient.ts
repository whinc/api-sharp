import { ProcessedApiDescriptor } from "ApiSharp"

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

export type QueryType = object | null
export type BodyType = object | null
export type ResponseType = "text" | "json"

/**
 * 请求参数接口
 *
 * 由具体平台实现该接口，尽量保持接口精简，减少针对平台的实现成本
 */
export type IRequest = Pick<ProcessedApiDescriptor, "url" | "method" | "body" | "headers" | "responseType">

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
