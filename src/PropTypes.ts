let PropTypes
try {
  PropTypes = require("prop-types")
} catch (err) {
  console.warn(
    `"prop-types" is an optional dependency and is not included by default. If you need to use runtime type checking, you need to import the "prop-types" package before importing "api-sharp".`
  )
}

const checkPropTypes = PropTypes ? PropTypes.checkPropTypes : () => {}

export { checkPropTypes }
