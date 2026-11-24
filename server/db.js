import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { hashPassword } from "./security.js";

export function createDatabase(databasePath) {
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  const database = new DatabaseSync(databasePath);
  database.exec("PRAGMA foreign_keys = ON");
  database.exec("PRAGMA busy_timeout = 5000");
  return database;
}

const dataDir = path.resolve("data");
export const db = createDatabase(path.join(dataDir, "autogo.sqlite"));

export function migrate(database = db) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  database.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
  database.exec(`
    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      capacity INTEGER NOT NULL,
      location TEXT NOT NULL,
      daily_price_cents INTEGER NOT NULL,
      image_url TEXT,
      description TEXT,
      active INTEGER NOT NULL DEFAULT 1
    );
  `);
  database.exec(`
    CREATE TABLE IF NOT EXISTS inventory_blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id INTEGER NOT NULL,
      start_at TEXT NOT NULL,
      end_at TEXT NOT NULL,
      reason TEXT,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
    );
  `);
  database.exec(`
    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      vehicle_id INTEGER NOT NULL,
      pickup_location TEXT NOT NULL,
      start_at TEXT NOT NULL,
      end_at TEXT NOT NULL,
      total_cents INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'confirmed',
      payment_method TEXT NOT NULL,
      payment_status TEXT NOT NULL,
      refund_cents INTEGER NOT NULL DEFAULT 0,
      policy_snapshot TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
    );
  `);
  database.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reservation_id INTEGER NOT NULL,
      method TEXT NOT NULL,
      status TEXT NOT NULL,
      amount_cents INTEGER NOT NULL,
      provider TEXT,
      provider_reference TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (reservation_id) REFERENCES reservations(id)
    );
  `);
  database.exec(`
    CREATE TABLE IF NOT EXISTS refunds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reservation_id INTEGER NOT NULL,
      amount_cents INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      reason TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (reservation_id) REFERENCES reservations(id)
    );
  `);

  const count = database.prepare("SELECT COUNT(*) AS count FROM vehicles").get().count;
  if (count === 0) {
    const insert = database.prepare(`
      INSERT INTO vehicles (name, category, capacity, location, daily_price_cents, image_url, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insert.run("Toyota Corolla", "Sedan", 5, "Monterrey", 85000, "", "Sedán compacto automático con aire acondicionado y excelente rendimiento.");
    insert.run("Jeep Compass", "SUV", 5, "Monterrey", 125000, "", "SUV versátil para ciudad y carretera, amplio espacio en cajuela.");
    insert.run("Nissan Versa", "Sedan", 5, "Guadalajara", 72000, "", "Económico, cómodo y fácil de estacionar para traslados urbanos.");
    insert.run("Honda CR-V", "SUV", 7, "Guadalajara", 148000, "", "SUV familiar de 3 filas ideal para viajes en grupo.");
    insert.run("Volkswagen Jetta", "Sedan", 5, "CDMX", 92000, "", "Sedán amplio y estable con conectividad Bluetooth y control crucero.");
  }
}

export function seedAdmin(database = db, { email, password, name = "AutoGo Admin" } = {}) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail || !password) return null;

  const existingAdmin = database.prepare("SELECT id, email, role FROM users WHERE role = 'admin' LIMIT 1").get();
  if (existingAdmin) return existingAdmin;

  const existingByEmail = database.prepare("SELECT id, email, role FROM users WHERE email = ?").get(normalizedEmail);
  if (existingByEmail) {
    database.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(existingByEmail.id);
    return { ...existingByEmail, role: "admin" };
  }

  const result = database.prepare(
    "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'admin')"
  ).run(name, normalizedEmail, hashPassword(password));
  return { id: Number(result.lastInsertRowid), email: normalizedEmail, role: "admin" };
}
