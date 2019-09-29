module.exports = {
  presets: [
    ["@babel/preset-env", { targets: { chrome: "48", ie: "11", node: 8 }, useBuiltIns: "usage", corejs: 3 }],
    "@babel/preset-typescript"
  ],
  plugins: [["@babel/plugin-proposal-class-properties", { loose: true }]]
}
