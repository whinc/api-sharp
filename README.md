<h1 align="center">api-sharp</h1>

<div align="center">
<p>

[![npm](https://img.shields.io/npm/v/api-sharp)](https://www.npmjs.com/package/api-sharp) ![](https://img.shields.io/bundlephobia/minzip/api-sharp) ![](https://img.shields.io/npm/dt/api-sharp) [![CircleCI](https://img.shields.io/circleci/build/github/whinc/api-sharp/master?token=53761af868327e3798c609f9ceed6b5690147827)](https://circleci.com/dashboard)

</p>

<p>
可自定义的、基于配置的、跨平台的 javascript HTTP 客户端。
</p>

</div>

## 特性

- 浏览器使用 [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) 请求
- node.js 使用 [http](https://nodejs.org/api/http.html) 请求（TODO）
- 支持自定义 HTTP 客户端实现，可扩展到更多 JS 运行时环境（如 React Native、小程序等）
- 转换请求响应数据
- 自动解析 JSON 数据
- 设置请求超时
- 运行时请求数据类型检查
- 缓存接口数据
- 支持自定义缓存（内存缓存、持久化存储缓存等）
- 模拟接口数据
- 失败自动重试
- 自定义日志
- 支持 [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) 接口
- 支持 [TypeScript](http://www.typescriptlang.org/docs/home.html)

> 运行时类型检查基于[prop-types](https://github.com/facebook/prop-types)，仅在开发环境下会进行检查，不影响 production 环境构建包的大小和性能

| ![Chrome](https://raw.github.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png) | ![Firefox](https://raw.github.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png) | ![Safari](https://raw.github.com/alrra/browser-logos/master/src/safari/safari_48x48.png) | ![Opera](https://raw.github.com/alrra/browser-logos/master/src/opera/opera_48x48.png) | ![Edge](https://raw.github.com/alrra/browser-logos/master/src/edge/edge_48x48.png) | ![IE](https://raw.github.com/alrra/browser-logos/master/src/archive/internet-explorer_9-11/internet-explorer_9-11_48x48.png) |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Latest ✔                                                                                 | Latest ✔                                                                                    | Latest ✔                                                                                 | Latest ✔                                                                              | Latest ✔                                                                           | 11 ✔                                                                                                                         |

## 安装

使用 npm 安装

```bash
$ npm install api-sharp
```

使用 yarn 安装

```bash
$ yarn add api-sharp
```

## 示例

[![Edit api-sharp demo](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/api-sharp-demo-rw1n3?expanddevtools=1&fontsize=14&module=%2Fsrc%2Findex.js)

创建 ApiSharp 实例

```js
import {ApiSharp} from "api-sharp"

// 创建实例，可以传入全局配置，省略使用默认配置
const apiSharp = new ApiSharp({...})
```

发送 GET 请求

```js
// 请求服务器时间
const response = await apiSharp.request({ url: "/json/server_date" })
console.log(response)
// {
//   "data": {
//     "timestamp": 1569685733048
//   },
//   "from": "network",
//   "api": {
//     "url": "/json/server_date",
//     "method": "GET",
//     ...
//   },
//   "status": 200,
//   "statusText": "OK",
//   "headers": {
//     "content-type": "application/json",
//     "content-length": "27"
//   }
// }
```

发送 POST 请求

```js
const response = await apiSharp.request({
  url: "/json/server_date",
  method: "POST",
  body: {
    format: "json"
  }
})
```

开启缓存（仅支持 GET 请求）

```js
const apiDescriptor = {
  url: "/json/server_date",
  enableCache: true,
  cacheTime: 10 * 1000
}
const response1 = await apiSharp.request(apiDescriptor)
const response2 = await apiSharp.request(apiDescriptor)
expect(response1.from).toEqual("network")
expect(response2.from).toEqual("cache")
expect(response1.data).toEqual(response2.data)
```

开启参数类型校验

```js
// 引入 prop-types
import PropTypes from "prop-types"

const response = await apiSharp.request({
  url: "/json/server_date",
  queryPropTypes: {
    name: PropTypes.string.isRequired
  },
  query: {
    name: "jim"
  }
})
// 如果参数 name 省略或者不是 string 类型，控制台打印错误提示，但不会阻止请求发出
```

开启接口数据 mock

```js
const response = await apiSharp.request({
  url: "/json/server_date",
  enableMock: true,
  mockData: "mock data"
})
expect(response.data).toEqual("mock data")
```

开启失败重试

```js
const response = await apiSharp.request({
  url: "/json/server_date",
  enableRetry: true,
  retryTimes: 3
})
```

## api-sharp API

`ApiSharp`实例方法

```typescript
class ApiSharp {
  request(url: string): Promise<IResponse>
  request(api: ApiDescriptor): Promise<IResponse>
}
```

请求方法支持的接口配置项

```typescript
export type ApiDescriptor = CommonApiDescriptor & WebXhrApiDescriptor

interface CommonApiDescriptor {
  /**
   * 请求地址
   *
   * 支持相对地址（如`"/a/b/c"`）和绝对地址（如`"http://xyz.com/a/b/c"`）
   */
  url: string
  /**
   * 基地址
   *
   * 默认`""`
   *
   * 例如：`'http://xyz.com'`, `'http://xyz.com/a/b'`
   */
  baseURL?: string
  /**
   * HTTP 请求方法
   *
   * 支持 `"GET" | "POST"`
   *
   * 默认`"GET"`
   */
  method?: HttpMethod
  /**
   * HTTP 请求头
   *
   * 如果设置了全局 headers，接口中的 headers 将于全局 headers 合并，且接口中的 header 优先级更高
   *
   * 默认`{"Content-Type": "application/json"}`
   */
  headers?: HttpHeader
  /**
   * 接口描述
   *
   * 默认`""`
   */
  description?: string
  /**
   * 请求 URL 中的查询参数
   *
   * 对象会转换成 URL 查询字符串并拼接在 URL 后面，转换规则：encodeURIComponent(k1)=encodeURIComponent(v1)&encodeURIComponent(k2)=encodeURIComponent(v2)...
   *
   * 例如：`{a: 1, b: 2}`会转换成`"a=1&b=2"`
   */
  query?: QueryType
  /**
   * 请求 URL 中的查询参数类型
   *
   * 仅当 query 为`Object`类型且`process.env.NODE_ENV !== 'production'`时执行检查
   *
   * 例如：`{ id: PropTypes.number.isRequired }`
   */
  queryPropTypes?: { [key: string]: Validator<any> } | null
  /**
   * 请求体中的数据
   *
   * 仅支持 POST 请求，数据会转换成字符串传输，转换规则由请求头`Content-Type`决定：
   * 请求头包含`Content-Type: application/json`时，数据序列化为 JSON 字符串
   *
   * 例如：`{a: 1, b: 2}`
   */
  body?: BodyType
  /**
   * 传入的`body`的数据类型
   *
   * 仅当 body 为`Object`类型且`process.env.NODE_ENV !== 'production'`时执行类型检查，类型检查时机发生在使用`transformRequest`进行数据转换之前
   *
   * 例如：`{ id: PropTypes.number.isRequired }`
   */
  bodyPropTypes?: { [key: string]: Validator<any> } | null
  /**
   * 响应的数据类型
   *
   * 支持类型如下：
   *
   * `"text"`：返回字符串
   * `"json"`：返回`JSON.parse()`后的结果，如果解析失败返回`null`
   *
   * 默认`"json"`
   */
  responseType?: ResponseType
  /**
   * 转换请求数据
   */
  transformRequest?: (body: BodyType, headers: Object) => any
  /**
   * 检查响应数据是否有效
   *
   * 检查函数返回 true 表示成功，返回 false 表示失败（失败信息为 HTTP 状态码描述)，返回 Error 也表示失败（失败信息为 Error 中的错误消息）
   *
   * 默认：`(res) => res.status >= 200 && res.status < 300`
   */
  validateResponse?: (res: IResponse) => boolean | Error
  /**
   * 转换响应数据
   */
  transformResponse?: (data: any) => any
  /**
   * 开启缓存
   *
   * 并发请求相同接口且参数相同时，实际只会发出一个请求，因为缓存的是请求的 Promise
   *
   * 默认`false`
   */
  enableCache?: boolean
  /**
   * 缓存持续时间，单位毫秒
   *
   * 下次取缓存时，如果缓存已存在的的时间超过该值，则对应缓存失效
   *
   * 默认 `5*60*1000`ms
   */
  cacheTime?: number
  /**
   * 开启接口数据模拟
   *
   * 默认`false`
   */
  enableMock?: boolean
  /**
   * 模拟的接口数据
   *
   * 默认`undefined`
   *
   * 例如：`{id: 1, name: 'jim'}`
   */
  mockData?: any
  /**
   * 开启失败重试
   *
   * 默认`false`
   */
  enableRetry?: boolean
  /**
   * 重试最大次数
   *
   * 默认`1`
   */
  retryTimes?: number
  /**
   * 接口超时时间，单位毫秒
   *
   * 从发出请求起，如果 timeout 毫秒后接口未返回，接口调用失败。
   *
   * 默认`60*1000`ms
   */
  timeout?: number
  /**
   * 开启控制台日志
   *
   * 默认为`process.env.NODE_ENV !== "production"`
   */
  enableLog?: boolean
  /**
   * 格式化日志
   */
  formatLog?: (type: LogType, api: ProcessedApiDescriptor, data?: any) => void
}

interface WebXhrApiDescriptor {
  /**
   * 跨域请求时是否带上用户信息（如Cookie和认证的HTTP头）
   *
   * 默认`false`
   */
  withCredentials?: boolean
}
```

请求返回的数据结构

```typescript
export interface IResponse<T = any> {
  // HTTP 响应状态码
  status: number
  // HTTP 响应状态描述
  statusText: string
  // HTTP 响应数据
  data: T
  // HTTP 响应头
  headers: HttpHeader
  // 本次请求响应数据的来源
  from: "network" | "cache" | "mock"
  // 本次请求的接口描述符
  api: ProcessedApiDescriptor
}
```

## 更新日志

[CHANGELOG](./CHANGELOG.md)

## 参与共建

克隆项目后，切换到项目根目录下，并安装依赖

```bash
$ git clone <path_to_project>
$ cd <path_to_project>
$ npm install
```

下面两条指令分别启动 node API 服务和 jest 测试

```bash
$ npm run server
$ npm run test:watch
```

执行后便可以在`src`目录下修改源码，在`test`目录编写测试用例进行测试

项目目录结构如下：

```
docs                // 文档
src                 // 源码
  |--cache          // 缓存实现
  |--http_client    // HTTP请求实现
  |--types          // 内部类型定义
test
  |--api_sharp      // 单元测试
  |--server         // 接口测试服务
types               // 全局类型定义
babel.config.js     // babel 配置
package.json        // 包配置
tsconfig.json       // TS 编译配置

```

## LICENSE

[MIT](./LICENSE)
