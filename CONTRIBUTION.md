# 参与共建


## 设计思路

架构图

![](./docs/arch.png)

目录结构

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

类继承图

![](./docs/class.png)

## 项目设置

1. 克隆项目，执行`git clone <project_git_address>`
2. 安装依赖，运行`npm install`
3. 创建分支用于提交PR，执行`git checkout -b pr/<your-branch-name>`

## 开发

基于单元测试开发：
1. 启动 node 模拟 API 服务端，执行`npm run test:server`
2. 启动测试，执行`npm run test:watch`
3. 在`src`目录下修改代码，在`test/unit/`目录编写测试用例，在控制台查看输出

基于浏览器运行环境开发：
1. 启动 node 模拟 API 服务端，执行`npm run test:server`
2. 启动测试页面，执行`npm run test:e2e`
3. 在`src`目录下修改代码，在`test/e2e/`下面修改测试网页，在浏览器中查看效果

## 发布

1. 合并代码到 master 分支
2. 推送到远程仓库 master 分支，触发 Github CI 发布工作流