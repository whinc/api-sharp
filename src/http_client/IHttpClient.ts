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
  request(options: IRequest): Promise<IResponse>
}

export interface IResponse<T = any> {
  data: T
  headers: HttpHeader
  status: number
  statusText: string
}
