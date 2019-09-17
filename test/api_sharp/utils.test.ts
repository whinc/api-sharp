import { encodeQuery } from "../../src/utils"

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
