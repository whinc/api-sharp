module.exports = {
  globals: {
    __DEV__: true,
    "ts-jest": {
      diagnostics: {
        warnOnly: true
      }
    }
  },
  testMatch: ["<rootDir>/test/unit/**/*.test.ts"],
  watchPathIgnorePatterns: ["<rootDir>/node_modules/"]
}
