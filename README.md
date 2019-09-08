# ApiSharp

ApiSharp 是一个声明式、可配置、可扩展、面向业务的 API 接口请求库。

![npm](https://img.shields.io/npm/v/api-sharp) ![CircleCI](https://circleci.com/gh/whinc/api-sharp/tree/master.svg?style=svg&circle-token=53761af868327e3798c609f9ceed6b5690147827)

支持的特性:

- 声明式的接口定义
- 支持基本请求配置
  - baseURL
  - url
  - method
  - headers
  - params
  - description
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
