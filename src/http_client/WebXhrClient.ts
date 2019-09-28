import { formatResponseHeaders, isPlainObject, serializeSearch, isFormData } from "../utils"
import IHttpClient, { IResponse, IRequest } from "./IHttpClient"

export interface WebXhrRequest extends IRequest {
  withCredentials?: boolean
}

export default class WebXhrClient implements IHttpClient {
  request<T>(options: WebXhrRequest): Promise<IResponse<T>> {
    return new Promise((resolve, reject) => {
      // 暂存返回数据
      let _response: IResponse<T>
      const xhr = new XMLHttpRequest()
      xhr.open(options.method, options.url, true)

      // 跨域请求带凭证
      xhr.withCredentials = options.withCredentials || false

      // 转换数据
      let body: Document | BodyInit | null = null
      if (options.method === "POST") {
        if (isPlainObject(options.body)) {
          // 如果是纯 JS 对象，则依据 Content-Type 序列化成字符串
          const contentType = options.headers["Content-Type"]
          if (contentType === "application/json") {
            body = JSON.stringify(options.body)
          } else if (contentType === "application/x-www-form-urlencoded") {
            body = serializeSearch(options.body)
          } else {
            body = String(options.body)
          }
        } else if (isFormData(options.body)) {
          // 如果是表单，让浏览器设置请求 Content-Type
          delete options.headers["Content-Type"]
          body = options.body
        } else {
          // 其他情况透传
          body = options.body
        }
      }

      // 设置请求头
      Object.keys(options.headers).forEach(key => xhr.setRequestHeader(key, options.headers[key]))

      /**
       * 事件触发顺序：readystatechange -> timeout -> loadend
       * 先处理特殊情况，最后再处理一般情况，否则 Promise 被 resolve 后，后续遇到特殊情况时无法修改状态
       * 例如：请求超时后，先触发 readystatechange 事件，后触发 timeout 事件，如果在 readystatechange 监听函数中处理返回
       * 则 timeout 错误就无法返回了，因为 Promise 只能被填充一次。
       */
      // xhr.onloadend = function () {
      //   resolve(_response)
      // }

      // 设置响应数据类型
      xhr.responseType = options.responseType
      xhr.onreadystatechange = function() {
        if (this.readyState === XMLHttpRequest.DONE) {
          const headers = formatResponseHeaders(this.getAllResponseHeaders())
          const response = {
            data: this.response,
            status: this.status,
            statusText: this.statusText,
            headers
          }
          _response = response
          resolve(_response)
        }
      }
      xhr.onabort = function () {
        reject(new Error("Connection is aborted"))
      }
      xhr.ontimeout = function () {
        reject(new Error("Connection timeout"))
      }
      xhr.onerror = function () {
        reject(new Error('Network error'))
      }
      xhr.send(body)
    })
  }
}
