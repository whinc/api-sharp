import { HttpHeader } from 'http_client/IHttpClient'

export function isString(v: any): v is string {
  return typeof v === "string"
}

export function isFunction(v: any): v is Function {
  return typeof v === "function"
}

export function isUndefined(v: any): v is undefined {
  return v === undefined
}

export function isNumber(v: any): v is number {
  return typeof v === "number"
}

export function isObject(v: any): v is Object {
  return v !== null && typeof v === "object"
}

export function isPlainObject(v: any): v is Object {
  return v !== null && typeof v === "object" && v.__proto__ === Object.prototype
}

export function invariant (condition, message) {
  if (condition) return
  if (__DEV__) {
    throw new Error(message)
  }
}

export function warning (condition, message) {
  if (condition) return
  if (__DEV__) {
    console.warn(message)
  }
}

export function identity<T>(v: T): T {
  return v
}

export function encodeQuery(query: Object): string {
  if (!isPlainObject(query)) return query
  return Object.keys(query).reduce((q, k) => {
    return (q ? q + "&" : q) + (encodeURIComponent(k) + "=" + encodeURIComponent(query[k]))
  }, "")
}

export function formatFullUrl(baseURL, url, query) {
  const queryString = encodeQuery(query)
  return baseURL + url + (queryString ? "?" + queryString : "")
}

export function formatResponseHeaders(headers: string): HttpHeader {
  var arr = headers.trim().split(/[\r\n]+/)
  var headerMap = {}

  arr.forEach(function(line) {
    let parts = line.split(": ")
    let header = parts.shift()
    let value = parts.join(": ")
    headerMap[header!] = value
  })
  return headerMap
}

/**
 * 对对象进行深度排序
 *
 * 如果是数组，转换为字符串后，按字母序排序
 * 如果是对象，按 key 进行字母排序
 *
 * @param {any} value
 */
export function getSortedString(value: any): string {
  let str = ""
  if (Array.isArray(value)) {
    str = "[" + [...value].sort().map(getSortedString) + "]"
  } else if (typeof value === "object") {
    str = Object.keys(value)
      .sort()
      .reduce((str, key, index, arr) => {
        str += `${key}:${value[key]}`
        if (index !== arr.length - 1) {
          str += ","
        } else {
          str += "}"
        }
        return str
      }, "{")
  } else {
    str = String(value)
  }
  return str
}