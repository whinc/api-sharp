# ApiSharp

ApiSharp 是一个声明式、可配置、可扩展的 API 接口请求库。从业务开发实践中提炼了常用的配置项，通过简单配置可快速封装适合自身业务的网络请求服务。

![npm](https://img.shields.io/npm/v/api-sharp)
![](https://img.shields.io/bundlephobia/minzip/api-sharp)
![](https://img.shields.io/npm/dt/api-sharp)
![CircleCI](https://img.shields.io/circleci/build/github/whinc/api-sharp/master?token=53761af868327e3798c609f9ceed6b5690147827)

# 特性

- 声明式的接口定义
- 支持基本请求配置
  - baseURL
  - url
  - method
  - headers
  - params
  - description
  - timeout
- 支持请求参数处理
  - paramTypes
  - paramTransformer
- 支持响应数据处理
  - returnTransformer
- 支持缓存
  - enableCache
  - cacheTime
- 支持数据模拟
  - enableMock
  - mockData
- 支持失败重试
  - enableRetry
  - retryTimes
- 支持自定义日志
  - enableLog
  - logFormatter

## 贡献

**启动项目**

```
npm install
npm run server
npm run test:watch
```

使用 [json-server](https://github.com/typicode/json-server) 作为模拟 RESTful 接口。
