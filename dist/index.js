
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./api-sharp.cjs.production.min.js')
} else {
  module.exports = require('./api-sharp.cjs.development.js')
}
