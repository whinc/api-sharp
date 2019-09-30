import http from 'http'
import IHttpClient, { IResponse, IRequest, HttpHeader } from "./IHttpClient"
import {isPlainObject, serializeSearch, isString} from '../utils'

export default class NodeHttpClient implements IHttpClient {
  request<T>(options: IRequest): Promise<IResponse<T>> {
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
        body = ''
      }

      let _data
      const clientRequest = http.request(options.url, {
        method: options.method,
        headers: {
          ...options.headers,
          // 设置该请求头后会禁用默认的分块编码
          'Content-Length': Buffer.byteLength(body)
        }
      }, res => {
        res.setEncoding('utf8')
        res.on('data', chunk => {
          _data = chunk
        })
        res.on('end', () => {
          if (options.responseType === 'json') {
            try {
              _data = JSON.parse(_data)
            } catch (error) {
              __DEV__ && console.warn(options.responseType, error)
              _data = null
            }
          }
          const _response = {
            data: _data,
            status: res.statusCode!,
            statusText: res.statusMessage!,
            headers: res.headers as HttpHeader
          }
          resolve(_response)
        })
      })

      clientRequest.on('error', error => {
        reject(error)
      })

      clientRequest.write(body)
      clientRequest.end()
    })
  }
}