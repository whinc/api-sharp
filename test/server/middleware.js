/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
module.exports = (req, res, next) => {
  if (req.path === "/date/json") {
    res.json({ server_date: Date.now() })
    return
  } else if (req.path === "/date/text") {
    res.end(`server_date:` + Date.now())
    return
  }
  // 回显请求头
  if (req.path === "/echo/headers") {
    res.json(req.headers)
    return
  }
  // 回显 URL 查询参数
  if (req.path === "/echo/query") {
    res.json(req.query)
    return
  }
  // 回显请求体
  if (req.path === "/echo/body") {
    res.end(req.body)
    return
  }
  next()
}
