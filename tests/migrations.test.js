import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createDatabase, migrate, seedAdmin } from "../server/db.js";

test("migrations create required tables and idempotent admin seed on a clean SQLite database", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "autogo-"));
  const databasePath = path.join(directory, "clean.sqlite");
  const database = createDatabase(databasePath);
  migrate(database);

  const tables = database.prepare(`
    SELECT name FROM sqlite_master
    WHERE type = 'table'
  `).all().map((row) => row.name);

  for (const required of ["users", "sessions", "vehicles", "inventory_blocks", "reservations", "payments", "refunds"]) {
    assert.ok(tables.includes(required), `missing table: ${required}`);
  }
  assert.ok(database.prepare("SELECT COUNT(*) AS count FROM vehicles").get().count >= 3);

  const firstSeed = seedAdmin(database, { email: "admin@autogo.local", password: "Admin123!" });
  const secondSeed = seedAdmin(database, { email: "admin@autogo.local", password: "Admin123!" });
  assert.equal(firstSeed.id, secondSeed.id);
  assert.equal(database.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'admin'").get().count, 1);

  database.close();
  fs.rmSync(directory, { recursive: true, force: true });
});
