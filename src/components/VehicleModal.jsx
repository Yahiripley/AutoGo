import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import { useI18n } from "../i18n.js";
import { calculateRentalDays, formatCurrency, getPresetDates } from "../format.js";

export function VehicleModal({
  vehicle,
  initialStart,
  initialEnd,
  initialPaymentMethod = "pickup",
  meta,
  user,
  onClose,
  onSuccess,
  onRequireAuth,
}) {
  const { lang, t, translateError } = useI18n();
  const fallbackDates = getPresetDates(2);
  const [start, setStart] = useState(initialStart || fallbackDates.start);
  const [end, setEnd] = useState(initialEnd || fallbackDates.end);
  const [paymentMethod, setPaymentMethod] = useState(initialPaymentMethod);
  const [available, setAvailable] = useState(true);
  const [checking, setChecking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [modalError, setModalError] = useState("");
  const [paymentFailed, setPaymentFailed] = useState(false);

  const days = calculateRentalDays(start, end);
  const totalCents = days > 0 ? vehicle.daily_price_cents * days : 0;

  useEffect(() => {
    if (!start || !end || end <= start) return;
    let cancelled = false;
    setChecking(true);
    api(`/vehicles/${vehicle.id}?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`)
      .then((body) => {
        if (!cancelled) setAvailable(body.available !== false);
      })
      .catch(() => {
        if (!cancelled) setAvailable(false);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [vehicle.id, start, end]);

  async function submitBooking(methodOverride = paymentMethod) {
    if (!start || !end || end <= start) {
      setModalError(t("modalChooseDatesPrompt"));
      return;
    }
    if (!user) {
      onRequireAuth({ start, end, paymentMethod: methodOverride });
      return;
    }
    setBusy(true);
    setModalError("");
    setPaymentFailed(false);
    try {
      await api("/reservations", {
        method: "POST",
        body: JSON.stringify({
          vehicleId: vehicle.id,
          start,
          end,
          location: vehicle.location,
          paymentMethod: methodOverride,
        }),
      });
      await onSuccess();
    } catch (error) {
      if (error.code === "PAYMENT_FAILED") {
        setPaymentFailed(true);
      } else if (error.code === "VEHICLE_UNAVAILABLE") {
        setAvailable(false);
      }
      setModalError(translateError(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="vehicle-modal-title">
      <section className="modal modal-lg">
        <button className="close" type="button" onClick={onClose} aria-label={t("close")}>
          ×
        </button>

        <div className="modal-header">
          <span className="badge badge-info">{vehicle.category}</span>
          <h2 id="vehicle-modal-title">
            {t("modalTitlePrefix")} {vehicle.name}
          </h2>
          <p className="meta-line">
            <span>{t("seatsCount", { n: vehicle.capacity })}</span>
            <span>·</span>
            <span>{vehicle.location}</span>
          </p>
        </div>

        {vehicle.image_url && <img className="modal-image" src={vehicle.image_url} alt={vehicle.name} />}
        {vehicle.description && <p className="vehicle-desc">{vehicle.description}</p>}

        <div className="two-col">
          <label>
            <span>{t("pickupLabel")}</span>
            <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
          </label>
          <label>
            <span>{t("returnLabel")}</span>
            <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
          </label>
        </div>

        {checking && <p className="muted-note">{t("modalChecking")}</p>}
        {!checking && !available && <div className="alert alert-error">{t("modalUnavailableBanner")}</div>}

        <div className="price-summary">
          <div>
            <span>{t("modalDaysLabel")}</span>
            <strong>{days > 0 ? days : "—"}</strong>
          </div>
          <div>
            <span>{t("modalDailyRateLabel")}</span>
            <strong>{formatCurrency(vehicle.daily_price_cents, { currency: meta.currency, lang })}</strong>
          </div>
          <div className="price-total-row">
            <span>{t("modalTotalLabel")}</span>
            <strong>
              {days > 0 ? formatCurrency(totalCents, { currency: meta.currency, lang }) : "—"}
            </strong>
          </div>
        </div>

        <div className="policy-box">
          {t("modalPolicySummary", {
            hours: meta.freeCancellationHours,
            percent: meta.partialRefundPercent,
          })}
        </div>

        <label>
          <span>{t("modalPaymentMethod")}</span>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <option value="pickup">{t("paymentPickup")}</option>
            <option value="immediate">{t("paymentImmediate")}</option>
          </select>
        </label>

        {modalError && !paymentFailed && <div className="alert alert-error">{modalError}</div>}

        {paymentFailed && (
          <div className="alert alert-warning recovery-box">
            <strong>{t("modalPaymentRecoveryTitle")}</strong>
            <p>{t("modalPaymentRecoveryDesc")}</p>
            <div className="btn-row">
              <button
                type="button"
                className="btn-outline"
                disabled={busy}
                onClick={() => submitBooking("immediate")}
              >
                {t("modalRetryPayment")}
              </button>
              <button
                type="button"
                className="primary"
                disabled={busy}
                onClick={() => {
                  setPaymentMethod("pickup");
                  submitBooking("pickup");
                }}
              >
                {t("modalSwitchToPickup")}
              </button>
            </div>
          </div>
        )}

        <div className="btn-row end">
          <button type="button" className="btn-ghost" onClick={onClose}>
            {t("close")}
          </button>
          <button
            type="button"
            className="primary"
            disabled={busy || checking || !available || days === 0}
            onClick={() => submitBooking(paymentMethod)}
          >
            {t("modalConfirmBtn")}
          </button>
        </div>
      </section>
    </div>
  );
}
