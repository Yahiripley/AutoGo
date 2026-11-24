import crypto from "node:crypto";
import express from "express";
import path from "node:path";
import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { migrate, seedAdmin, db } from "./db.js";
import { readConfig } from "./config.js";
import { processImmediatePayment } from "./payments.js";
import { hashPassword, verifyPassword, signSessionId, verifySessionCookie } from "./security.js";

function parseCookies(header = "") {
  return Object.fromEntries(
    header
      .split(";")
      .map((part) => {
        const [key, ...value] = part.trim().split("=");
        return [key, value.join("=")];
      })
      .filter(([key]) => key)
  );
}

function apiError(res, status, code, error, details) {
  return res.status(status).json({ error, code, ...(details ? { details } : {}) });
}

export function calculateCancellationOutcome(reservation, now = new Date()) {
  const policy = JSON.parse(reservation.policy_snapshot);
  const hoursUntilPickup = (new Date(reservation.start_at) - now) / 3600000;
  if (reservation.payment_status !== "paid") {
    return {
      tier: "pickup_pending",
      refundCents: 0,
      totalCents: reservation.total_cents,
      hoursUntilPickup,
      policy,
    };
  }
  const isFree = hoursUntilPickup >= policy.freeCancellationHours;
  const refundCents = isFree
    ? reservation.total_cents
    : Math.floor((reservation.total_cents * policy.partialRefundPercent) / 100);
  return {
    tier: isFree ? "free" : (refundCents > 0 ? "partial" : "none"),
    refundCents,
    totalCents: reservation.total_cents,
    hoursUntilPickup,
    policy,
  };
}

function loadConfig(env = process.env) {
  try {
    return readConfig(env);
  } catch (error) {
    if (env.NODE_ENV === "production") throw error;
    return {
      sessionSecret: "development-only-session-secret",
      currency: env.AUTOGO_BASE_CURRENCY || "MXN",
      freeCancellationHours: Number(env.AUTOGO_FREE_CANCELLATION_HOURS ?? 48),
      partialRefundPercent: Number(env.AUTOGO_PARTIAL_REFUND_PERCENT ?? 50),
      paymentProvider: env.AUTOGO_PAYMENT_PROVIDER || "mock",
      sessionTtlDays: Number(env.AUTOGO_SESSION_TTL_DAYS ?? 7),
      adminEmail: String(env.AUTOGO_ADMIN_EMAIL || "admin@autogo.local").trim().toLowerCase(),
      adminPassword: String(env.AUTOGO_ADMIN_PASSWORD || "Admin123!"),
      adminName: String(env.AUTOGO_ADMIN_NAME || "AutoGo Admin").trim(),
      isDevDemoAdmin: !env.AUTOGO_ADMIN_EMAIL,
    };
  }
}

export function createApp({ database = db, env = process.env, configOverride = null } = {}) {
  migrate(database);
  const config = configOverride || loadConfig(env);
  if (config.adminEmail && config.adminPassword) {
    seedAdmin(database, {
      email: config.adminEmail,
      password: config.adminPassword,
      name: config.adminName,
    });
  }

  const app = express();
  app.use(express.json());
  const cookieName = "autogo_session";

  function cleanupExpiredSessions() {
    database.prepare("DELETE FROM sessions WHERE expires_at <= datetime('now')").run();
  }

  function sessionUser(req) {
    const rawCookie = parseCookies(req.headers.cookie)[cookieName];
    const sessionId = verifySessionCookie(rawCookie, config.sessionSecret);
    if (!sessionId) return null;
    cleanupExpiredSessions();
    const row = database
      .prepare(`
        SELECT u.id, u.name, u.email, u.role
        FROM sessions s
        JOIN users u ON u.id = s.user_id
        WHERE s.id = ? AND s.expires_at > datetime('now')
      `)
      .get(sessionId);
    return row || null;
  }

  function requireAuth(req, res, next) {
    const user = sessionUser(req);
    if (!user) return apiError(res, 401, "AUTH_REQUIRED", "Authentication required.");
    req.user = user;
    next();
  }

  function requireAdmin(req, res, next) {
    const user = sessionUser(req);
    if (!user) return apiError(res, 401, "AUTH_REQUIRED", "Authentication required.");
    if (user.role !== "admin") return apiError(res, 403, "ADMIN_REQUIRED", "Administrator access required.");
    req.user = user;
    next();
  }

  function setSession(res, userId) {
    cleanupExpiredSessions();
    const id = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + config.sessionTtlDays * 86400000)
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");
    database.prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)").run(id, userId, expiresAt);
    const signed = signSessionId(id, config.sessionSecret);
    res.setHeader("Set-Cookie", `${cookieName}=${signed}; HttpOnly; Path=/; SameSite=Lax`);
  }

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      currency: config.currency,
      freeCancellationHours: config.freeCancellationHours,
      partialRefundPercent: config.partialRefundPercent,
      demoAdminEmail: config.isDevDemoAdmin ? config.adminEmail : null,
    });
  });

  app.post("/api/auth/register", (req, res) => {
    const { name, email, password } = req.body || {};
    if (!name || !String(name).trim() || !email || !String(email).includes("@") || typeof password !== "string" || password.length < 8) {
      return apiError(res, 400, "INVALID_REGISTER_INPUT", "Name, valid email, and an 8-character password are required.");
    }
    try {
      const normalizedEmail = String(email).trim().toLowerCase();
      const trimmedName = String(name).trim();
      const result = database
        .prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'customer')")
        .run(trimmedName, normalizedEmail, hashPassword(password));
      const userId = Number(result.lastInsertRowid);
      setSession(res, userId);
      res.status(201).json({ user: { id: userId, name: trimmedName, email: normalizedEmail, role: "customer" } });
    } catch (error) {
      if (String(error).includes("UNIQUE")) {
        return apiError(res, 409, "EMAIL_EXISTS", "An account with this email already exists.");
      }
      throw error;
    }
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body || {};
    const user = database.prepare("SELECT * FROM users WHERE email = ?").get(String(email || "").trim().toLowerCase());
    if (!user || !verifyPassword(String(password || ""), user.password_hash)) {
      return apiError(res, 401, "INVALID_CREDENTIALS", "Invalid email or password.");
    }
    setSession(res, user.id);
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  });

  app.get("/api/auth/me", (req, res) => {
    res.json({ user: sessionUser(req) });
  });

  app.post("/api/auth/logout", (req, res) => {
    const rawCookie = parseCookies(req.headers.cookie)[cookieName];
    const sessionId = verifySessionCookie(rawCookie, config.sessionSecret);
    if (sessionId) {
      database.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
    }
    res.setHeader("Set-Cookie", `${cookieName}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`);
    res.json({ ok: true });
  });

  app.get("/api/locations", (_req, res) => {
    const rows = database
      .prepare("SELECT DISTINCT location FROM vehicles WHERE active = 1 ORDER BY location COLLATE NOCASE ASC")
      .all();
    res.json({ locations: rows.map((row) => row.location) });
  });

  app.get("/api/vehicles", (req, res) => {
    const location = String(req.query.location || "").trim();
    const category = String(req.query.category || "").trim();
    const capacity = Number(req.query.capacity || 0);
    const start = String(req.query.start || "");
    const end = String(req.query.end || "");
    const sort = String(req.query.sort || "");

    if ((start && !end) || (!start && end) || (start && end && end <= start)) {
      return apiError(res, 400, "INVALID_DATE_RANGE", "Return date must be later than pickup date.");
    }

    let sql = "SELECT * FROM vehicles WHERE active = 1";
    const params = [];
    if (location) {
      sql += " AND LOWER(location) LIKE ?";
      params.push(`%${location.toLowerCase()}%`);
    }
    if (category) {
      sql += " AND LOWER(category) = ?";
      params.push(category.toLowerCase());
    }
    if (capacity > 0) {
      sql += " AND capacity >= ?";
      params.push(capacity);
    }
    if (start && end) {
      sql += ` AND NOT EXISTS (
        SELECT 1 FROM reservations r
        WHERE r.vehicle_id = vehicles.id AND r.status <> 'cancelled'
        AND r.start_at < ? AND r.end_at > ?
      ) AND NOT EXISTS (
        SELECT 1 FROM inventory_blocks b
        WHERE b.vehicle_id = vehicles.id AND b.start_at < ? AND b.end_at > ?
      )`;
      params.push(end, start, end, start);
    }

    if (sort === "price_asc") sql += " ORDER BY daily_price_cents ASC, id ASC";
    else if (sort === "price_desc") sql += " ORDER BY daily_price_cents DESC, id ASC";
    else if (sort === "capacity_desc") sql += " ORDER BY capacity DESC, daily_price_cents ASC";
    else sql += " ORDER BY id ASC";

    res.json({ vehicles: database.prepare(sql).all(...params) });
  });

  app.get("/api/vehicles/:id", (req, res) => {
    const vehicle = database.prepare("SELECT * FROM vehicles WHERE id = ? AND active = 1").get(req.params.id);
    if (!vehicle) return apiError(res, 404, "VEHICLE_NOT_FOUND", "Vehicle not found.");

    const { start, end } = req.query;
    let available = true;
    if (start && end) {
      if (String(end) <= String(start)) {
        return apiError(res, 400, "INVALID_DATE_RANGE", "Return date must be later than pickup date.");
      }
      const conflict = database
        .prepare(`
          SELECT 1 FROM reservations WHERE vehicle_id = ? AND status <> 'cancelled' AND start_at < ? AND end_at > ?
          UNION ALL
          SELECT 1 FROM inventory_blocks WHERE vehicle_id = ? AND start_at < ? AND end_at > ?
        `)
        .get(vehicle.id, String(end), String(start), vehicle.id, String(end), String(start));
      available = !conflict;
    }

    res.json({ vehicle, available });
  });

  app.post("/api/reservations", requireAuth, async (req, res) => {
    const { vehicleId, start, end, location, paymentMethod, paymentResult } = req.body || {};
    if (!vehicleId || !start || !end || end <= start) {
      return apiError(res, 400, "INVALID_RESERVATION_INPUT", "A valid vehicle and rental period are required.");
    }
    if (!["immediate", "pickup"].includes(paymentMethod)) {
      return apiError(res, 400, "INVALID_PAYMENT_METHOD", "Choose immediate or pickup payment.");
    }
    const vehicle = database.prepare("SELECT * FROM vehicles WHERE id = ? AND active = 1").get(vehicleId);
    if (!vehicle) return apiError(res, 404, "VEHICLE_UNAVAILABLE", "Vehicle is unavailable.");

    try {
      database.exec("BEGIN IMMEDIATE");
      const conflict = database
        .prepare(`
          SELECT 1 FROM reservations
          WHERE vehicle_id = ? AND status <> 'cancelled' AND start_at < ? AND end_at > ?
          UNION ALL
          SELECT 1 FROM inventory_blocks
          WHERE vehicle_id = ? AND start_at < ? AND end_at > ?
        `)
        .get(vehicleId, end, start, vehicleId, end, start);
      if (conflict) {
        database.exec("ROLLBACK");
        return apiError(res, 409, "VEHICLE_UNAVAILABLE", "This vehicle became unavailable for the selected dates.");
      }
      const days = Math.max(1, Math.ceil((new Date(end) - new Date(start)) / 86400000));
      const total = vehicle.daily_price_cents * days;
      let payment = { status: "pending", reference: null };
      if (paymentMethod === "immediate") {
        payment = await processImmediatePayment({
          amountCents: total,
          provider: config.paymentProvider,
          result: paymentResult,
        });
        if (payment.status !== "paid") {
          database.exec("ROLLBACK");
          return apiError(res, 402, "PAYMENT_FAILED", "Immediate payment failed. Reservation was not created.");
        }
      }
      const policy = JSON.stringify({
        freeCancellationHours: config.freeCancellationHours,
        partialRefundPercent: config.partialRefundPercent,
      });
      const result = database
        .prepare(`
          INSERT INTO reservations
          (user_id, vehicle_id, pickup_location, start_at, end_at, total_cents, status, payment_method, payment_status, policy_snapshot)
          VALUES (?, ?, ?, ?, ?, ?, 'confirmed', ?, ?, ?)
        `)
        .run(
          req.user.id,
          vehicleId,
          location || vehicle.location,
          start,
          end,
          total,
          paymentMethod,
          paymentMethod === "pickup" ? "pending" : "paid",
          policy
        );
      const reservationId = Number(result.lastInsertRowid);
      database
        .prepare(`
          INSERT INTO payments (reservation_id, method, status, amount_cents, provider, provider_reference)
          VALUES (?, ?, ?, ?, ?, ?)
        `)
        .run(
          reservationId,
          paymentMethod,
          paymentMethod === "pickup" ? "pending" : payment.status,
          total,
          config.paymentProvider,
          payment.reference
        );
      database.exec("COMMIT");
      res.status(201).json({ reservation: database.prepare("SELECT * FROM reservations WHERE id = ?").get(reservationId) });
    } catch (error) {
      try {
        database.exec("ROLLBACK");
      } catch {}
      throw error;
    }
  });

  app.get("/api/reservations", requireAuth, (req, res) => {
    const reservations = database
      .prepare(`
        SELECT r.*,
               v.name AS vehicle_name,
               v.category AS vehicle_category,
               v.capacity AS vehicle_capacity,
               v.location AS vehicle_location,
               v.daily_price_cents AS vehicle_daily_price_cents,
               v.description AS vehicle_description,
               (SELECT status FROM refunds rf WHERE rf.reservation_id = r.id ORDER BY rf.id DESC LIMIT 1) AS refund_status
        FROM reservations r
        JOIN vehicles v ON v.id = r.vehicle_id
        WHERE r.user_id = ?
        ORDER BY r.created_at DESC, r.id DESC
      `)
      .all(req.user.id);
    res.json({ reservations });
  });

  app.patch("/api/reservations/:id", requireAuth, (req, res) => {
    const reservation = database.prepare("SELECT * FROM reservations WHERE id = ?").get(req.params.id);
    if (!reservation) return apiError(res, 404, "RESERVATION_NOT_FOUND", "Reservation not found.");
    if (reservation.user_id !== req.user.id) {
      return apiError(res, 403, "RESERVATION_ACCESS_DENIED", "Reservation access denied.");
    }
    if (reservation.status === "cancelled") {
      return apiError(res, 409, "RESERVATION_CANCELLED", "Cancelled reservations cannot be modified.");
    }

    const vehicleId = Number(req.body?.vehicleId || reservation.vehicle_id);
    const start = String(req.body?.start || reservation.start_at);
    const end = String(req.body?.end || reservation.end_at);
    if (end <= start) return apiError(res, 400, "INVALID_DATE_RANGE", "A valid rental period is required.");
    const vehicle = database.prepare("SELECT * FROM vehicles WHERE id = ? AND active = 1").get(vehicleId);
    if (!vehicle) return apiError(res, 404, "REPLACEMENT_UNAVAILABLE", "Replacement vehicle is unavailable.");

    try {
      database.exec("BEGIN IMMEDIATE");
      const conflict = database
        .prepare(`
          SELECT 1 FROM reservations
          WHERE id <> ? AND vehicle_id = ? AND status <> 'cancelled' AND start_at < ? AND end_at > ?
          UNION ALL
          SELECT 1 FROM inventory_blocks
          WHERE vehicle_id = ? AND start_at < ? AND end_at > ?
        `)
        .get(reservation.id, vehicleId, end, start, vehicleId, end, start);
      if (conflict) {
        database.exec("ROLLBACK");
        return apiError(res, 409, "VEHICLE_UNAVAILABLE", "The selected vehicle is unavailable for those dates.");
      }
      const days = Math.max(1, Math.ceil((new Date(end) - new Date(start)) / 86400000));
      const total = vehicle.daily_price_cents * days;
      database
        .prepare(`
          UPDATE reservations
          SET vehicle_id = ?, start_at = ?, end_at = ?, pickup_location = ?, total_cents = ?
          WHERE id = ?
        `)
        .run(vehicleId, start, end, req.body?.location || vehicle.location, total, reservation.id);
      database.exec("COMMIT");
      res.json({ reservation: database.prepare("SELECT * FROM reservations WHERE id = ?").get(reservation.id) });
    } catch (error) {
      try {
        database.exec("ROLLBACK");
      } catch {}
      throw error;
    }
  });

  app.get("/api/reservations/:id/cancellation-preview", requireAuth, (req, res) => {
    const reservation = database.prepare("SELECT * FROM reservations WHERE id = ?").get(req.params.id);
    if (!reservation) return apiError(res, 404, "RESERVATION_NOT_FOUND", "Reservation not found.");
    if (reservation.user_id !== req.user.id) {
      return apiError(res, 403, "RESERVATION_ACCESS_DENIED", "Reservation access denied.");
    }
    if (reservation.status === "cancelled") {
      return apiError(res, 409, "RESERVATION_ALREADY_CANCELLED", "Reservation is already cancelled.");
    }
    const outcome = calculateCancellationOutcome(reservation);
    res.json({ reservationId: reservation.id, ...outcome });
  });

  app.post("/api/reservations/:id/cancel", requireAuth, (req, res) => {
    const reservation = database.prepare("SELECT * FROM reservations WHERE id = ?").get(req.params.id);
    if (!reservation) return apiError(res, 404, "RESERVATION_NOT_FOUND", "Reservation not found.");
    if (reservation.user_id !== req.user.id) {
      return apiError(res, 403, "RESERVATION_ACCESS_DENIED", "Reservation access denied.");
    }
    if (reservation.status === "cancelled") {
      return apiError(res, 409, "RESERVATION_ALREADY_CANCELLED", "Reservation is already cancelled.");
    }

    const { refundCents, tier } = calculateCancellationOutcome(reservation);
    database.exec("BEGIN IMMEDIATE");
    database
      .prepare("UPDATE reservations SET status = 'cancelled', refund_cents = ? WHERE id = ?")
      .run(refundCents, reservation.id);
    if (refundCents > 0) {
      database
        .prepare("INSERT INTO refunds (reservation_id, amount_cents, status, reason) VALUES (?, ?, 'pending', 'Cancellation')")
        .run(reservation.id, refundCents);
    }
    database.exec("COMMIT");
    res.json({
      reservation: database.prepare("SELECT * FROM reservations WHERE id = ?").get(reservation.id),
      refundCents,
      tier,
    });
  });

  app.get("/api/admin/vehicles", requireAdmin, (_req, res) => {
    const vehicles = database.prepare("SELECT * FROM vehicles ORDER BY active DESC, id DESC").all();
    res.json({ vehicles });
  });

  app.post("/api/admin/vehicles", requireAdmin, (req, res) => {
    const { name, category, capacity, location, dailyPriceCents, description, imageUrl } = req.body || {};
    if (
      !String(name || "").trim() ||
      !String(category || "").trim() ||
      !Number.isFinite(Number(capacity)) ||
      Number(capacity) < 1 ||
      !String(location || "").trim() ||
      !Number.isFinite(Number(dailyPriceCents)) ||
      Number(dailyPriceCents) < 1
    ) {
      return apiError(res, 400, "INVALID_VEHICLE_INPUT", "Complete valid vehicle information is required.");
    }
    const result = database
      .prepare(`
        INSERT INTO vehicles (name, category, capacity, location, daily_price_cents, image_url, description)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        String(name).trim(),
        String(category).trim(),
        Math.round(Number(capacity)),
        String(location).trim(),
        Math.round(Number(dailyPriceCents)),
        String(imageUrl || "").trim(),
        String(description || "").trim()
      );
    res.status(201).json({
      vehicle: database.prepare("SELECT * FROM vehicles WHERE id = ?").get(Number(result.lastInsertRowid)),
    });
  });

  app.patch("/api/admin/vehicles/:id", requireAdmin, (req, res) => {
    const vehicle = database.prepare("SELECT * FROM vehicles WHERE id = ?").get(req.params.id);
    if (!vehicle) return apiError(res, 404, "VEHICLE_NOT_FOUND", "Vehicle not found.");

    const values = {
      name: req.body?.name !== undefined ? String(req.body.name).trim() : vehicle.name,
      category: req.body?.category !== undefined ? String(req.body.category).trim() : vehicle.category,
      capacity: req.body?.capacity !== undefined ? Number(req.body.capacity) : vehicle.capacity,
      location: req.body?.location !== undefined ? String(req.body.location).trim() : vehicle.location,
      daily_price_cents:
        req.body?.dailyPriceCents !== undefined ? Number(req.body.dailyPriceCents) : vehicle.daily_price_cents,
      description: req.body?.description !== undefined ? String(req.body.description).trim() : vehicle.description,
      image_url: req.body?.imageUrl !== undefined ? String(req.body.imageUrl).trim() : vehicle.image_url,
      active: req.body?.active !== undefined ? Boolean(req.body.active) : Boolean(vehicle.active),
    };

    if (
      !values.name ||
      !values.category ||
      !values.location ||
      !Number.isFinite(values.capacity) ||
      values.capacity < 1 ||
      !Number.isFinite(values.daily_price_cents) ||
      values.daily_price_cents < 1
    ) {
      return apiError(res, 400, "INVALID_VEHICLE_INPUT", "Complete valid vehicle information is required.");
    }

    database
      .prepare(`
        UPDATE vehicles SET name=?, category=?, capacity=?, location=?, daily_price_cents=?, image_url=?, description=?, active=?
        WHERE id=?
      `)
      .run(
        values.name,
        values.category,
        Math.round(values.capacity),
        values.location,
        Math.round(values.daily_price_cents),
        values.image_url,
        values.description,
        values.active ? 1 : 0,
        vehicle.id
      );
    res.json({ vehicle: database.prepare("SELECT * FROM vehicles WHERE id = ?").get(vehicle.id) });
  });

  app.get("/api/admin/blocks", requireAdmin, (_req, res) => {
    const blocks = database
      .prepare(`
        SELECT b.*, v.name AS vehicle_name, v.location AS vehicle_location
        FROM inventory_blocks b
        JOIN vehicles v ON v.id = b.vehicle_id
        ORDER BY b.start_at ASC, b.id DESC
      `)
      .all();
    res.json({ blocks });
  });

  app.post("/api/admin/vehicles/:id/blocks", requireAdmin, (req, res) => {
    const vehicle = database.prepare("SELECT id FROM vehicles WHERE id = ?").get(req.params.id);
    if (!vehicle) return apiError(res, 404, "VEHICLE_NOT_FOUND", "Vehicle not found.");

    const { start, end, reason } = req.body || {};
    if (!start || !end || end <= start) {
      return apiError(res, 400, "INVALID_BLOCK_INPUT", "A valid block period is required.");
    }
    const overlap = database
      .prepare(`
        SELECT COUNT(*) AS count
        FROM reservations
        WHERE vehicle_id = ? AND status <> 'cancelled' AND start_at < ? AND end_at > ?
      `)
      .get(vehicle.id, end, start);

    const result = database
      .prepare("INSERT INTO inventory_blocks (vehicle_id, start_at, end_at, reason) VALUES (?, ?, ?, ?)")
      .run(vehicle.id, start, end, String(reason || "").trim());
    res.status(201).json({
      block: database.prepare("SELECT * FROM inventory_blocks WHERE id = ?").get(Number(result.lastInsertRowid)),
      overlappingReservations: overlap.count,
    });
  });

  app.delete("/api/admin/blocks/:id", requireAdmin, (req, res) => {
    const result = database.prepare("DELETE FROM inventory_blocks WHERE id = ?").run(req.params.id);
    if (result.changes === 0) return apiError(res, 404, "BLOCK_NOT_FOUND", "Inventory block not found.");
    res.json({ ok: true });
  });

  app.get("/api/admin/reservations", requireAdmin, (req, res) => {
    const status = String(req.query.status || "").trim();
    const paymentStatus = String(req.query.paymentStatus || "").trim();

    let sql = `
      SELECT r.id, r.user_id, r.vehicle_id, r.pickup_location, r.start_at, r.end_at,
             r.total_cents, r.status, r.payment_method, r.payment_status, r.refund_cents, r.created_at,
             u.name AS customer_name, u.email AS customer_email,
             v.name AS vehicle_name, v.category AS vehicle_category,
             (SELECT status FROM refunds rf WHERE rf.reservation_id = r.id ORDER BY rf.id DESC LIMIT 1) AS refund_status
      FROM reservations r
      JOIN users u ON u.id = r.user_id
      JOIN vehicles v ON v.id = r.vehicle_id
      WHERE 1 = 1
    `;
    const params = [];
    if (status) {
      sql += " AND r.status = ?";
      params.push(status);
    }
    if (paymentStatus) {
      sql += " AND r.payment_status = ?";
      params.push(paymentStatus);
    }
    sql += " ORDER BY r.created_at DESC, r.id DESC";

    res.json({ reservations: database.prepare(sql).all(...params) });
  });

  const distDir = path.resolve("dist");
  if (fs.existsSync(distDir)) app.use(express.static(distDir));

  return { app, config, database };
}

const isEntrypoint = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isEntrypoint) {
  const { app } = createApp();
  const port = Number(process.env.PORT || 3001);
  app.listen(port, "127.0.0.1", () => console.log(`AutoGo API listening on http://127.0.0.1:${port}`));
}
