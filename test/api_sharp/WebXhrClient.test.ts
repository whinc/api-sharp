import { ApiSharp, WebXhrClient } from "../../src"
import { defaultOptions } from "../../src/ApiSharp"

// 设置为 any 类型，避开 TS 的类型检查，模拟 JS 调用
const apiSharp = new ApiSharp({ enableLog: false, httpClient: new WebXhrClient(), withCredentials: false })

const baseURL = "http://localhost:4000"

describe("测试 XMLHttpRequest 请求", () => {
  test("请求 json 数据", async () => {
    const res = await apiSharp.request({
      baseURL,
      url: "/date/json"
    })
    expect(res.data).toHaveProperty("server_date")
  })
  test("请求 text 数据", async () => {
    const res = await apiSharp.request({
      baseURL,
      url: "/date/text"
    })
    expect(res.data).toMatch("server_date")
  })
  // test('测试 withCredentials', async () => { })
  test("测试默认请求头", async () => {
    const res = await apiSharp.request({
      baseURL,
      url: "/echo/headers"
    })
    expect(res.data["content-type"]).toBe(defaultOptions.headers["Content-Type"])
  })

  test("测试默认请求头", async () => {
    const res = await apiSharp.request({
      baseURL,
      url: "/echo/headers"
    })
    expect(res.data["content-type"]).toBe(defaultOptions.headers["Content-Type"])
  })
  test("测试指定请求头", async () => {
    const res = await apiSharp.request({
      baseURL,
      url: "/echo/headers",
      headers: {
        "Content-Type": "text/plain"
      }
    })
    expect(res.data["content-type"]).toBe("text/plain")
  })
  test("测试请求查询参数", async () => {
    const res = await apiSharp.request({
      baseURL,
      url: "/echo/query",
      query: {
        a: 1,
        b: 2
      }
    })
    expect(res.data).toEqual({
      a: "1",
      b: "2"
    })
  })
})
