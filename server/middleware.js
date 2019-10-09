/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
module.exports = (req, res, next) => {
  if (req.path === "/date/json") {
    res.json({ server_date: Date.now() })
  } else if (req.path === "/date/text") {
    res.end(`server_date:` + Date.now())
  } else if (req.path === "/delay") {
    setTimeout(() => {
      res.json(req.query)
    }, req.query.delay || 0)
  } else if (req.path === "/echo/headers") {
    // 回显请求头
    res.json(req.headers)
  } else if (req.path === "/echo/query") {
    // 回显 URL 查询参数
    res.json(req.query)
  } else if (req.path === "/echo/body") {
    // 回显请求体
    res.end(typeof req.body === "string" ? req.body : JSON.stringify(req.body))
  } else {
    next()
  }
}
