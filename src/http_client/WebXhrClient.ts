import {
  formatResponseHeaders,
  isPlainObject,
  serializeSearch,
  isFormData,
  stringTable
} from "../utils"
import { IHttpClient } from "../types"
import { IResponse, IRequest } from "../types"

export interface WebXhrRequest extends IRequest {
  withCredentials?: boolean
}

export class WebXhrClient implements IHttpClient {
  request(options: WebXhrRequest): Promise<IResponse> {
    return new Promise((resolve, reject) => {
      // 暂存返回数据
      let _response: IResponse
      const xhr = new XMLHttpRequest()
      xhr.open(options.method, options.fullUrl, true)

      // 设置凭证
      xhr.withCredentials = options.withCredentials || false

      // 设置超时
      xhr.timeout = options.timeout

      // 转换数据
      // let body: Document | BodyInit | null = null
      let body: string | FormData | null = null
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
          body = options.body as any
        }
      }

      // 设置请求头
      Object.keys(options.headers).forEach(key => xhr.setRequestHeader(key, options.headers[key]))

      // 设置响应类型
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
          // 保存响应结果，待 XHR 结束后返回
          _response = response
        }
      }
      xhr.onload = function() {
        resolve(_response)
      }
      xhr.onabort = function() {
        reject(new Error(stringTable.ABORT))
      }
      xhr.ontimeout = function() {
        reject(new Error(stringTable.TIMEOUT))
      }
      xhr.onerror = function() {
        reject(new Error(stringTable.NETWORK_ERROR))
      }
      try {
        xhr.send(body)
      } catch (err) {
        reject(err)
      }
    })
  }
}
