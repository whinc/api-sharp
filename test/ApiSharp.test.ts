import axios from 'axios';
import { ApiSharp } from '../src/ApiSharp';
import { ApiDescriptor, HTTPMethod } from '../src/ApiDescriptor';

const apiSharp = new ApiSharp({ axios });
const addPost = post =>
  apiSharp.request({
    url: 'http://localhost:4000/posts/',
    method: 'post',
    params: post,
  });
const deletePost = id =>
  apiSharp.request({
    url: 'http://localhost:4000/posts/' + id,
    method: 'delete',
  });
// const listPost = () => apiSharp.request({
//   url: 'http://localhost:4000/posts/'
// })
const getPosts = id =>
  apiSharp.request({
    url: 'http://localhost:4000/posts/',
    params: {
      id,
    },
  });

let serverData;
beforeAll(async () => {
  serverData = await apiSharp.request({ url: 'http://localhost:4000/db' });
});

describe('测试 ApiSharp.processApi', () => {
  test('测试 api 为空', () => {
    const api = null;
    expect(() => apiSharp.processApi(api!)).toThrow();
  });

  test('测试 api.url 取值', () => {
    const api = { url: '' };
    expect(() => apiSharp.processApi(api)).toThrow();
  });

  test('测试 api.method 取值', () => {
    const api: ApiDescriptor = { url: 'http://www.test.com' };
    const values = [
      [undefined, 'GET'],
      ['GET', 'GET'],
      ['POST', 'POST'],
      ['get', 'GET'],
      ['post', 'POST'],
    ];
    values.forEach(([received, expected]) => {
      api.method = <HTTPMethod>received;
      expect(apiSharp.processApi(api).method).toBe(expected);
    });
  });

  test('测试 api.description 取值', () => {
    const api: ApiDescriptor = { url: 'http://www.test.com' };
    const values = [
      [undefined, ''],
      ['', ''],
      ['hello', 'hello'],
      [() => 'hello', 'hello'],
      [_api => _api.url, api.url],
    ];
    values.forEach(([received, expected]) => {
      api.description = received;
      expect(apiSharp.processApi(api).description).toBe(expected);
    });
  });
});

describe('测试 ApiSharp.request', () => {
  test('GET 请求', async () => {
    const id = 2;
    const data = await getPosts(id);
    const responseData = serverData.posts.find(post => post.id === id);
    expect(data[0]).toEqual(responseData);
  });
  test.only('使用缓存的 GET 请求', async () => {
    const id = 2;
    const [responseData] = await apiSharp.request({
      url: 'http://localhost:4000/posts/',
      enableCache: true,
      params: {
        id,
      },
    });
    const [cachedData] = await apiSharp.request({
      url: 'http://localhost:4000/posts/',
      enableCache: true,
      params: {
        id,
      },
    });
    const dbData = serverData.posts.find(post => post.id === id);
    expect(responseData).toEqual(dbData);
    expect(responseData).toEqual(cachedData);
  });
  test('POST 请求', async () => {
    const now = Date.now();
    const data = await addPost({ title: 'post', author: 'jack', date: now });
    expect(data.date).toBe(now);
    await deletePost(data.id);
  });
});
