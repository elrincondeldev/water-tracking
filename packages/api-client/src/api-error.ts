import { apiErrorSchema } from "@gota/contracts";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function toApiError(response: Response): Promise<ApiError> {
  const body = apiErrorSchema.safeParse(await response.json().catch(() => null));
  return body.success
    ? new ApiError(response.status, body.data.error.code, body.data.error.message)
    : new ApiError(response.status, "http_error", `HTTP ${response.status}`);
}
