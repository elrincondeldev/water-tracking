import { createApiClient } from "@gota/api-client";

export const API_URL: string = import.meta.env.VITE_GOTA_API_URL ?? "http://localhost:3000";

export const apiClient = createApiClient({ baseUrl: API_URL });
