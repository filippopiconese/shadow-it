import { existsSync } from "node:fs";
import { resolve } from "node:path";

// Local-dev convenience: load a .env file (repo root or package dir) using the
// Node-native loader — no dependency. On Replit/prod the env is already set, so
// a missing .env is a no-op. Imported first in index.ts so vars exist before
// any module reads process.env (e.g. the DB pool).
for (const candidate of [
  resolve(process.cwd(), ".env"),
  resolve(process.cwd(), "../../.env"),
]) {
  if (existsSync(candidate)) {
    process.loadEnvFile(candidate);
    break;
  }
}
