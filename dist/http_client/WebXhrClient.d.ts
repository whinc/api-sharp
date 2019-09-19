import { IHttpClient, IRequest, IResponse } from "./IHttpClient";
export default class WebXhrClient implements IHttpClient {
    request<T>(options: IRequest): Promise<IResponse<T>>;
}
