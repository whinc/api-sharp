const fetch = require('node-fetch')

export interface Endpoint {
  url: string,
  baseUrl?: string,
  method?: string,
  desc?: string
}

export class ApiSharp {
  constructor () {
  }

  request(endpoint: Endpoint) {
    const {baseUrl, url} = this.preprocessEndpoint(endpoint)
    const finalUrl = url.startsWith('http') ? url : baseUrl + url
    return fetch(finalUrl).then(res => res.json())
  }

  preprocessEndpoint (endpoint: Endpoint): Endpoint {
    const _endpoint = {...endpoint}
    if (_endpoint.method === undefined) {
      _endpoint.method = 'GET'
    }
    if (typeof _endpoint.method === 'string') {
      _endpoint.method = _endpoint.method.toUpperCase()
    }
    if (_endpoint.baseUrl) {
      _endpoint.baseUrl = _endpoint.baseUrl.replace(/\/+$/, '')
    }
    if (!_endpoint.url.startsWith('/')) {
      _endpoint.url = '/' + _endpoint.url
    }
    return _endpoint
  }
}