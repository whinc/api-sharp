import { HttpHeader } from "./types";
export declare function isString(v: any): v is string;
export declare function isFunction(v: any): v is Function;
export declare function isUndefined(v: any): v is undefined;
export declare function isNumber(v: any): v is number;
export declare function isObject(v: any): v is Object;
export declare function isPlainObject(v: any): v is Object;
export declare function identity<T>(v: T): T;
export declare function getDefault(...args: any[]): any;
export declare function encodeQuery(query: Object): string;
export declare function formatFullUrl(baseURL: any, url: any, query: any): string;
export declare function formatResponseHeaders(headers: string): HttpHeader;
/**
 * 对对象进行深度排序
 *
 * 如果是数组，转换为字符串后，按字母序排序
 * 如果是对象，按 key 进行字母排序
 *
 * @param {any} value
 */
export declare function getSortedString(value: any): string;
