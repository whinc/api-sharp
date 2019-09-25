import { ApiSharp, WebXhrClient } from "../../src"

// 设置为 any 类型，避开 TS 的类型检查，模拟 JS 调用
const apiSharp = new ApiSharp({ enableLog: false, httpClient: new WebXhrClient(), withCredentials: false })

const baseURL = "http://localhost:4000"

describe("测试 XMLHttpRequest 请求", () => {
  test("请求 json 数据", async () => {
    debugger
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
})
