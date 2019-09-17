<h1 align="center">Api Sharp</h1>

<div align="center">
Api Sharp 是一个声明式、可配置、可扩展的 API 接口请求库。从业务开发实践中提炼了常用的配置项，通过简单配置可快速封装适合自身业务的网络请求服务。

<p>

![npm](https://img.shields.io/npm/v/api-sharp)
![](https://img.shields.io/bundlephobia/minzip/api-sharp)
![](https://img.shields.io/npm/dt/api-sharp)
![CircleCI](https://img.shields.io/circleci/build/github/whinc/api-sharp/master?token=53761af868327e3798c609f9ceed6b5690147827)

</p>

</div>

## 特性

- 简单，只有一个`request()`方法
- 声明式，通过 JS 对象描述接口
- 接口配置丰富
  - 请求基地址
  - 请求地址
  - 请求方法
  - 请求 HTTP 头
  - 接口描述
  - 超时设置
  - 请求参数校验
  - 请求参数转换
  - 响应数据转换
  - 缓存
  - 数据 mock
  - 失败重试
  - 自定义日志
- 支持`d.ts`类型定义

## 安装

通过 npm 安装（或者 yarn）

```bash
$ npm install api-sharp
```

> 注意：当前版本的 ApiSharp 依赖于 axios，需要在项目中先引入 axios。后续版本会移除对 axios 的依赖。

## 示例

创建 ApiSharp 实例

```js
import ApiSharp from "api-sharp"

// 创建实例，可以传入全局配置，省略使用默认配置
const apiSharp = new ApiSharp(/* options */)
```

发送 GET 请求

```js
apiSharp.request({
  baseURL: "https://api-mock-ti6c29r88wgm.runkit.sh",
  url: "/json/server_date",
  method: "GET",
  description: "服务器时间(JSON)",
  params: {
    format: "json"
  }
})
```

发送 POST 请求

```js
apiSharp.request({
  baseURL: "https://api-mock-ti6c29r88wgm.runkit.sh",
  url: "/json/server_date",
  method: "POST",
  description: "服务器时间(JSON)",
  params: {
    format: "json"
  }
})
```

在线示例

[![Edit api-sharp demo](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/api-sharp-demo-rw1n3?expanddevtools=1&fontsize=14&module=%2Fsrc%2Findex.js)

## 文档

ApiSharp 暴露了一个 request 方法，通过该方法完成所有网络请求任务。

```typescript
/**
 * 请求接口数据
 * @params api - 接口描述对象
 * @returns - 包含响应结果的 Promise 对象
 */
async request(api: ApiDescriptor): Promise<ApiSharpResponse>
```

接口描述对象支持的配置项如下：

```typescript
export interface ApiDescriptor {
  /**
   * 请求的 HTTP 地址，支持相对地址和绝对地址
   * 如果是相对地址时，以 baseURL 作为基地址，计算最终地址
   * 如果是绝对地址，则忽略 baseURL，以该地址作为最终地址
   */
  url: string
  /**
   * 基地址
   */
  baseURL?: string
  /**
   * HTTP 请求方法，默认为 GET 方法
   */
  method?: HttpMethod
  /**
   * HTTP 请求头
   */
  headers?: HttpHeader
  /**
   * 接口描述
   */
  description?: string | ReturnTypeFn<string>
  /**
   * 请求参数
   * GET 请求时，对象的键值对编码后作为 URL 后的查询字符串
   * POST 请求时，对象转换为 JSON 格式后作为 HTTP 的 body
   */
  params?: Params
  /**
   * 请求参数类型
   * 对请求参数 params 进行类型校验并打印警告，仅在 process.env.NODE_ENV !== 'production' 时生效，生产环境不会增加额外的包体积大小
   */
  paramsType?: ParamsType
  /**
   * 请求参数转换函数
   * 用户发起调用 -> params(原始参数) -> paramsTransformer(参数转换) -> paramsType(类型校验) -> 发出 HTTP 请求
   */
  paramsTransformer?: Transformer<Params>
  /**
   * 返回数据转换函数
   * 接收 HTTP 响应 -> returns(返回数据) -> returnsTransformer(数据转换) -> 用户接收结果
   */
  returnsTransformer?: Transformer<any>
  /**
   * 开启缓存，默认关闭
   * 并发请求相同接口且参数相同时，实际只会发出一个请求，因为缓存的是请求的 Promise。
   */
  enableCache?: boolean | ReturnTypeFn<boolean>
  /**
   * 缓存持续时间(单位毫秒)，默认 5 分钟
   * 下次取缓存时，如果缓存已存在的的时间超过该值，则对应缓存失效
   */
  cacheTime?: number | ReturnTypeFn<number>
  /**
   * 开启数据模拟，默认关闭
   */
  enableMock?: boolean | ReturnTypeFn<boolean>
  /**
   * 模拟接口返回的数据，默认 undefined
   */
  mockData?: any | ReturnTypeFn<any>
  /**
   * 开启失败重试，默认关闭
   */
  enableRetry?: boolean | ReturnTypeFn<boolean>
  /**
   * 重试最大次数，默认 1 次
   */
  retryTimes?: number | ReturnTypeFn<number>
  /**
   * 接口超时时间，单位毫秒，默认 60*1000 ms
   * 从发出请求起，如果 timeout 毫秒后接口未返回，接口调用失败。
   */
  timeout?: number
  /**
   * 开启打印日志，默认为 process.env.NODE_ENV !== "production"
   */
  enableLog?: boolean | ReturnTypeFn<boolean>
  /**
   * 日志格式化
   */
  logFormatter?: LogFormatter

  /**
   * 其他用户自定义信息
   * 这些信息会被保留下来
   */
  [name: string]: any
}
```

## 设计

api-sharp 主要针对 Web 浏览器，不过它被设计成平台无关的，通过适配器可以很方便的支持新平台。

api-sharp 的架构图。

![](arch.png)

api-sharp 的类图。

![](class.svg)

## 共建

非常欢迎提 issue 或 PR 来一起改进该项目，下面是一份上手指南。

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

## LICENSE

[MIT](./LICENSE)
