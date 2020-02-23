import React from "react"
import ReactDOM from "react-dom"
import { App } from "./App"

window.__DEV__ = true

ReactDOM.render(<App />, document.querySelector("#app"))
