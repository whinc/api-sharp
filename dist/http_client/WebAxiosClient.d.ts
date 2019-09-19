import { IHttpClient, IRequest, IResponse } from "./IHttpClient";
export default class WebAxiosClient implements IHttpClient {
    request<T>(options: IRequest): Promise<IResponse<T>>;
}
