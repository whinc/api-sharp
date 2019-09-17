module.exports = {
  presets: [["@babel/preset-env", { targets: { browsers: "> 5% or last 2 versions" } }], "@babel/preset-typescript"],
  plugins: [["@babel/plugin-proposal-class-properties", { loose: true }]]
}
