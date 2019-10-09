import { HttpHeader, QueryType } from "http_client/IHttpClient"

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

export function isPlainObject(v: any): v is object {
  return v !== null && typeof v === "object" && v.__proto__ === Object.prototype
}

export function isFormData(v) {
  return typeof FormData !== "undefined" && v instanceof FormData
}

export function invariant(condition, message) {
  if (condition) return
  if (__DEV__) {
    throw new Error(message)
  }
}

export function warning(condition, message) {
  if (condition) return
  if (__DEV__) {
    console.warn(message)
  }
}

export function identity<T>(v: T): T {
  return v
}

export function encodeQuery(query: QueryType): string {
  if (!query) return ""
  return Object.keys(query).reduce((q, k) => {
    return (q ? q + "&" : q) + (encodeURIComponent(k) + "=" + encodeURIComponent(query[k]))
  }, "")
}

export function formatFullUrl(baseURL: string, url: string, query?: QueryType): string {
  const queryString = query ? encodeQuery(query) : ""
  let fullUrl = baseURL + url
  if (fullUrl.includes("?")) {
    fullUrl += "&" + queryString
  } else {
    fullUrl += queryString ? "?" + queryString : ""
  }
  return fullUrl
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
  } else if (isPlainObject(value)) {
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

function encode(val: string): string {
  return encodeURIComponent(val)
    .replace(/%40/gi, "@")
    .replace(/%3A/gi, ":")
    .replace(/%24/g, "$")
    .replace(/%2C/gi, ",")
    .replace(/%20/g, "+")
    .replace(/%5B/gi, "[")
    .replace(/%5D/gi, "]")
}

export function serializeSearch(search: object): string {
  let parts: string[] = []
  Object.keys(search).forEach(key => {
    let val = search[key]
    if (val === null || typeof val === "undefined") {
      return
    }

    if (Array.isArray(val)) {
      key = key + "[]"
    } else {
      val = [val]
    }

    val.forEach(v => {
      if (isPlainObject(v)) {
        v = JSON.stringify(v)
      } else {
        v = String(v)
      }
      parts.push(encode(key) + "=" + encode(v))
    })
  })

  return parts.join("&")
}

export const stringTable = {
  TIMEOUT: "Connection timeout",
  ABORT: "Connection is aborted",
  NETWORK_ERROR: "Network error"
}
