let PropTypes
try {
  PropTypes = require("prop-types")
} catch (err) {
  console.error(err)
}

const checkPropTypes = PropTypes ? PropTypes.checkPropTypes : () => {}

export { checkPropTypes }

export interface Validator {
  (props: object, propName: string, componentName: string, location: string, propFullName: string): Error | null
}
