# ApiSharp

前端 HTTP 接口请求库，覆盖业务场景中常用的一些功能。

![npm](https://img.shields.io/npm/v/api-sharp)
![CircleCI](https://circleci.com/gh/whinc/api-sharp/tree/master.svg?style=svg&circle-token=53761af868327e3798c609f9ceed6b5690147827)

计划特性：

- 声明式的接口定义
  - description
  - baseURL
  - url
  - method
  - params
- 支持请求参数检验和转换
  - paramsType
  - paramsTransformer
- 支持响应数据检验和转换
  - returnsType
  - returnsTransformer
- 支持数据 mock
  - enableMock
  - mockData
- 支持缓存策略（内存缓存、会话缓存、持久缓存、缓存期限）
  - enableCache
  - cacheTime
  - cacheLocation
- 失败重试
  - enableRetry
  - retryTimes
- 支持自定义输出日志
  - enableLog
  - logFormatter
- 适配多种网络请求库
  - axios
  - xhr
  - fetch
- 支持插件
- 支持导出文档
  - api-sharp-cli
- 提供 DevTools 支持
  - 单独面板展示请求和响应信息

## 贡献

**启动项目**

```
npm install
npm run server
npm run test:watch
```

使用 [json-server](https://github.com/typicode/json-server) 作为模拟 RESTful 接口。
