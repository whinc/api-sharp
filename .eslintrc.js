module.exports = {
  "extends": [
    "react-app",
    "prettier/@typescript-eslint",
    "plugin:prettier/recommended"
  ],
  "settings": {
    "react": {
      "version": "detect"
    }
  },
  "plugins": [
    "react-hooks"
  ],
  "rules": {
    "react-hooks/rules-of-hooks": "error", // Checks rules of Hooks
    "react-hooks/exhaustive-deps": "warn" // Checks effect dependencies
  }
}