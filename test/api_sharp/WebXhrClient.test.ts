import { ApiSharp } from "../../src/ApiSharp"
import { WebXhrClient } from "../../src/http_client"

// 设置为 any 类型，避开 TS 的类型检查，模拟 JS 调用
const apiSharp: any = new ApiSharp({ enableLog: false, httpClient: new WebXhrClient() })

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
})
