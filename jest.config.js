module.exports = {
    "globals": {
      "__DEV__": true,
      "ts-jest": {
        "diagnostics": {
          "warnOnly": true
        }
      }
    },
    "testMatch": [
      "<rootDir>/test/**/*.test.ts"
    ],
    "watchPathIgnorePatterns": [
      "<rootDir>/test/server/",
      "<rootDir>/node_modules/"
    ]
}