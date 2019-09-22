import axios from "axios"
import IHttpClient, { IRequest, IResponse } from './IHttpClient'

export default class WebAxiosClient implements IHttpClient {
  async request<T>(options: IRequest): Promise<IResponse<T>> {
    const res = await axios.request({
      baseURL: options.baseURL,
      url: options.url,
      method: options.method,
      params: options.method === "GET" ? options.query : null,
      data: options.method === "POST" ? options.body : null,
      headers: options.headers,
      timeout: options.timeout
    })

    return {
      data: res.data,
      status: res.status,
      statusText: res.statusText,
      headers: res.headers
    }
  }
}
