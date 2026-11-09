import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { buildApp } from "./app";
import { loadConfig } from "./config";
import { ensureDefaults } from "./db/ensure-defaults";
import { openDatabase } from "./db/open-database";

const config = loadConfig(process.env);
mkdirSync(dirname(config.DATABASE_PATH), { recursive: true });
const db = openDatabase(config.DATABASE_PATH);
ensureDefaults(db, new Date());

const app = buildApp({ db, deviceToken: config.GOTA_DEVICE_TOKEN, logger: true });

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    void app.close().then(() => process.exit(0));
  });
}

await app.listen({ host: config.HOST, port: config.PORT });
