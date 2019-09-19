'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var invariant = _interopDefault(require('tiny-invariant'));
var warning = _interopDefault(require('tiny-warning'));
var PropTypes = _interopDefault(require('prop-types'));
var axios = _interopDefault(require('axios'));

function _extends() {
  _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends.apply(this, arguments);
}

function _inheritsLoose(subClass, superClass) {
  subClass.prototype = Object.create(superClass.prototype);
  subClass.prototype.constructor = subClass;
  subClass.__proto__ = superClass;
}

function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  };
  return _getPrototypeOf(o);
}

function _setPrototypeOf(o, p) {
  _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  };

  return _setPrototypeOf(o, p);
}

function isNativeReflectConstruct() {
  if (typeof Reflect === "undefined" || !Reflect.construct) return false;
  if (Reflect.construct.sham) return false;
  if (typeof Proxy === "function") return true;

  try {
    Date.prototype.toString.call(Reflect.construct(Date, [], function () {}));
    return true;
  } catch (e) {
    return false;
  }
}

function _construct(Parent, args, Class) {
  if (isNativeReflectConstruct()) {
    _construct = Reflect.construct;
  } else {
    _construct = function _construct(Parent, args, Class) {
      var a = [null];
      a.push.apply(a, args);
      var Constructor = Function.bind.apply(Parent, a);
      var instance = new Constructor();
      if (Class) _setPrototypeOf(instance, Class.prototype);
      return instance;
    };
  }

  return _construct.apply(null, arguments);
}

function _isNativeFunction(fn) {
  return Function.toString.call(fn).indexOf("[native code]") !== -1;
}

function _wrapNativeSuper(Class) {
  var _cache = typeof Map === "function" ? new Map() : undefined;

  _wrapNativeSuper = function _wrapNativeSuper(Class) {
    if (Class === null || !_isNativeFunction(Class)) return Class;

    if (typeof Class !== "function") {
      throw new TypeError("Super expression must either be null or a function");
    }

    if (typeof _cache !== "undefined") {
      if (_cache.has(Class)) return _cache.get(Class);

      _cache.set(Class, Wrapper);
    }

    function Wrapper() {
      return _construct(Class, arguments, _getPrototypeOf(this).constructor);
    }

    Wrapper.prototype = Object.create(Class.prototype, {
      constructor: {
        value: Wrapper,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    return _setPrototypeOf(Wrapper, Class);
  };

  return _wrapNativeSuper(Class);
}

// A type of promise-like that resolves synchronously and supports only one observer

const _iteratorSymbol = /*#__PURE__*/ typeof Symbol !== "undefined" ? (Symbol.iterator || (Symbol.iterator = Symbol("Symbol.iterator"))) : "@@iterator";

const _asyncIteratorSymbol = /*#__PURE__*/ typeof Symbol !== "undefined" ? (Symbol.asyncIterator || (Symbol.asyncIterator = Symbol("Symbol.asyncIterator"))) : "@@asyncIterator";

// Asynchronously call a function and send errors to recovery continuation
function _catch(body, recover) {
	try {
		var result = body();
	} catch(e) {
		return recover(e);
	}
	if (result && result.then) {
		return result.then(void 0, recover);
	}
	return result;
}

function isString(v) {
  return typeof v === "string";
}
function isFunction(v) {
  return typeof v === "function";
}
function isUndefined(v) {
  return v === undefined;
}
function isNumber(v) {
  return typeof v === "number";
}
function isObject(v) {
  return v !== null && typeof v === "object";
}
function isPlainObject(v) {
  return v !== null && typeof v === "object" && v.__proto__ === Object.prototype;
}
function identity(v) {
  return v;
}
function getDefault() {
  for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  for (var _i = 0, _args = args; _i < _args.length; _i++) {
    var v = _args[_i];
    if (!isUndefined(v)) return v;
  }

  return undefined;
}
function encodeQuery(query) {
  return Object.keys(query).reduce(function (q, k) {
    return (q ? q + "&" : q) + (encodeURIComponent(k) + "=" + encodeURIComponent(query[k]));
  }, "");
}
function formatFullUrl(baseURL, url, query) {
  var queryString = encodeQuery(query);
  return baseURL + url + (queryString ? "?" : "") + queryString;
}
function formatResponseHeaders(headers) {
  var arr = headers.trim().split(/[\r\n]+/);
  var headerMap = {};
  arr.forEach(function (line) {
    var parts = line.split(": ");
    var header = parts.shift();
    var value = parts.join(": ");
    headerMap[header] = value;
  });
  return headerMap;
}
/**
 * 对对象进行深度排序
 *
 * 如果是数组，转换为字符串后，按字母序排序
 * 如果是对象，按 key 进行字母排序
 *
 * @param {any} value
 */

function getSortedString(value) {
  var str = "";

  if (Array.isArray(value)) {
    str = "[" + [].concat(value).sort().map(getSortedString) + "]";
  } else if (typeof value === "object") {
    str = Object.keys(value).sort().reduce(function (str, key, index, arr) {
      str += key + ":" + value[key];

      if (index !== arr.length - 1) {
        str += ",";
      } else {
        str += "}";
      }

      return str;
    }, "{");
  } else {
    str = String(value);
  }

  return str;
}

var ExpireCacheItem = function ExpireCacheItem(data, timeout) {
  this.data = data;
  this.timeout = timeout; // 创建对象时候的时间，大约设定为数据获得的时间

  this.cacheTime = Date.now();
};

var ExpireCache =
/*#__PURE__*/
function () {
  function ExpireCache(defaultCacheTime) {
    if (defaultCacheTime === void 0) {
      defaultCacheTime = 5 * 60 * 1000;
    }

    this.cacheMap = new Map();
    this.defaultCacheTime = defaultCacheTime;
  } // 数据是否超时


  var _proto = ExpireCache.prototype;

  _proto.isOverTime = function isOverTime(key) {
    var data = this.cacheMap.get(key);
    if (!data) return true;
    var overTime = Date.now() - data.cacheTime;

    if (overTime > 0 && overTime > data.timeout) {
      this.cacheMap["delete"](key);
      return true;
    }

    return false;
  };

  _proto.has = function has(key) {
    return !this.isOverTime(key);
  };

  _proto["delete"] = function _delete(key) {
    return this.cacheMap["delete"](key);
  };

  _proto.get = function get(key) {
    if (this.isOverTime(key)) {
      return undefined;
    }

    var value = this.cacheMap.get(key);

    if (!value) {
      return undefined;
    }

    return value.data;
  };

  _proto.set = function set(key, data, _temp) {
    var _ref = _temp === void 0 ? {} : _temp,
        _ref$timeout = _ref.timeout,
        timeout = _ref$timeout === void 0 ? this.defaultCacheTime : _ref$timeout;

    var itemCache = new ExpireCacheItem(data, timeout);
    this.cacheMap.set(key, itemCache);
    return data;
  };

  _proto.clear = function clear() {
    return this.cacheMap.clear();
  };

  return ExpireCache;
}();

var WebXhrClient =
/*#__PURE__*/
function () {
  function WebXhrClient() {}

  var _proto = WebXhrClient.prototype;

  _proto.request = function request(options) {
    try {
      return new Promise(function (resolve) {
        var xhr = new XMLHttpRequest();
        var fullUrl = formatFullUrl(options.baseURL, options.url, options.query);
        xhr.open(options.method, fullUrl, true); // 设置请求头

        Object.keys(options.headers).forEach(function (key) {
          return xhr.setRequestHeader(key, options.headers[key]);
        }); // 设置请求数据

        var body = null;

        if (options.method === "POST") {
          if (isPlainObject(options.body)) {
            body = JSON.stringify(options.body);
            xhr.setRequestHeader("Content-Type", "application/json");
          } else {
            body = options.body;
          }
        } // 设置响应数据类型（只支持 JSON）


        xhr.responseType = "text";
        xhr.send(body);

        xhr.onreadystatechange = function () {
          if (this.readyState === XMLHttpRequest.DONE) {
            var headers = formatResponseHeaders(this.getAllResponseHeaders());
            var response = {
              data: this.response,
              status: this.status,
              statusText: this.statusText,
              headers: headers
            };

            if (!this.response && this.responseText) {
              response.data = this.responseText;
            } // // try parse json


            try {
              response.data = JSON.parse(response.data);
            } catch (err) {// do nothing
            }

            resolve(response);
          }
        };
      });
    } catch (e) {
      return Promise.reject(e);
    }
  };

  return WebXhrClient;
}();

var WebAxiosClient =
/*#__PURE__*/
function () {
  function WebAxiosClient() {}

  var _proto = WebAxiosClient.prototype;

  _proto.request = function request(options) {
    try {
      return Promise.resolve(axios.request({
        baseURL: options.baseURL,
        url: options.url,
        method: options.method,
        params: options.method === "GET" ? options.query : null,
        data: options.method === "POST" ? options.body : null,
        headers: options.headers
      })).then(function (res) {
        return {
          data: res.data,
          status: res.status,
          statusText: res.statusText,
          headers: res.headers
        };
      });
    } catch (e) {
      return Promise.reject(e);
    }
  };

  return WebAxiosClient;
}();

var ApiSharpRequestError =
/*#__PURE__*/
function (_Error) {
  _inheritsLoose(ApiSharpRequestError, _Error);

  function ApiSharpRequestError(message, api) {
    var _this2;

    _this2 = _Error.call(this, message) || this;
    _this2.api = api;
    return _this2;
  }

  return ApiSharpRequestError;
}(_wrapNativeSuper(Error));
var defaultConfig = {
  httpClient:
  /*#__PURE__*/
  new WebXhrClient(),
  cache:
  /*#__PURE__*/
  new ExpireCache(),
  url: "",
  baseURL: "",
  headers: {},
  enableMock: false,
  mockData: undefined,
  method: "GET",
  params: {},
  description: "",
  enableCache: false,
  cacheTime: 5 * 1000,
  paramsTransformer: identity,
  returnsTransformer: identity,
  enableRetry: false,
  retryTimes: 1,
  timeout: 60 * 1000,
  enableLog: "development" !== "production",
  logFormatter: {
    logRequest: function logRequest(api) {
      console.log("%cRequest %c %c" + api.method + "|" + api.description + "|" + api.url + "%c|%O", "color: white; background-color: rgba(0, 116, 217, 0.69); padding: 2px 5px; border-radius: 2px", "", "color: #0074D9", "", api.params);
    },
    logResponse: function logResponse(api, data) {
      console.log("%cResponse%c %c" + api.method + "|" + api.description + "|" + api.url + "%c|%O|%O", "color: white; background-color: rgba(61, 153, 112, 0.69); padding: 2px 5px; border-radius: 2px", "", "color: #3D9970", "", api.params, data);
    },
    logResponseError: function logResponseError(_error, api, data) {
      console.log("%cResponse%c %c" + api.method + "|" + api.description + "|" + api.url + "%c|%O|%O", "color: white; background-color: rgba(255, 65, 54, 0.69); padding: 2px 5px; border-radius: 2px", "", "color: #FF4136", "", api.params, data);
    },
    logResponseCache: function logResponseCache(api, data) {
      console.log("%cResponse Cache %c %c" + api.method + "|" + api.description + "|" + api.url + "%c|%O|%O", "color: white; background-color: rgba(177, 13, 201, 0.69); padding: 2px 5px; border-radius: 2px", "", "color: #B10DC9", "", api.params, data);
    }
  }
};
var ApiSharp =
/*#__PURE__*/
function () {
  function ApiSharp(options) {
    if (options === void 0) {
      options = {};
    }

    this.httpClient = getDefault(options.httpClient, defaultConfig.httpClient);
    this.cache = defaultConfig.cache;
    this.baseURL = getDefault(options.baseURL, defaultConfig.baseURL);
    this.method = getDefault(options.method, defaultConfig.method);
    this.headers = getDefault(options.headers, defaultConfig.headers);
    this.paramsTransformer = getDefault(options.paramsTransformer, defaultConfig.paramsTransformer);
    this.returnsTransformer = getDefault(options.returnsTransformer, defaultConfig.returnsTransformer);
    this.enableCache = getDefault(options.enableCache, defaultConfig.enableCache);
    this.cacheTime = getDefault(options.cacheTime, defaultConfig.cacheTime);
    this.enableRetry = getDefault(options.enableRetry, defaultConfig.enableRetry);
    this.retryTimes = getDefault(options.retryTimes, defaultConfig.retryTimes);
    this.timeout = getDefault(options.timeout, defaultConfig.timeout);
    this.enableLog = getDefault(options.enableLog, defaultConfig.enableLog);
    this.logFormatter = getDefault(options.logFormatter, defaultConfig.logFormatter);
  }
  /**
   * 发送请求
   */


  var _proto = ApiSharp.prototype;

  _proto.request = function request(_api) {
    try {
      var _exit2 = false;

      var _this3 = this;

      var _temp3 = function _temp3(_result) {
        if (_exit2) return _result;

        // 检查请求结果，并对失败情况做处理
        var checkResult = _this3.checkResponseData(res.data);

        if (!checkResult.success) {
          if (api.enableCache) {
            _this3.cache["delete"](cachedKey);
          }

          if (api.enableRetry && api.retryTimes >= 1) {
            return _this3.request(_extends({}, api, {
              retryTimes: api.retryTimes - 1,
              __retry: true
            }));
          } else {
            _this3.logResponseError(new Error(checkResult.errMsg), api, res.data);

            throw new ApiSharpRequestError(checkResult.errMsg, api);
          }
        }

        if (hitCache) {
          _this3.logResponseCache(api, res.data);
        } else {
          _this3.logResponse(api, res.data);
        }

        return {
          data: api.returnsTransformer(res.data),
          from: hitCache ? "cache" : "network",
          api: api,
          status: res.status,
          statusText: res.statusText,
          headers: res.headers
        };
      };

      var api = _this3.processApi(_api);

      _this3.logRequest(api); // 处理 mock 数据


      if (api.enableMock) {
        return {
          data: api.mockData,
          from: "mock",
          api: api,
          headers: {},
          status: 200,
          statusText: "OK(mock)"
        };
      }

      var requestPromise;
      var cachedKey;
      var hitCache = false; // 构造一个超时时自动 reject 的 Promise

      var timeoutPromise = new Promise(function (_resolve, reject) {
        var error = new Error("\u8BF7\u6C42\u8D85\u65F6(" + api.timeout + "ms)");
        setTimeout(function () {
          return reject(error);
        }, api.timeout);
      }); // 处理缓存

      if (api.enableCache) {
        cachedKey = _this3.generateCachedKey(api);

        if (_this3.cache.has(cachedKey)) {
          requestPromise = _this3.cache.get(cachedKey);
          hitCache = true;
        } else {
          requestPromise = _this3.sendRequest(api);
          hitCache = false;

          _this3.cache.set(cachedKey, requestPromise, {
            timeout: api.cacheTime
          });
        }
      } else {
        requestPromise = _this3.sendRequest(api);
      }

      var res;

      var _temp4 = _catch(function () {
        // 发起请求
        return Promise.resolve(Promise.race([requestPromise, timeoutPromise])).then(function (_Promise$race) {
          res = _Promise$race;
        });
      }, function (err) {
        // 请求失败或超时，都会抛出异常并被捕获处理
        // 请求失败时删除缓存
        if (api.enableCache) {
          _this3.cache["delete"](cachedKey);
        }

        if (api.enableRetry && api.retryTimes >= 1) {
          _exit2 = true;
          return _this3.request(_extends({}, api, {
            retryTimes: api.retryTimes - 1,
            __retry: true
          }));
        } else {
          _this3.logResponseError(err, api);

          throw new ApiSharpRequestError(err.message, api);
        }
      });

      return _temp4 && _temp4.then ? _temp4.then(_temp3) : _temp3(_temp4);
    } catch (e) {
      return Promise.reject(e);
    }
  }
  /**
   * 清除全部缓存
   */
  ;

  _proto.clearCache = function clearCache() {
    return this.cache.clear();
  };

  _proto.sendRequest = function sendRequest(api) {
    return this.httpClient.request({
      baseURL: api.baseURL,
      url: api.url,
      method: api.method,
      headers: api.headers,
      query: api.method === "GET" ? api.params : {},
      body: api.method === "POST" ? api.params : {}
    });
  };

  _proto.generateCachedKey = function generateCachedKey(api) {
    return api.method + " " + api.baseURL + api.url + "?" + getSortedString(api.params);
  };

  _proto.processApi = function processApi(api) {
    !api ?  invariant(false, "api 为空")  : void 0;

    if (isString(api)) {
      api = {
        url: api
      };
    }

    var _api = _extends({}, api); // 请求地址


    if (!api.url || !String(api.url)) {
        invariant(false, "url \u4E3A\u7A7A")  ;
    } else {
      _api.url = String(api.url);
    } // 基地址


    if (isUndefined(api.baseURL)) {
      _api.baseURL = this.baseURL;
    } else {
      _api.baseURL = api.baseURL;
    }

    _api.baseURL = _api.baseURL.replace(/\/+$/, ""); // 请求方法

    if (isUndefined(api.method)) {
      _api.method = this.method;
    } else if (isString(api.method) && /get|post/i.test(api.method)) {
      _api.method = api.method.toUpperCase();
    } else {
        invariant(false, "method \u671F\u671B\u503C\u4E3A get|post \u5176\u4E00\uFF0C\u5B9E\u9645\u503C\u4E3A\"" + api.method + "\"")  ;
    }

    if (isUndefined(api.headers)) {
      _api.headers = this.headers;
    } else {
      _api.headers = api.headers;
    } // 描述


    if (isUndefined(api.description)) {
      _api.description = defaultConfig.description;
    } else if (isFunction(api.description)) {
      _api.description = String(api.description.call(null, api));
    } else {
      _api.description = String(api.description);
    } // 开启缓存


    if (isUndefined(api.enableCache)) {
      _api.enableCache = this.enableCache;
    } else if (isFunction(api.enableCache)) {
      _api.enableCache = !!api.enableCache.call(null, api);
    } else {
      _api.enableCache = !!api.enableCache;
    }

    if (_api.method.toUpperCase() !== "GET" && _api.enableCache) {
      _api.enableCache = false;
       warning(false, "\u53EA\u6709 GET \u8BF7\u6C42\u652F\u6301\u5F00\u542F\u7F13\u5B58\uFF0C\u5F53\u524D\u8BF7\u6C42\u65B9\u6CD5\u4E3A\"" + _api.method + "\"\uFF0C\u7F13\u5B58\u5F00\u542F\u4E0D\u4F1A\u751F\u6548") ;
    } // 缓存时间


    if (isUndefined(api.cacheTime)) {
      _api.cacheTime = this.cacheTime;
    } else if (isNumber(api.cacheTime)) {
      _api.cacheTime = api.cacheTime;
    } else if (isFunction(api.cacheTime)) {
      _api.cacheTime = api.cacheTime.call(null, api);
    } else {
      _api.cacheTime = this.cacheTime;
       warning(false, "cacheTime \u671F\u671B number/function \u7C7B\u578B\uFF0C\u5B9E\u9645\u7C7B\u578B\u4E3A" + typeof api.cacheTime + "\uFF0C\u81EA\u52A8\u4F7F\u7528\u9ED8\u8BA4\u503C") ;
    }

    if (isUndefined(api.enableMock)) {
      _api.enableMock = defaultConfig.enableMock;
    } else if (isFunction(api.enableMock)) {
      _api.enableMock = !!api.enableMock.call(null, api);
    } else {
      _api.enableMock = !!api.enableMock;
    }

    if (isUndefined(api.mockData)) {
      _api.mockData = defaultConfig.mockData;
    } else if (isFunction(api.mockData)) {
      _api.mockData = api.mockData.call(null, api);
    } else {
      _api.mockData = api.mockData;
    }

    if (isUndefined(api.enableRetry)) {
      _api.enableRetry = this.enableRetry;
    } else if (isFunction(api.enableRetry)) {
      _api.enableRetry = !!api.enableRetry.call(null, api);
    } else {
      _api.enableRetry = !!api.enableRetry;
    }

    if (isUndefined(api.retryTimes)) {
      _api.retryTimes = this.retryTimes;
    } else if (isNumber(api.retryTimes)) {
      _api.retryTimes = api.retryTimes;
    } else if (isFunction(api.retryTimes)) {
      _api.retryTimes = api.retryTimes.call(null, api);
    } else {
      _api.retryTimes = this.retryTimes;
       warning(false, "retryTimes \u671F\u671B number/function \u7C7B\u578B\uFF0C\u5B9E\u9645\u7C7B\u578B\u4E3A" + typeof api.retryTimes + "\uFF0C\u81EA\u52A8\u4F7F\u7528\u9ED8\u8BA4\u503C") ;
    }

    if (isUndefined(api.timeout)) {
      _api.timeout = this.timeout;
    } else {
      _api.timeout = api.timeout;
    }

    if (isUndefined(api.enableLog)) {
      _api.enableLog = this.enableLog;
    } else if (isFunction(api.enableLog)) {
      _api.enableLog = !!api.enableLog.call(null, api);
    } else {
      _api.enableLog = !!api.enableLog;
    }

    if (isUndefined(api.logFormatter)) {
      _api.logFormatter = this.logFormatter;
    } else if (isObject(api.logFormatter)) {
      _api.logFormatter = {
        logRequest: api.logFormatter.logRequest || this.logFormatter.logRequest,
        logResponse: api.logFormatter.logResponse || this.logFormatter.logResponse,
        logResponseError: api.logFormatter.logResponseError || this.logFormatter.logResponseError,
        logResponseCache: api.logFormatter.logResponseCache || this.logFormatter.logResponseCache
      };
    } else {
      _api.logFormatter = this.logFormatter;
    }
    /**
     * 参数转换 + 类型校验
     */


    var _params = isUndefined(api.params) ? defaultConfig.params : api.params;

    var _paramsTransformer;

    if (isUndefined(api.paramsTransformer)) {
      _paramsTransformer = this.paramsTransformer;
    } else if (isFunction(api.paramsTransformer)) {
      _paramsTransformer = api.paramsTransformer;
    } else {
      _paramsTransformer = this.paramsTransformer;
       warning(false, "paramsTransformer \u671F\u671B\u4E00\u4E2A\u51FD\u6570\uFF0C\u5B9E\u9645\u63A5\u6536\u5230" + typeof api.paramsTransformer) ;
    }

    _params = _paramsTransformer.call(null, _params);

    if (!isUndefined(api.paramsType)) {
      var componentName = _api.baseURL + _api.url;
      PropTypes.checkPropTypes(api.paramsType, _params, "", componentName);
    }

    _api.params = _params;

    if (isUndefined(api.returnsTransformer)) {
      _api.returnsTransformer = this.returnsTransformer;
    }

    return _api;
  };

  _proto.checkResponseData = function checkResponseData(data) {
    // return {
    //   success: false,
    //   errMsg: ''
    // }
    return {
      success: !!data
    };
  };

  _proto.logRequest = function logRequest(api) {
    api.enableLog && api.logFormatter.logRequest(api);
  };

  _proto.logResponse = function logResponse(api, data) {
    api.enableLog && api.logFormatter.logResponse(api, data);
  };

  _proto.logResponseError = function logResponseError(error, api, data) {
    api.enableLog && api.logFormatter.logResponseError(error, api, data);
  };

  _proto.logResponseCache = function logResponseCache(api, data) {
    api.enableLog && api.logFormatter.logResponseCache(api, data);
  };

  return ApiSharp;
}();

exports.WebAxiosClient = WebAxiosClient;
exports.WebXhrClient = WebXhrClient;
exports.default = ApiSharp;
//# sourceMappingURL=api-sharp.cjs.development.js.map
