import { ApiDescriptor, HttpMethod, ProcessedApiDescriptor, ApiResponse, HttpHeader, Transformer, LogFormatter, Params } from "./types";
import { identity } from "./utils";
import { ExpireCache } from "./cache";
import { IHttpClient, IResponse, WebXhrClient } from "./http_client";
export interface ApiSharpOptions {
    httpClient?: IHttpClient;
    baseURL?: string;
    method?: HttpMethod;
    headers?: HttpHeader;
    paramsTransformer?: Transformer<Params>;
    returnsTransformer?: Transformer<any>;
    enableCache?: boolean;
    cacheTime?: number;
    enableRetry?: boolean;
    retryTimes?: number;
    timeout?: number;
    enableLog?: boolean;
    logFormatter?: LogFormatter;
}
export declare class ApiSharpRequestError extends Error {
    api?: ProcessedApiDescriptor | undefined;
    constructor(message?: string, api?: ProcessedApiDescriptor | undefined);
}
export declare const defaultConfig: {
    httpClient: WebXhrClient;
    cache: ExpireCache<Promise<IResponse<any>>>;
    url: string;
    baseURL: string;
    headers: {};
    enableMock: boolean;
    mockData: undefined;
    method: string;
    params: {};
    description: string;
    enableCache: boolean;
    cacheTime: number;
    paramsTransformer: typeof identity;
    returnsTransformer: typeof identity;
    enableRetry: boolean;
    retryTimes: number;
    timeout: number;
    enableLog: boolean;
    logFormatter: {
        logRequest: (api: ProcessedApiDescriptor) => void;
        logResponse: (api: ProcessedApiDescriptor, data: any) => void;
        logResponseError: (_error: Error, api: ProcessedApiDescriptor, data: any) => void;
        logResponseCache: (api: ProcessedApiDescriptor, data: any) => void;
    };
};
export declare class ApiSharp {
    private readonly httpClient;
    private readonly cache;
    private readonly baseURL;
    private readonly method;
    private readonly headers;
    private readonly paramsTransformer;
    private readonly returnsTransformer;
    private readonly enableCache;
    private readonly cacheTime;
    private readonly enableRetry;
    private readonly retryTimes;
    private readonly timeout;
    private readonly enableLog;
    private readonly logFormatter;
    constructor(options?: ApiSharpOptions);
    /**
     * 发送请求
     */
    request<T>(_api: ApiDescriptor | string): Promise<ApiResponse<T>>;
    /**
     * 清除全部缓存
     */
    clearCache(): void;
    private sendRequest;
    private generateCachedKey;
    private processApi;
    protected checkResponseData(data: any): {
        success: boolean;
        errMsg?: string;
    };
    private logRequest;
    private logResponse;
    private logResponseError;
    private logResponseCache;
}
