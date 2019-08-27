import axios, { AxiosStatic, AxiosResponse, AxiosInstance } from 'axios';
import { ApiDescriptor, HTTPMethod } from './ApiDescriptor';
import invariant from 'tiny-invariant';
import { isString, isFunction, getSortedString } from './utils';
import ICache from './ICache';
import ExpireCache from './ExpireCache';

export interface ApiSharpOptions {
  axios?: AxiosStatic;
  cache?: ICache;
}

export class ApiSharp {
  private axios: AxiosInstance;
  private cache: ICache<Promise<AxiosResponse>>;

  constructor(options: ApiSharpOptions = {}) {
    this.axios = options.axios || axios.create();
    this.cache = options.cache || new ExpireCache<Promise<AxiosResponse>>();
  }

  async request(api: ApiDescriptor) {
    api = this.processApi(api);

    this.logRequest(api);

    let requestPromise: Promise<AxiosResponse>;
    let cachedKey;
    let hitCache = false;

    if (api.enableCache) {
      cachedKey = this.generateCachedKey(api);
      if (this.cache.has(cachedKey)) {
        requestPromise = this.cache.get(cachedKey)!;
        hitCache = true;
      } else {
        requestPromise = this.sendRequest(api);
        hitCache = false;
        this.cache.set(cachedKey, requestPromise);
      }
    } else {
      requestPromise = this.sendRequest(api);
    }

    let res: AxiosResponse<any>;
    try {
      res = await requestPromise;
    } catch (err) {
      // 请求失败时删除缓存
      if (api.enableCache) {
        this.cache.delete(cachedKey);
      }
      this.logErrorResponse(api, null);
      // 重新抛出错误
      throw err;
    }

    const checkResult = this.checkResponseData(res.data);
    if (!checkResult.success) {
      if (api.enableCache) {
        this.cache.delete(cachedKey);
      }
      this.logErrorResponse(api, res.data);
      throw new Error(checkResult.errMsg);
    }

    if (hitCache) {
      this.logHitCache(api, res.data);
    } else {
      this.logResponse(api, res.data);
    }

    return res.data;
  }

  private sendRequest(api: ApiDescriptor): Promise<AxiosResponse> {
    return this.axios.request({
      baseURL: api.baseURL,
      url: api.url,
      method: api.method,
      params: api.method === 'GET' ? api.params : {},
      data: api.method === 'POST' ? api.params : {},
    });
  }

  private generateCachedKey(api: ApiDescriptor) {
    return `${api.baseURL}${api.url}:${api.method}:${getSortedString(
      api.params
    )}`;
  }

  public processApi(api: ApiDescriptor): ApiDescriptor {
    const _api = { ...api };
    invariant(api, 'api 为空');
    invariant(isString(api.url), 'api.url 不是字符串类型');
    invariant(api.url, 'api.url 为空字符串');
    invariant(
      api.method === undefined || isString(api.method),
      'api.method 取值无效'
    );
    invariant(
      api.description === undefined ||
        isString(api.description) ||
        isFunction(api.description),
      'api.description 取值无效'
    );

    // 移除首部多余分隔符
    _api.url = api.url.replace(/^\/{2,}/, '/');

    // 移除尾部多余分隔符
    _api.baseURL = (api.baseURL || this.axios.defaults.baseURL || '').replace(
      /\/+$/,
      ''
    );

    if (api.method === undefined) {
      _api.method = 'GET';
    } else {
      _api.method = <HTTPMethod>api.method.toUpperCase();
    }

    // 描述
    if (api.description === undefined) {
      _api.description = '';
    } else if (isFunction(api.description)) {
      _api.description = api.description.call(null, api);
    } else if (isString(api.description)) {
      _api.description = api.description;
    }

    // _cgi.enableCache = utils.isFunction(api.enableCache) ? api.enableCache.call(null, api) : !!api.enableCache

    return _api;
  }

  protected checkResponseData(
    data: any
  ): { success: boolean; errMsg?: string } {
    // return {
    //   success: false,
    //   errMsg: ''
    // }
    return {
      success: !!data,
    };
  }

  private logRequest(api: ApiDescriptor) {
    __DEV__ &&
      console.log(
        `%cRequest %c %c${api.method}|${api.description}|${api.url}%c|%O`,
        'color: white; background-color: rgba(0, 116, 217, 0.69); padding: 2px 5px; border-radius: 2px',
        '',
        'color: #0074D9',
        '',
        api.params
      );
  }

  private logResponse(api: ApiDescriptor, data) {
    __DEV__ &&
      console.log(
        `%cResponse%c %c${api.method}|${api.description}|${api.url}%c|%O|%O`,
        'color: white; background-color: rgba(61, 153, 112, 0.69); padding: 2px 5px; border-radius: 2px',
        '',
        'color: #3D9970',
        '',
        api.params,
        data
      );
  }

  private logErrorResponse(api: ApiDescriptor, data) {
    __DEV__ &&
      console.log(
        `%cResponse%c %c${api.method}|${api.description}|${api.url}%c|%O|%O`,
        'color: white; background-color: rgba(255, 65, 54, 0.69); padding: 2px 5px; border-radius: 2px',
        '',
        'color: #FF4136',
        '',
        api.params,
        data
      );
  }

  private logHitCache(api: ApiDescriptor, data) {
    __DEV__ &&
      console.log(
        `%cResponse Cache %c %c${api.method}|${api.description}|${api.url}%c|%O|%O`,
        'color: white; background-color: rgba(177, 13, 201, 0.69); padding: 2px 5px; border-radius: 2px',
        '',
        'color: #B10DC9',
        '',
        api.params,
        data
      );
  }
}
