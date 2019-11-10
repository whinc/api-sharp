import { ApiDescriptor } from "./types"
export * from "./types"
export * from "./core/ApiSharp"
export * from "./http_client"
export * from "./cache"
export { ApiSharp as default } from "./core/ApiSharp"

export function defineApi<QueryType = any, BodyType = any>(
  api: ApiDescriptor<QueryType, BodyType>
) {
  return api
}
