import { HttpHeader, HttpMethod } from "../types"

export interface IRequest {
  baseURL: string
  url: string
  method: HttpMethod
  query: any
  body: any
  headers: HttpHeader
}

export interface IHttpClient {
  request<T>(options: IRequest): Promise<IResponse<T>>
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
