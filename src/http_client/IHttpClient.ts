import { IRequest, IResponse } from "../types"

export default interface IHttpClient {
  request<T>(options: IRequest): Promise<IResponse<T>>
}
