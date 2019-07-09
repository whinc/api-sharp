import {ApiSharp, Endpoint} from '../src/ApiSharp'

const apiSharp = new ApiSharp()

// const cgi = {}
// const params = {}
// apiSharp.request(cgi, params).then(data => {}, err => {})

describe('测试 EndPoint 配置', () => {
  test('参数处理 EndPoint 配置', async () => {
    const endpoint: Endpoint = {
      baseUrl: 'http://localhost:4000/',
      url: 'posts',
    }
    const newEndPoint = apiSharp.preprocessEndpoint(endpoint)
    expect(newEndPoint.baseUrl).toBe('http://localhost:4000')
    expect(newEndPoint.url).toBe('/posts')
    expect(newEndPoint.method).toBe('GET')
  })
})
