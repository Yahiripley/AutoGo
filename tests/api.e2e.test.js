import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createDatabase } from "../server/db.js";
import { createApp } from "../server/index.js";

function extractCookie(response) {
  const setCookie = response.headers.get("set-cookie");
  if (!setCookie) return "";
  return setCookie.split(";")[0];
}

async function startTestServer(database, envOverrides = {}) {
  const { app } = createApp({
    database,
    env: {
      NODE_ENV: "test",
      AUTOGO_SESSION_SECRET: "e2e-secret-key",
      AUTOGO_PAYMENT_PROVIDER: "mock",
      AUTOGO_FREE_CANCELLATION_HOURS: "48",
      AUTOGO_PARTIAL_REFUND_PERCENT: "50",
      ...envOverrides,
    },
  });
  const server = await new Promise((resolve) => {
    const srv = app.listen(0, "127.0.0.1", () => resolve(srv));
  });
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  return { server, baseUrl };
}

test("end-to-end flows: persistent sessions, search, concurrent booking, payment recovery, modify, cancel, and admin", async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "autogo-e2e-"));
  const dbPath = path.join(dir, "e2e.sqlite");
  let database = createDatabase(dbPath);
  let { server, baseUrl } = await startTestServer(database);

  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    database.close();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  // 1. Register user A and verify session survives server/app restart
  const regA = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Ana", email: "ana@example.com", password: "Password123!" }),
  });
  assert.equal(regA.status, 201);
  const cookieA = extractCookie(regA);
  assert.ok(cookieA.startsWith("autogo_session="));

  await new Promise((resolve) => server.close(resolve));
  database.close();
  database = createDatabase(dbPath);
  ({ server, baseUrl } = await startTestServer(database));

  const meAfterRestart = await fetch(`${baseUrl}/api/auth/me`, { headers: { Cookie: cookieA } });
  const meBody = await meAfterRestart.json();
  assert.equal(meBody.user.email, "ana@example.com");

  // 2. Locations & case-insensitive partial search + sorting + invalid dates
  const locRes = await fetch(`${baseUrl}/api/locations`);
  const locBody = await locRes.json();
  assert.ok(locBody.locations.includes("Monterrey"));

  const searchRes = await fetch(`${baseUrl}/api/vehicles?location=monte&sort=price_asc`);
  const searchBody = await searchRes.json();
  assert.ok(searchBody.vehicles.length >= 2);
  assert.ok(searchBody.vehicles.every((v) => v.location.toLowerCase().includes("monte")));
  assert.ok(searchBody.vehicles[0].daily_price_cents <= searchBody.vehicles[1].daily_price_cents);

  const badDateRes = await fetch(`${baseUrl}/api/vehicles?start=2026-12-10T10:00&end=2026-12-09T10:00`);
  assert.equal(badDateRes.status, 400);
  assert.equal((await badDateRes.json()).code, "INVALID_DATE_RANGE");

  // 3. Unauthenticated booking denied, payment failure recovers via pickup
  const targetVehicle = searchBody.vehicles[0];
  const unauthRes = await fetch(`${baseUrl}/api/reservations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      vehicleId: targetVehicle.id,
      start: "2027-01-10T10:00",
      end: "2027-01-13T10:00",
      paymentMethod: "pickup",
    }),
  });
  assert.equal(unauthRes.status, 401);
  assert.equal((await unauthRes.json()).code, "AUTH_REQUIRED");

  const failedPayRes = await fetch(`${baseUrl}/api/reservations`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieA },
    body: JSON.stringify({
      vehicleId: targetVehicle.id,
      start: "2027-01-10T10:00",
      end: "2027-01-13T10:00",
      paymentMethod: "immediate",
      paymentResult: "failure",
    }),
  });
  assert.equal(failedPayRes.status, 402);
  assert.equal((await failedPayRes.json()).code, "PAYMENT_FAILED");

  // Concurrent race on same vehicle & dates
  const regB = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Luis", email: "luis@example.com", password: "Password123!" }),
  });
  const cookieB = extractCookie(regB);

  const [raceA, raceB] = await Promise.all([
    fetch(`${baseUrl}/api/reservations`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieA },
      body: JSON.stringify({
        vehicleId: targetVehicle.id,
        start: "2027-01-10T10:00",
        end: "2027-01-13T10:00",
        paymentMethod: "immediate",
      }),
    }),
    fetch(`${baseUrl}/api/reservations`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieB },
      body: JSON.stringify({
        vehicleId: targetVehicle.id,
        start: "2027-01-10T10:00",
        end: "2027-01-13T10:00",
        paymentMethod: "pickup",
      }),
    }),
  ]);
  const statuses = [raceA.status, raceB.status].sort();
  assert.deepEqual(statuses, [201, 409]);
  const winnerCookie = raceA.status === 201 ? cookieA : cookieB;
  const loserCookie = raceA.status === 201 ? cookieB : cookieA;
  const winnerBody = await (raceA.status === 201 ? raceA : raceB).json();
  const reservationId = winnerBody.reservation.id;

  // 4. Cross-account access denied + owner modify recalculates total
  const crossPatch = await fetch(`${baseUrl}/api/reservations/${reservationId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: loserCookie },
    body: JSON.stringify({ start: "2027-01-11T10:00", end: "2027-01-15T10:00" }),
  });
  assert.equal(crossPatch.status, 403);

  const ownerPatch = await fetch(`${baseUrl}/api/reservations/${reservationId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: winnerCookie },
    body: JSON.stringify({ start: "2027-01-10T10:00", end: "2027-01-15T10:00" }),
  });
  assert.equal(ownerPatch.status, 200);
  const patchedBody = await ownerPatch.json();
  assert.equal(patchedBody.reservation.total_cents, targetVehicle.daily_price_cents * 5);

  // 5. Cancellation preview & free cancellation (far future -> 100% refund if paid, or 0 if pickup)
  const previewRes = await fetch(`${baseUrl}/api/reservations/${reservationId}/cancellation-preview`, {
    headers: { Cookie: winnerCookie },
  });
  assert.equal(previewRes.status, 200);
  const previewBody = await previewRes.json();
  if (winnerBody.reservation.payment_status === "paid") {
    assert.equal(previewBody.tier, "free");
    assert.equal(previewBody.refundCents, patchedBody.reservation.total_cents);
  } else {
    assert.equal(previewBody.tier, "pickup_pending");
    assert.equal(previewBody.refundCents, 0);
  }

  const cancelRes = await fetch(`${baseUrl}/api/reservations/${reservationId}/cancel`, {
    method: "POST",
    headers: { Cookie: winnerCookie },
  });
  assert.equal(cancelRes.status, 200);
  assert.equal((await cancelRes.json()).refundCents, previewBody.refundCents);

  // Late cancellation scenario (< 48h before pickup on immediate payment -> 50%)
  const soonStart = new Date(Date.now() + 12 * 3600000).toISOString().slice(0, 16);
  const soonEnd = new Date(Date.now() + 60 * 3600000).toISOString().slice(0, 16);
  const lateBook = await fetch(`${baseUrl}/api/reservations`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookieA },
    body: JSON.stringify({
      vehicleId: targetVehicle.id,
      start: soonStart,
      end: soonEnd,
      paymentMethod: "immediate",
    }),
  });
  assert.equal(lateBook.status, 201);
  const lateId = (await lateBook.json()).reservation.id;
  const lateCancel = await fetch(`${baseUrl}/api/reservations/${lateId}/cancel`, {
    method: "POST",
    headers: { Cookie: cookieA },
  });
  const lateCancelBody = await lateCancel.json();
  assert.equal(lateCancelBody.tier, "partial");
  assert.equal(lateCancelBody.refundCents, Math.floor(lateCancelBody.reservation.total_cents * 0.5));

  // 6. Customer denied admin access; seeded admin can manage vehicles, blocks, and view reservations
  const customerAdminTry = await fetch(`${baseUrl}/api/admin/vehicles`, { headers: { Cookie: cookieA } });
  assert.equal(customerAdminTry.status, 403);

  const adminLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@autogo.local", password: "Admin123!" }),
  });
  assert.equal(adminLogin.status, 200);
  const adminCookie = extractCookie(adminLogin);

  // Disable vehicle -> hidden from public search, visible in admin list, then restore
  await fetch(`${baseUrl}/api/admin/vehicles/${targetVehicle.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({ active: false }),
  });
  const publicAfterDisable = await (await fetch(`${baseUrl}/api/vehicles`)).json();
  assert.ok(!publicAfterDisable.vehicles.some((v) => v.id === targetVehicle.id));
  const adminVehicles = await (await fetch(`${baseUrl}/api/admin/vehicles`, { headers: { Cookie: adminCookie } })).json();
  assert.ok(adminVehicles.vehicles.some((v) => v.id === targetVehicle.id && v.active === 0));

  await fetch(`${baseUrl}/api/admin/vehicles/${targetVehicle.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({ active: true }),
  });

  // Create block -> excludes from search -> delete block -> searchable again
  const blockRes = await fetch(`${baseUrl}/api/admin/vehicles/${targetVehicle.id}/blocks`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({ start: "2027-03-01T10:00", end: "2027-03-05T10:00", reason: "Service" }),
  });
  assert.equal(blockRes.status, 201);
  const blockId = (await blockRes.json()).block.id;

  const blockedSearch = await (
    await fetch(`${baseUrl}/api/vehicles?start=2027-03-02T10:00&end=2027-03-04T10:00`)
  ).json();
  assert.ok(!blockedSearch.vehicles.some((v) => v.id === targetVehicle.id));

  const delBlock = await fetch(`${baseUrl}/api/admin/blocks/${blockId}`, {
    method: "DELETE",
    headers: { Cookie: adminCookie },
  });
  assert.equal(delBlock.status, 200);

  const unblockedSearch = await (
    await fetch(`${baseUrl}/api/vehicles?start=2027-03-02T10:00&end=2027-03-04T10:00`)
  ).json();
  assert.ok(unblockedSearch.vehicles.some((v) => v.id === targetVehicle.id));

  // Admin reservation visibility & privacy (no password_hash)
  const adminResList = await (
    await fetch(`${baseUrl}/api/admin/reservations?status=cancelled`, { headers: { Cookie: adminCookie } })
  ).json();
  assert.ok(adminResList.reservations.length >= 2);
  assert.equal(adminResList.reservations[0].password_hash, undefined);
});
