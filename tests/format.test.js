import test from "node:test";
import assert from "node:assert/strict";
import {
  formatCurrency,
  centsToCurrencyInput,
  currencyInputToCents,
  calculateRentalDays,
  getPresetDates,
} from "../src/format.js";

test("currency helpers convert between cents and display strings cleanly", () => {
  assert.equal(currencyInputToCents("850"), 85000);
  assert.equal(currencyInputToCents("850.50"), 85050);
  assert.equal(centsToCurrencyInput(85000), "850");
  assert.match(formatCurrency(85000, { currency: "MXN", lang: "es" }), /850.*MXN/);
});

test("calculateRentalDays enforces valid ordering and minimum 1 day", () => {
  assert.equal(calculateRentalDays("2026-12-01T10:00", "2026-12-01T10:00"), 0);
  assert.equal(calculateRentalDays("2026-12-02T10:00", "2026-12-01T10:00"), 0);
  assert.equal(calculateRentalDays("2026-12-01T10:00", "2026-12-01T14:00"), 1);
  assert.equal(calculateRentalDays("2026-12-01T10:00", "2026-12-04T10:00"), 3);
});

test("getPresetDates builds a valid future start and end window", () => {
  const base = new Date("2026-11-23T15:30:00");
  const { start, end } = getPresetDates(3, base);
  assert.equal(start, "2026-11-24T10:00");
  assert.equal(end, "2026-11-27T10:00");
  assert.equal(calculateRentalDays(start, end), 3);
});
