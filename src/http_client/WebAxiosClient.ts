import {IHttpClient, IRequest, IResponse} from './IHttpClient'
import axios from 'axios'

export default class WebAxiosClient implements IHttpClient {
  async request(options: IRequest): Promise<IResponse> {
    const res = await axios.request({
      baseURL: options.baseURL,
      url: options.url,
      method: options.method,
      params: options.method === 'GET' ? options.query : null,
      data: options.method === 'POST' ? options.body : null,
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