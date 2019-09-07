module.exports = (req, res, next) => {
  const value = req.get('test-header')
  if (value !== undefined) {
    console.log('test-header:', value)
    res.set('test-header', value)
  }
  next()
}