import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import { useI18n } from "../i18n.js";
import {
  centsToCurrencyInput,
  currencyInputToCents,
  formatCurrency,
  formatDateTime,
} from "../format.js";

const emptyVehicleForm = {
  name: "",
  category: "Sedan",
  capacity: 5,
  location: "",
  dailyPriceMxn: "850",
  description: "",
  imageUrl: "",
};

export function AdminPanel({ currency, onNotify, onCatalogChanged }) {
  const { lang, t, translateError } = useI18n();
  const [tab, setTab] = useState("vehicles");
  const [vehicles, setVehicles] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [vehicleForm, setVehicleForm] = useState(emptyVehicleForm);
  const [blockForm, setBlockForm] = useState({ vehicleId: "", start: "", end: "", reason: "" });
  const [filters, setFilters] = useState({ status: "", paymentStatus: "" });

  async function loadAll(nextFilters = filters) {
    const params = new URLSearchParams();
    if (nextFilters.status) params.set("status", nextFilters.status);
    if (nextFilters.paymentStatus) params.set("paymentStatus", nextFilters.paymentStatus);

    const [vRes, bRes, rRes] = await Promise.all([
      api("/admin/vehicles"),
      api("/admin/blocks"),
      api(`/admin/reservations?${params}`),
    ]);
    setVehicles(vRes.vehicles);
    setBlocks(bRes.blocks);
    setReservations(rRes.reservations);
  }

  useEffect(() => {
    loadAll().catch((err) => onNotify("error", translateError(err)));
  }, []);

  function startEdit(vehicle) {
    setEditingId(vehicle.id);
    setVehicleForm({
      name: vehicle.name,
      category: vehicle.category,
      capacity: vehicle.capacity,
      location: vehicle.location,
      dailyPriceMxn: centsToCurrencyInput(vehicle.daily_price_cents),
      description: vehicle.description || "",
      imageUrl: vehicle.image_url || "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setVehicleForm(emptyVehicleForm);
  }

  async function submitVehicle(event) {
    event.preventDefault();
    const dailyPriceCents = currencyInputToCents(vehicleForm.dailyPriceMxn);
    const payload = {
      name: vehicleForm.name,
      category: vehicleForm.category,
      capacity: Number(vehicleForm.capacity),
      location: vehicleForm.location,
      dailyPriceCents,
      description: vehicleForm.description,
      imageUrl: vehicleForm.imageUrl,
    };
    try {
      if (editingId) {
        await api(`/admin/vehicles/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        onNotify("success", t("adminVehicleUpdated"));
      } else {
        await api("/admin/vehicles", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        onNotify("success", t("adminVehicleCreated"));
      }
      cancelEdit();
      await loadAll();
      await onCatalogChanged();
    } catch (error) {
      onNotify("error", translateError(error));
    }
  }

  async function toggleVehicleActive(vehicle) {
    try {
      await api(`/admin/vehicles/${vehicle.id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !vehicle.active }),
      });
      onNotify("success", t("adminVehicleUpdated"));
      await loadAll();
      await onCatalogChanged();
    } catch (error) {
      onNotify("error", translateError(error));
    }
  }

  async function createBlock(event) {
    event.preventDefault();
    try {
      const body = await api(`/admin/vehicles/${blockForm.vehicleId}/blocks`, {
        method: "POST",
        body: JSON.stringify(blockForm),
      });
      if (body.overlappingReservations > 0) {
        onNotify("info", t("adminBlockOverlapWarning", { n: body.overlappingReservations }));
      } else {
        onNotify("success", t("adminBlockCreated"));
      }
      setBlockForm({ vehicleId: "", start: "", end: "", reason: "" });
      await loadAll();
      await onCatalogChanged();
    } catch (error) {
      onNotify("error", translateError(error));
    }
  }

  async function removeBlock(blockId) {
    try {
      await api(`/admin/blocks/${blockId}`, { method: "DELETE" });
      onNotify("success", t("adminBlockRemoved"));
      await loadAll();
      await onCatalogChanged();
    } catch (error) {
      onNotify("error", translateError(error));
    }
  }

  async function updateFilters(nextFilters) {
    setFilters(nextFilters);
    try {
      await loadAll(nextFilters);
    } catch (error) {
      onNotify("error", translateError(error));
    }
  }

  return (
    <main>
      <div className="section-head">
        <h1>{t("adminTitle")}</h1>
      </div>

      <div className="tabs admin-tabs">
        <button type="button" className={tab === "vehicles" ? "active" : ""} onClick={() => setTab("vehicles")}>
          {t("adminVehiclesTab", { n: vehicles.length })}
        </button>
        <button type="button" className={tab === "blocks" ? "active" : ""} onClick={() => setTab("blocks")}>
          {t("adminBlocksTab", { n: blocks.length })}
        </button>
        <button
          type="button"
          className={tab === "reservations" ? "active" : ""}
          onClick={() => setTab("reservations")}
        >
          {t("adminReservationsTab", { n: reservations.length })}
        </button>
      </div>

      {tab === "vehicles" && (
        <section className="admin-grid">
          <div className="card">
            <h2>{editingId ? t("adminEditVehicleTitle", { name: vehicleForm.name }) : t("adminAddVehicleTitle")}</h2>
            <form className="form-stack" onSubmit={submitVehicle}>
              <label>
                <span>{t("adminNameLabel")}</span>
                <input
                  value={vehicleForm.name}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, name: e.target.value })}
                  required
                />
              </label>
              <div className="two-col">
                <label>
                  <span>{t("categoryLabel")}</span>
                  <select
                    value={vehicleForm.category}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, category: e.target.value })}
                  >
                    <option value="Sedan">{t("categorySedan")}</option>
                    <option value="SUV">{t("categorySuv")}</option>
                  </select>
                </label>
                <label>
                  <span>{t("passengersLabel")}</span>
                  <input
                    type="number"
                    min="1"
                    value={vehicleForm.capacity}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, capacity: Number(e.target.value) })}
                    required
                  />
                </label>
              </div>
              <div className="two-col">
                <label>
                  <span>{t("adminLocationLabel")}</span>
                  <input
                    value={vehicleForm.location}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, location: e.target.value })}
                    required
                  />
                </label>
                <label>
                  <span>{t("adminPriceMxnLabel")}</span>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={vehicleForm.dailyPriceMxn}
                    onChange={(e) => setVehicleForm({ ...vehicleForm, dailyPriceMxn: e.target.value })}
                    required
                  />
                </label>
              </div>
              <label>
                <span>{t("adminDescriptionLabel")}</span>
                <input
                  value={vehicleForm.description}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, description: e.target.value })}
                />
              </label>
              <label>
                <span>{t("adminImageUrlLabel")}</span>
                <input
                  value={vehicleForm.imageUrl}
                  onChange={(e) => setVehicleForm({ ...vehicleForm, imageUrl: e.target.value })}
                />
              </label>
              <div className="btn-row">
                <button className="primary" type="submit">
                  {editingId ? t("adminSaveEditBtn") : t("adminCreateBtn")}
                </button>
                {editingId && (
                  <button type="button" className="btn-ghost" onClick={cancelEdit}>
                    {t("adminCancelEditBtn")}
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="card">
            <h2>{t("navVehicles")}</h2>
            {vehicles.map((vehicle) => (
              <div className="admin-row" key={vehicle.id}>
                <div className="admin-row-head">
                  <strong>{vehicle.name}</strong>
                  <span className={vehicle.active ? "badge badge-success" : "badge badge-muted"}>
                    {vehicle.active ? t("vehicleActive") : t("vehicleInactive")}
                  </span>
                </div>
                <span className="muted-note">
                  {vehicle.category} · {t("seatsCount", { n: vehicle.capacity })} · {vehicle.location} ·{" "}
                  {formatCurrency(vehicle.daily_price_cents, { currency, lang })} {t("perDay")}
                </span>
                <div className="btn-row">
                  <button type="button" className="btn-outline" onClick={() => startEdit(vehicle)}>
                    {t("adminEditBtn")}
                  </button>
                  <button
                    type="button"
                    className={vehicle.active ? "btn-danger" : "btn-outline"}
                    onClick={() => toggleVehicleActive(vehicle)}
                  >
                    {vehicle.active ? t("adminDisableBtn") : t("adminRestoreBtn")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === "blocks" && (
        <section className="admin-grid">
          <div className="card">
            <h2>{t("adminBlockTitle")}</h2>
            <form className="form-stack" onSubmit={createBlock}>
              <label>
                <span>{t("adminVehicleSelect")}</span>
                <select
                  value={blockForm.vehicleId}
                  onChange={(e) => setBlockForm({ ...blockForm, vehicleId: e.target.value })}
                  required
                >
                  <option value="">{t("adminSelectPlaceholder")}</option>
                  {vehicles.map((v) => (
                    <option value={v.id} key={v.id}>
                      {v.name} ({v.location})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>{t("pickupLabel")}</span>
                <input
                  type="datetime-local"
                  value={blockForm.start}
                  onChange={(e) => setBlockForm({ ...blockForm, start: e.target.value })}
                  required
                />
              </label>
              <label>
                <span>{t("returnLabel")}</span>
                <input
                  type="datetime-local"
                  value={blockForm.end}
                  onChange={(e) => setBlockForm({ ...blockForm, end: e.target.value })}
                  required
                />
              </label>
              <label>
                <span>{t("adminReasonLabel")}</span>
                <input
                  value={blockForm.reason}
                  onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}
                />
              </label>
              <button className="primary" type="submit">
                {t("adminBlockBtn")}
              </button>
            </form>
          </div>

          <div className="card">
            <h2>{t("adminBlockListTitle")}</h2>
            {blocks.map((block) => (
              <div className="admin-row" key={block.id}>
                <div className="admin-row-head">
                  <strong>
                    {block.vehicle_name} ({block.vehicle_location})
                  </strong>
                  <button type="button" className="btn-danger" onClick={() => removeBlock(block.id)}>
                    {t("adminRemoveBlockBtn")}
                  </button>
                </div>
                <span className="muted-note">
                  {formatDateTime(block.start_at, lang)} → {formatDateTime(block.end_at, lang)}
                </span>
                {block.reason && <span className="muted-note">{block.reason}</span>}
              </div>
            ))}
            {blocks.length === 0 && <p className="empty">{t("adminNoBlocks")}</p>}
          </div>
        </section>
      )}

      {tab === "reservations" && (
        <section className="card">
          <div className="filter-bar">
            <label>
              <span>{t("adminFilterStatus")}</span>
              <select
                value={filters.status}
                onChange={(e) => updateFilters({ ...filters, status: e.target.value })}
              >
                <option value="">{t("anyOption")}</option>
                <option value="confirmed">{t("statusConfirmed")}</option>
                <option value="cancelled">{t("statusCancelled")}</option>
              </select>
            </label>
            <label>
              <span>{t("adminFilterPayment")}</span>
              <select
                value={filters.paymentStatus}
                onChange={(e) => updateFilters({ ...filters, paymentStatus: e.target.value })}
              >
                <option value="">{t("anyOption")}</option>
                <option value="paid">{t("paymentStatusPaid")}</option>
                <option value="pending">{t("paymentStatusPending")}</option>
              </select>
            </label>
          </div>

          {reservations.map((reservation) => (
            <div className="admin-row" key={reservation.id}>
              <div className="admin-row-head">
                <strong>
                  #{reservation.id} · {reservation.vehicle_name}
                </strong>
                <div className="badge-group">
                  <span className={reservation.status === "cancelled" ? "badge badge-muted" : "badge badge-success"}>
                    {reservation.status === "cancelled" ? t("statusCancelled") : t("statusConfirmed")}
                  </span>
                  <span className={reservation.payment_status === "paid" ? "badge badge-info" : "badge badge-warn"}>
                    {reservation.payment_status === "paid" ? t("paymentStatusPaid") : t("paymentStatusPending")}
                  </span>
                </div>
              </div>
              <span className="muted-note">
                {t("adminCustomerLabel")}: {reservation.customer_name} ({reservation.customer_email}) ·{" "}
                {reservation.pickup_location}
              </span>
              <span className="muted-note">
                {formatDateTime(reservation.start_at, lang)} → {formatDateTime(reservation.end_at, lang)} ·{" "}
                {formatCurrency(reservation.total_cents, { currency, lang })}
                {reservation.refund_cents > 0 &&
                  ` · ${t("refundLabel")}: ${formatCurrency(reservation.refund_cents, { currency, lang })} (${
                    reservation.refund_status || "pending"
                  })`}
              </span>
            </div>
          ))}
          {reservations.length === 0 && <p className="empty">{t("noReservations")}</p>}
        </section>
      )}
    </main>
  );
}
