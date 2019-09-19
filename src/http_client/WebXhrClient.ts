import { formatFullUrl, formatResponseHeaders, isPlainObject } from "../utils"
import { IHttpClient, IRequest, IResponse } from "./IHttpClient"

export default class WebXhrClient implements IHttpClient {
  request<T>(options: IRequest): Promise<IResponse<T>> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      const fullUrl = formatFullUrl(options.baseURL, options.url, options.query)

      // 暂存返回数据
      let _response: IResponse<T>

      /** 请求超时处理 */
      xhr.timeout = options.timeout
      xhr.ontimeout = function () {
        reject(new Error(`请求超时(${options.timeout})`))
      }

      /**
       * 事件触发顺序：readystatechange -> timeout -> loadend
       * 先处理特殊情况，最后再处理一般情况，否则 Promise 被 resolve 后，后续遇到特殊情况时无法修改状态
       * 例如：请求超时后，先触发 readystatechange 事件，后触发 timeout 事件，如果在 readystatechange 监听函数中处理返回
       * 则 timeout 错误就无法返回了，因为 Promise 只能被填充一次。
       */
      xhr.onloadend = function () {
        resolve(_response)
      }

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
          _response = response
        }
      }
    })
  }
}
