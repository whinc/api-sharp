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

export interface ApiDescriptor {
  url: string;
  baseURL?: string;
  method?: HTTPMethod;
  description?: string | ((api: ApiDescriptor) => string);
  params?: Object;
  paramTypes?: Object;
  enableCache?: boolean | ((api: ApiDescriptor) => boolean);
  enableMock?: boolean | ((api: ApiDescriptor) => boolean);
}

export interface PreprocessedApiDescriptor {}
