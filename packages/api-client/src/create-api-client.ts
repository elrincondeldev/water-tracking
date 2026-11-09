import {
  type Bottle,
  bottleSchema,
  type CreateIntakeRequest,
  type Device,
  deviceSchema,
  type Goal,
  goalSchema,
  type HistoryGranularity,
  type HistoryResponse,
  historyResponseSchema,
  type Intake,
  intakeSchema,
  type PutGoalRequest,
  type PutSettingsRequest,
  type ResetBottleRequest,
  type Settings,
  settingsSchema,
  type TodaySummary,
  todaySummarySchema,
  type UpdateIntakeRequest,
} from "@gota/contracts";
import type { z } from "zod";
import { ApiError, toApiError } from "./api-error";

export type ApiClientOptions = {
  baseUrl?: string;
  fetch?: typeof globalThis.fetch;
};

export type HistoryParams = { from: string; to: string; granularity?: HistoryGranularity };

export type ApiClient = ReturnType<typeof createApiClient>;

export function createApiClient({ baseUrl = "", fetch = globalThis.fetch }: ApiClientOptions = {}) {
  async function request(method: string, path: string, body?: unknown): Promise<Response> {
    const response = await fetch(`${baseUrl}/api/v1${path}`, {
      method,
      ...(body === undefined
        ? {}
        : { headers: { "content-type": "application/json" }, body: JSON.stringify(body) }),
    });
    if (!response.ok) throw await toApiError(response);
    return response;
  }

  async function json<T>(schema: z.ZodType<T>, method: string, path: string, body?: unknown) {
    return schema.parse(await (await request(method, path, body)).json());
  }

  return {
    getTodaySummary: (): Promise<TodaySummary> => json(todaySummarySchema, "GET", "/summary/today"),

    getHistory: ({ from, to, granularity = "day" }: HistoryParams): Promise<HistoryResponse> =>
      json(
        historyResponseSchema,
        "GET",
        `/history?${new URLSearchParams({ from, to, granularity })}`,
      ),

    getDevice: async (): Promise<Device | null> => {
      try {
        return await json(deviceSchema, "GET", "/device");
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
      }
    },

    getGoal: (): Promise<Goal> => json(goalSchema, "GET", "/goal"),
    putGoal: (body: PutGoalRequest): Promise<Goal> => json(goalSchema, "PUT", "/goal", body),

    getSettings: (): Promise<Settings> => json(settingsSchema, "GET", "/settings"),
    putSettings: (body: PutSettingsRequest): Promise<Settings> =>
      json(settingsSchema, "PUT", "/settings", body),

    createIntake: (body: CreateIntakeRequest): Promise<Intake> =>
      json(intakeSchema, "POST", "/intakes", body),
    updateIntake: (id: number, body: UpdateIntakeRequest): Promise<Intake> =>
      json(intakeSchema, "PATCH", `/intakes/${id}`, body),
    deleteIntake: async (id: number): Promise<void> => {
      await request("DELETE", `/intakes/${id}`);
    },

    getBottle: (): Promise<Bottle> => json(bottleSchema, "GET", "/bottle"),
    resetBottle: (body: ResetBottleRequest = {}): Promise<Bottle> =>
      json(bottleSchema, "POST", "/bottle/reset", body),
  };
}
