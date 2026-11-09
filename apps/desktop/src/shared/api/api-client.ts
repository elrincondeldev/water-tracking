import { createApiClient } from "@gota/api-client";
import { getApiUrl } from "@/shared/config";

export const API_URL = getApiUrl();

export const apiClient = createApiClient({ baseUrl: API_URL });
