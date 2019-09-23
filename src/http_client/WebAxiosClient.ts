import axios from "axios"
import IHttpClient, { IRequest, IResponse } from './IHttpClient'

export default class WebAxiosClient implements IHttpClient {
  async request<T>(options: IRequest): Promise<IResponse<T>> {
    const res = await axios.request({
      url: options.url,
      method: options.method,
      data: options.body,
      headers: options.headers
    })

    return {
      data: res.data,
      status: res.status,
      statusText: res.statusText,
      headers: res.headers
    }
  }
}
