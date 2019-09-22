module.exports = (req, res, next) => {
  if (req.url === "/date/json") {
    res.json({ server_date: Date.now() })
    return
  } else if (req.url === "/date/text") {
    res.end(`server_date:` + Date.now())
    return
  } 
  next()
}
