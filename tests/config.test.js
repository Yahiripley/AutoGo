import test from "node:test";
import assert from "node:assert/strict";
import { readConfig } from "../server/config.js";

test("configuration rejects missing required values", () => {
  assert.throws(
    () => readConfig({}),
    /Missing required configuration/
  );
});

test("configuration accepts valid values and applies defaults", () => {
  const config = readConfig({
    AUTOGO_SESSION_SECRET: "test-secret",
    AUTOGO_PAYMENT_PROVIDER: "mock"
  });
  assert.equal(config.currency, "MXN");
  assert.equal(config.freeCancellationHours, 48);
  assert.equal(config.partialRefundPercent, 50);
  assert.equal(config.sessionTtlDays, 7);
  assert.equal(config.adminEmail, "admin@autogo.local");
  assert.equal(config.isDevDemoAdmin, true);
});

test("configuration uses explicit admin credentials and disables dev demo in production", () => {
  const prodConfig = readConfig({
    NODE_ENV: "production",
    AUTOGO_SESSION_SECRET: "prod-secret",
    AUTOGO_PAYMENT_PROVIDER: "mock",
  });
  assert.equal(prodConfig.adminEmail, "");
  assert.equal(prodConfig.isDevDemoAdmin, false);

  const customAdmin = readConfig({
    AUTOGO_SESSION_SECRET: "test-secret",
    AUTOGO_PAYMENT_PROVIDER: "mock",
    AUTOGO_ADMIN_EMAIL: "Boss@AutoGo.mx",
    AUTOGO_ADMIN_PASSWORD: "SuperPassword1",
  });
  assert.equal(customAdmin.adminEmail, "boss@autogo.mx");
  assert.equal(customAdmin.isDevDemoAdmin, false);
});
