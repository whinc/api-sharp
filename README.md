<h1 align="center">Api Sharp</h1>

<div align="center">
<p>

[![npm](https://img.shields.io/npm/v/api-sharp)](https://www.npmjs.com/package/api-sharp) ![](https://img.shields.io/bundlephobia/minzip/api-sharp) ![](https://img.shields.io/npm/dt/api-sharp) [![CircleCI](https://img.shields.io/circleci/build/github/whinc/api-sharp/master?token=53761af868327e3798c609f9ceed6b5690147827)](https://circleci.com/dashboard)
</p>

<p>
基于 Promise 的跨平台的 HTTP 客户端。
</p>

</div>

## 特性

- 浏览器使用 [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest) 请求
- node.js 使用 [http](https://nodejs.org/api/http.html) 模块请求（TODO）
- 支持自定义请求实现（可扩展支持 React Native、小程序等环境）
- 支持 [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) 接口
- 完善的 [TypeScript](http://www.typescriptlang.org/docs/home.html) 类型
- 转换请求和响应数据
- 自动解析 JSON 数据
- 设置请求超时
- 请求数据类型运行时校验（基于[prop-types](https://github.com/facebook/prop-types)，仅开发环境检查，不影响 production 构建包的大小和性能）
- 缓存接口数据
- 模拟接口数据
- 失败自动重试
- 自定义日志

![Chrome](https://raw.github.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png) | ![Firefox](https://raw.github.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png) | ![Safari](https://raw.github.com/alrra/browser-logos/master/src/safari/safari_48x48.png) | ![Opera](https://raw.github.com/alrra/browser-logos/master/src/opera/opera_48x48.png) | ![Edge](https://raw.github.com/alrra/browser-logos/master/src/edge/edge_48x48.png) | ![IE](https://raw.github.com/alrra/browser-logos/master/src/archive/internet-explorer_9-11/internet-explorer_9-11_48x48.png) |
--- | --- | --- | --- | --- | --- |
Latest ✔ | Latest ✔ | Latest ✔ | Latest ✔ | Latest ✔ | 11 ✔ |

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

创建 ApiSharp 实例

```js
import {ApiSharp} from "api-sharp"

// 创建实例，可以传入全局配置，省略使用默认配置
const apiSharp = new ApiSharp({...})
```

发送 GET 请求
```js
// 请求服务器时间
apiSharp.request({ url: "/json/server_date" }).then(response => {
  console.log(response)
}, err => {
  console.error(response)
})

// 使用 async/await
const response = await apiSharp.request({ url: "/json/server_date" })
```

发送 POST 请求
```js
const response = await apiSharp.request({
  url: "/json/server_date",
  method: "POST",
  params: {
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
  paramsType: {
    name: PropTypes.string.isRequired
  },
  params: {
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

在线示例

[![Edit api-sharp demo](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/api-sharp-demo-rw1n3?expanddevtools=1&fontsize=14&module=%2Fsrc%2Findex.js)

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
   * 默认`{}`
   * 
   * 例如：`{"Content-Type": "application/json"}`
   */
  headers?: HttpHeader
  /**
   * 接口描述
   * 
   * 默认`""`
   */
  description?: string | ReturnTypeFn<string>
  /**
   * 请求参数
   * 
   * 最终发送给服务器的数据是 string 类型，数据转换规则如下：
   * - 对于 GET 请求，数据转换成 query string（encodeURIComponent(k)=encodeURIComponent(v)&encodeURIComponent(k)=encodeURIComponent(v)...）
   * - 对于 POST 请求，会对数据进行 JSON 序列化
   * 
   * 例如：`{id: 100}`
   */
  params?: Params
  /**
   * 请求参数类型
   * 
   * 支持 PropType 类型，类型不符时控制台输出错误提示（但不影响接口继续请求），仅在`process.env.NODE_ENV !== 'production'`时有效，生产环境不会引入 prop-types 包
   * 
   * 例如：`{ id: PropTypes.number.isRequired }`
   */
  paramsType?: ParamsType
  /**
   * 转换请求参数
   * 
   * 用户发起调用 -> params(原始参数) -> transformRequest(参数转换) -> paramsType(类型校验) -> 发出 HTTP 请求
   * 
   * 例如：`(params) => ({...params, name: 'abc'})`
   */
  transformRequest?: Transformer<Params>
  /**
   * 转换响应数据
   * 
   * 接收 HTTP 响应 -> data(返回数据) -> transformResponse(数据转换) -> 用户接收结果
   * 
   * 例如：`(data) => ({...data, errMsg: 'errCode: ' + data.errCode})`
   *
   */
  transformResponse?: Transformer<any>
  /**
   * 开启缓存
   * 
   * 并发请求相同接口且参数相同时，实际只会发出一个请求，因为缓存的是请求的 Promise
   * 
   * 默认`false`
   */
  enableCache?: boolean | ReturnTypeFn<boolean>
  /**
   * 缓存持续时间，单位毫秒
   * 
   * 下次取缓存时，如果缓存已存在的的时间超过该值，则对应缓存失效
   * 
   * 默认 `5*60*1000`ms 
   */
  cacheTime?: number | ReturnTypeFn<number>
  /**
   * 开启接口数据模拟
   * 
   * 默认`false`
   */
  enableMock?: boolean | ReturnTypeFn<boolean>
  /**
   * 模拟的接口数据
   * 
   * 默认`undefined`
   * 
   * 例如：`{id: 1, name: 'jim'}`
   */
  mockData?: any | ReturnTypeFn<any>
  /**
   * 开启失败重试
   * 
   * 默认`false`
   */
  enableRetry?: boolean | ReturnTypeFn<boolean>
  /**
   * 重试最大次数
   * 
   * 默认`1`
   */
  retryTimes?: number | ReturnTypeFn<number>
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
  enableLog?: boolean | ReturnTypeFn<boolean>
  /**
   * 格式化日志
   */
  logFormatter?: LogFormatter
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
