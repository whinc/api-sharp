import { IRequest, IResponse } from "../types"

export default interface IHttpClient {
  request(options: IRequest): Promise<IResponse>
}
