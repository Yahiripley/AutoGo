import React, { useState } from "react";
import { api } from "../api.js";
import { useI18n } from "../i18n.js";
import { calculateRentalDays, formatCurrency, formatDateTime } from "../format.js";

export function ReservationsView({ reservations, vehicles, currency, onReload, onNotify }) {
  const { lang, t, translateError } = useI18n();
  const [editing, setEditing] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelPreview, setCancelPreview] = useState(null);
  const [busy, setBusy] = useState(false);

  function openModify(reservation) {
    setEditing({
      id: reservation.id,
      vehicleId: String(reservation.vehicle_id),
      start: reservation.start_at,
      end: reservation.end_at,
    });
  }

  async function saveModification(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await api(`/reservations/${editing.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          vehicleId: Number(editing.vehicleId),
          start: editing.start,
          end: editing.end,
        }),
      });
      setEditing(null);
      onNotify("success", t("modifySuccessMsg"));
      await onReload();
    } catch (error) {
      onNotify("error", translateError(error));
    } finally {
      setBusy(false);
    }
  }

  async function openCancelConfirm(reservation) {
    setCancelTarget(reservation);
    setCancelPreview(null);
    try {
      const preview = await api(`/reservations/${reservation.id}/cancellation-preview`);
      setCancelPreview(preview);
    } catch (error) {
      setCancelTarget(null);
      onNotify("error", translateError(error));
    }
  }

  async function executeCancellation() {
    if (!cancelTarget) return;
    setBusy(true);
    try {
      const body = await api(`/reservations/${cancelTarget.id}/cancel`, { method: "POST" });
      setCancelTarget(null);
      setCancelPreview(null);
      onNotify(
        "success",
        body.refundCents > 0
          ? t("cancelledSuccessWithRefund", {
              amount: formatCurrency(body.refundCents, { currency, lang }),
            })
          : t("cancelledSuccessNoCharge")
      );
      await onReload();
    } catch (error) {
      onNotify("error", translateError(error));
    } finally {
      setBusy(false);
    }
  }

  const editingVehicle = editing
    ? vehicles.find((v) => String(v.id) === String(editing.vehicleId))
    : null;
  const editingDays = editing ? calculateRentalDays(editing.start, editing.end) : 0;
  const editingEstimatedCents =
    editingVehicle && editingDays > 0 ? editingVehicle.daily_price_cents * editingDays : null;

  return (
    <main>
      <div className="section-head">
        <h1>{t("reservationsTitle")}</h1>
        <p>{t("reservationsSubtitle")}</p>
      </div>

      <div className="results">
        {reservations.map((reservation) => {
          const isCancelled = reservation.status === "cancelled";
          return (
            <article className="reservation-card" key={reservation.id}>
              <div className="reservation-top">
                <div>
                  <h2>{reservation.vehicle_name}</h2>
                  <p className="meta-line">
                    <span>#{reservation.id}</span>
                    <span>·</span>
                    <span>{reservation.pickup_location}</span>
                  </p>
                </div>
                <div className="badge-group">
                  <span className={isCancelled ? "badge badge-muted" : "badge badge-success"}>
                    {isCancelled ? t("statusCancelled") : t("statusConfirmed")}
                  </span>
                  <span className={reservation.payment_status === "paid" ? "badge badge-info" : "badge badge-warn"}>
                    {reservation.payment_status === "paid" ? t("paymentStatusPaid") : t("paymentStatusPending")}
                  </span>
                </div>
              </div>

              <div className="detail-grid">
                <div>
                  <span className="detail-label">{t("periodLabel")}</span>
                  <strong>
                    {formatDateTime(reservation.start_at, lang)} → {formatDateTime(reservation.end_at, lang)}
                  </strong>
                </div>
                <div>
                  <span className="detail-label">{t("totalLabel")}</span>
                  <strong>{formatCurrency(reservation.total_cents, { currency, lang })}</strong>
                </div>
                {reservation.refund_cents > 0 && (
                  <div>
                    <span className="detail-label">{t("refundLabel")}</span>
                    <strong>
                      {formatCurrency(reservation.refund_cents, { currency, lang })} (
                      {reservation.refund_status === "completed"
                        ? t("refundStatusCompleted")
                        : t("refundStatusPending")}
                      )
                    </strong>
                  </div>
                )}
              </div>

              {!isCancelled && (
                <div className="btn-row">
                  <button type="button" className="btn-outline" onClick={() => openModify(reservation)}>
                    {t("modifyBtn")}
                  </button>
                  <button type="button" className="btn-danger" onClick={() => openCancelConfirm(reservation)}>
                    {t("cancelBtn")}
                  </button>
                </div>
              )}
            </article>
          );
        })}
        {reservations.length === 0 && <p className="empty">{t("noReservations")}</p>}
      </div>

      {editing && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <form className="modal" onSubmit={saveModification}>
            <button className="close" type="button" onClick={() => setEditing(null)} aria-label={t("close")}>
              ×
            </button>
            <h2>{t("modifyModalTitle", { id: editing.id })}</h2>
            <label>
              <span>{t("modifyVehicleLabel")}</span>
              <select
                value={editing.vehicleId}
                onChange={(e) => setEditing({ ...editing, vehicleId: e.target.value })}
              >
                {vehicles.map((v) => (
                  <option value={v.id} key={v.id}>
                    {v.name} — {v.location} ({formatCurrency(v.daily_price_cents, { currency, lang })})
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{t("pickupLabel")}</span>
              <input
                type="datetime-local"
                value={editing.start}
                onChange={(e) => setEditing({ ...editing, start: e.target.value })}
                required
              />
            </label>
            <label>
              <span>{t("returnLabel")}</span>
              <input
                type="datetime-local"
                value={editing.end}
                onChange={(e) => setEditing({ ...editing, end: e.target.value })}
                required
              />
            </label>
            <div className="price-summary">
              <div className="price-total-row">
                <span>{t("modifyNewTotalLabel")}</span>
                <strong>
                  {editingEstimatedCents !== null
                    ? formatCurrency(editingEstimatedCents, { currency, lang })
                    : "—"}
                </strong>
              </div>
            </div>
            <div className="btn-row end">
              <button type="button" className="btn-ghost" onClick={() => setEditing(null)}>
                {t("close")}
              </button>
              <button className="primary" disabled={busy || editingDays === 0}>
                {t("modifySaveBtn")}
              </button>
            </div>
          </form>
        </div>
      )}

      {cancelTarget && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <section className="modal">
            <button
              className="close"
              type="button"
              onClick={() => {
                setCancelTarget(null);
                setCancelPreview(null);
              }}
              aria-label={t("close")}
            >
              ×
            </button>
            <h2>{t("cancelModalTitle")}</h2>
            <p>{t("cancelModalQuestion", { vehicle: cancelTarget.vehicle_name })}</p>

            {cancelPreview && (
              <div className="policy-box">
                <p>
                  {cancelPreview.tier === "free" &&
                    t("cancelTierFree", { hours: cancelPreview.policy.freeCancellationHours })}
                  {cancelPreview.tier === "partial" &&
                    t("cancelTierPartial", {
                      hours: cancelPreview.policy.freeCancellationHours,
                      percent: cancelPreview.policy.partialRefundPercent,
                    })}
                  {cancelPreview.tier === "none" && t("cancelTierNone")}
                  {cancelPreview.tier === "pickup_pending" && t("cancelTierPickup")}
                </p>
                <p className="refund-highlight">
                  <span>{t("cancelEstimatedRefund")} </span>
                  <strong>{formatCurrency(cancelPreview.refundCents, { currency, lang })}</strong>
                </p>
              </div>
            )}

            <div className="btn-row end">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  setCancelTarget(null);
                  setCancelPreview(null);
                }}
              >
                {t("cancelKeepBtn")}
              </button>
              <button
                type="button"
                className="btn-danger"
                disabled={busy || !cancelPreview}
                onClick={executeCancellation}
              >
                {t("cancelConfirmBtn")}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
