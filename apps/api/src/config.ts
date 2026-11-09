import { z } from "zod";

const configSchema = z.object({
  GOTA_DEVICE_TOKEN: z.string().min(16, "GOTA_DEVICE_TOKEN must be at least 16 characters"),
  DATABASE_PATH: z.string().default("data/gota.db"),
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
});

export type Config = z.infer<typeof configSchema>;

export function loadConfig(env: NodeJS.ProcessEnv): Config {
  return configSchema.parse(env);
}
