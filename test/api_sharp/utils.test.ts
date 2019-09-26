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

  test("formatFullUrl()", () => {
    let baseURL = "a"
    let url = 'b'
    let query: Object | undefined = {c: 1}
    expect(formatFullUrl(baseURL, url, query)).toBe(`${baseURL}${url}?c=1`)
    query = undefined
    expect(formatFullUrl(baseURL, url, query)).toBe(`${baseURL}${url}`)
  })

  // test("sera")
})
