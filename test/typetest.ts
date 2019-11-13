import PropType from "prop-types"
import { ApiSharp, defineApi, ApiDescriptor } from "../src"

const projectList = defineApi({
  url: "http://xyz",
  method: "post",
  body: {
    a: 100
  },
  bodyPropTypes: {
    a: PropType.string
  }
})

const apiSharp = new ApiSharp()
;(async () => {
  let res = await apiSharp.request<{ data: any; errcode: number; errmsg: string }>({
    ...projectList,
    body: {
      id: ""
    }
  })
  let res2 = await apiSharp.request({
    ...projectList,
    body: {
      a: 22
    }
  })
  let res3 = await apiSharp.request({
    url: "http://xyz",
    method: "post",
    body: {
      a: 100
    },
    bodyPropTypes: {
      a: PropType.string
    }
  })
})()
