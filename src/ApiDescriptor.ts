export type HTTPMethod =
  | 'get'
  | 'GET'
  | 'delete'
  | 'DELETE'
  | 'head'
  | 'HEAD'
  | 'options'
  | 'OPTIONS'
  | 'post'
  | 'POST'
  | 'put'
  | 'PUT'
  | 'patch'
  | 'PATCH';

export type ReturnTypeFn<T> = (api: ApiDescriptor) => T

export interface ApiDescriptor {
  url: string;
  baseURL?: string;
  method?: HTTPMethod;
  description?: string | ReturnTypeFn<string>
  params?: Object;
  paramTypes?: Object;
  /**
   * 开启缓存，默认关闭
   */
  enableCache?: boolean | ReturnTypeFn<boolean>;
  /**
   * 缓存持续时间(单位毫秒)
   * 下次取缓存时，如果缓存已存在的的时间超过该值，则对应缓存失效
   */
  cacheTime: number | ReturnTypeFn<number>;
  enableMock?: boolean | ReturnTypeFn<boolean>
}

export interface PreprocessedApiDescriptor {}
