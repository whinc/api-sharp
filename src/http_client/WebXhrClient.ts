import { formatFullUrl, formatResponseHeaders, isPlainObject } from "../utils"
import { IHttpClient, IRequest, IResponse } from "./IHttpClient"

export default class WebXhrClient implements IHttpClient {
  async request(options: IRequest): Promise<IResponse> {
    return new Promise(resolve => {
      const xhr = new XMLHttpRequest()
      const fullUrl = formatFullUrl(options.baseURL, options.url, options.query)
      xhr.open(options.method, fullUrl, true)
      // 设置请求头
      Object.keys(options.headers).forEach(key => xhr.setRequestHeader(key, options.headers[key]))

      // 设置请求数据
      let body: Document | BodyInit | null = null
      if (options.method === "POST") {
        if (isPlainObject(options.body)) {
          body = JSON.stringify(options.body)
          xhr.setRequestHeader("Content-Type", "application/json")
        } else {
          body = options.body
        }
      }
      // 设置响应数据类型（只支持 JSON）
      xhr.responseType = "text"
      xhr.send(body)
      xhr.onreadystatechange = function() {
        if (this.readyState === XMLHttpRequest.DONE) {
          const headers = formatResponseHeaders(this.getAllResponseHeaders())
          const response = {
            data: this.response,
            status: this.status,
            statusText: this.statusText,
            headers
          }
          if (!this.response && this.responseText) {
            response.data = this.responseText
          }
          // // try parse json
          try {
            response.data = JSON.parse(response.data)
          } catch (err) {
            // do nothing
          }
          resolve(response)
        }
      }
    })
  }
}
