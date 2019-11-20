import http from "http"
import IHttpClient from "./IHttpClient"
import { IRequest, IResponse } from "../types"
import { isPlainObject, serializeSearch, isString, stringTable } from "../utils"

export default class NodeHttpClient implements IHttpClient {
  request(options: IRequest): Promise<IResponse> {
    return new Promise((resolve, reject) => {
      let body: string | Buffer = ""
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
      } else if (isString(options.body)) {
        body = options.body
      } else {
        body = ""
      }

      let _data
      const clientRequest = http.request(
        options.fullUrl,
        {
          method: options.method,
          headers: {
            ...options.headers,
            // 设置该请求头后会禁用默认的分块编码
            "Content-Length": Buffer.byteLength(body)
          },
          timeout: options.timeout
        },
        res => {
          res.setEncoding("utf8")
          res.on("data", chunk => {
            _data = chunk
          })
          res.on("end", () => {
            if (options.responseType === "json") {
              try {
                _data = JSON.parse(_data)
              } catch (error) {
                __DEV__ && console.warn(`parse json data failed. origin data: "${_data}"`, error)
                _data = null
              }
            }
            const _response = {
              data: _data,
              status: res.statusCode!,
              statusText: res.statusMessage!,
              headers: res.headers
            }
            resolve(_response)
          })
        }
      )

      clientRequest.on("abort", () => [reject(new Error(stringTable.ABORT))])

      clientRequest.on("error", error => {
        // 如果连接错误， error 为空
        // 如果请求成功前，调用 abort 终止请求则 error 为非空，这种情况交由'abort'事件监听程序处理，这里不作处理
        if (!error) {
          reject(new Error(stringTable.NETWORK_ERROR))
        }
      })

      clientRequest.on("timeout", () => {
        reject(new Error(stringTable.TIMEOUT))
      })

      clientRequest.write(body)
      clientRequest.end()
    })
  }
}
