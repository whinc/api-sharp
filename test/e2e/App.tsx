import React, { useState, useCallback } from "react"
import { ApiSharp, defaultOptions } from "../../src"

const apiSharp = new ApiSharp({})

export const App = () => {
  const [url, setUrl] = useState("http://localhost:4000/posts" || defaultOptions.url)
  const [baseURL, setBaseURL] = useState(defaultOptions.baseURL)
  const [method, setMethod] = useState(defaultOptions.method)
  const [headers, setHeaders] = useState(defaultOptions.headers)
  const [description, setDescription] = useState("文章列表" || defaultOptions.description)
  const [params, setParams] = useState(defaultOptions.params)
  const [body, setBody] = useState(defaultOptions.body)
  const [responseType, setResponseType] = useState(defaultOptions.responseType)
  const [timeout, setTimeout] = useState(defaultOptions.timeout)
  const [enableCache, setEnableCache] = useState(defaultOptions.enableCache)
  const [cacheTime, setCacheTime] = useState(defaultOptions.cacheTime)

  const [response, setResponse] = useState(null)
  const onClickSend = useCallback(() => {
    const apiConfig = {
      url,
      baseURL,
      method,
      headers,
      description,
      params,
      body,
      responseType,
      enableCache,
      timeout,
      cacheTime
    }
    apiSharp.request(apiConfig).then(
      res => {
        // console.log("response:", res)
        setResponse(JSON.stringify(res, null, 2))
      },
      err => {
        // console.error(err)
        setResponse(err.message)
      }
    )
  }, [
    url,
    baseURL,
    method,
    headers,
    description,
    params,
    body,
    responseType,
    timeout,
    enableCache,
    cacheTime
  ])
  return (
    <div>
      <div>
        <label>url: </label>
        <input value={url} onChange={e => setUrl(e.target.value)} />
      </div>
      <div>
        <label>baseURL: </label>
        <input value={baseURL} onChange={e => setBaseURL(e.target.value)} />
      </div>
      <div>
        <label>method: </label>
        <select value={method} onChange={e => setMethod(e.target.value as any)}>
          <option value="GET">GET</option>
          <option value="POST">POST</option>
        </select>
      </div>
      <div>
        <label>description: </label>
        <input value={description} onChange={e => setDescription(e.target.value)} />
      </div>
      <div>
        <label>params: </label>
        <input
          defaultValue={JSON.stringify(params)}
          onBlur={e => setParams(JSON.parse(e.target.value || "{}"))}
        />
      </div>
      {method === "POST" && (
        <div>
          <label>body: </label>
          <input
            defaultValue={JSON.stringify(body)}
            onBlur={e => setBody(JSON.parse(e.target.value || "{}"))}
          />
        </div>
      )}
      <div>
        <label>responseType: </label>
        <select value={responseType} onChange={e => setResponseType(e.target.value as any)}>
          <option value="json">json</option>
          <option value="text">text</option>
        </select>
      </div>
      <div>
        <label>timeout(ms): </label>
        <input value={timeout} onChange={e => setTimeout(parseInt(e.target.value))} />
      </div>
      <div>
        <label>enableCache: </label>
        <select
          value={JSON.stringify(enableCache)}
          onChange={e => setEnableCache(JSON.parse(e.target.value))}
        >
          <option value="true">开</option>
          <option value="false">关</option>
        </select>
      </div>
      <div>
        <label>cacheTime(ms): </label>
        <input value={cacheTime} onChange={e => setCacheTime(parseInt(e.target.value))} />
      </div>
      <div style={{ marginTop: 10 }}>
        <button onClick={onClickSend}>Send request</button>
      </div>
      <hr />
      <div>
        <label>response:</label>
        <pre>
          <code>{response}</code>
        </pre>
      </div>
    </div>
  )
}
