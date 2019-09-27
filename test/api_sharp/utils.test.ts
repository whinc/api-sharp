import { encodeQuery, formatFullUrl } from "../../src/utils"

describe("测试工具类", () => {
  test("编码查询字符串", () => {
    let query: any = {}
    expect(encodeQuery(query)).toBe("")
    query = { a: 1 }
    expect(encodeQuery(query)).toBe("a=1")
    query = { a: "中国" }
    expect(encodeQuery(query)).toBe("a=" + encodeURIComponent(query.a))
  })
})

describe("测试 formatFullUrl", () => {
  test("拼接基准地址&相对地址", () => {
    let baseURL = "http://test.com"
    let url = "/a"
    expect(formatFullUrl(baseURL, url)).toBe(`${baseURL}${url}`)
  })
  test("拼接基准地址&相对地址&查询参数", () => {
    let baseURL = "http://test.com"
    let url = "/a"
    let query = { c: 1 }
    expect(formatFullUrl(baseURL, url, query)).toBe(`${baseURL}${url}?c=1`)
  })
  test("拼接基准地址&相对地址(带查询串)&查询参数", () => {
    let baseURL = "http://test.com"
    let url = "/a?b=1"
    let query = { c: 2 }
    expect(formatFullUrl(baseURL, url, query)).toBe(`${baseURL}/a?b=1&c=2`)
  })
})
