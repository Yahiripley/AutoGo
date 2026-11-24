import React, { useEffect, useState } from "react";
import { api } from "./api.js";
import { useI18n } from "./i18n.js";
import { getPresetDates } from "./format.js";
import { Header } from "./components/Header.jsx";
import { AuthView } from "./components/AuthView.jsx";
import { SearchCatalog } from "./components/SearchCatalog.jsx";
import { VehicleModal } from "./components/VehicleModal.jsx";
import { ReservationsView } from "./components/ReservationsView.jsx";
import { AdminPanel } from "./components/AdminPanel.jsx";

export function App() {
  const { t, translateError } = useI18n();
  const initialDates = getPresetDates(2);

  const [user, setUser] = useState(null);
  const [meta, setMeta] = useState({
    currency: "MXN",
    freeCancellationHours: 48,
    partialRefundPercent: 50,
    demoAdminEmail: null,
  });
  const [locations, setLocations] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [mode, setMode] = useState("search");
  const [search, setSearch] = useState({
    location: "",
    category: "",
    capacity: "",
    start: initialDates.start,
    end: initialDates.end,
    sort: "",
  });
  const [selected, setSelected] = useState(null);
  const [pendingDraft, setPendingDraft] = useState(null);
  const [auth, setAuth] = useState({ name: "", email: "", password: "" });
  const [authMode, setAuthMode] = useState("login");
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  function notify(type, text) {
    setNotice({ type, text });
  }

  async function loadLocations() {
    try {
      const body = await api("/locations");
      setLocations(body.locations || []);
    } catch {}
  }

  async function runSearch(event = null, searchOverride = search) {
    event?.preventDefault();
    try {
      const params = new URLSearchParams();
      Object.entries(searchOverride).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });
      const body = await api(`/vehicles?${params}`);
      setVehicles(body.vehicles || []);
    } catch (error) {
      notify("error", translateError(error));
    }
  }

  async function loadReservations() {
    if (!user) return;
    const body = await api("/reservations");
    setReservations(body.reservations || []);
  }

  async function refreshBootstrap() {
    const [healthBody, meBody] = await Promise.all([
      api("/health").catch(() => null),
      api("/auth/me").catch(() => ({ user: null })),
    ]);
    if (healthBody) {
      setMeta({
        currency: healthBody.currency || "MXN",
        freeCancellationHours: healthBody.freeCancellationHours ?? 48,
        partialRefundPercent: healthBody.partialRefundPercent ?? 50,
        demoAdminEmail: healthBody.demoAdminEmail || null,
      });
    }
    setUser(meBody.user || null);
  }

  useEffect(() => {
    refreshBootstrap();
    loadLocations();
    runSearch(null, search);
  }, []);

  useEffect(() => {
    if (mode === "reservations" && user) {
      loadReservations().catch((error) => notify("error", translateError(error)));
    }
  }, [mode, user]);

  async function submitAuth(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const body = await api(`/auth/${authMode}`, {
        method: "POST",
        body: JSON.stringify(auth),
      });
      setUser(body.user);
      setAuth({ name: "", email: "", password: "" });
      setMode("search");
      notify("success", authMode === "login" ? t("authWelcomeBack") : t("authAccountCreated"));
    } catch (error) {
      notify("error", translateError(error));
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await api("/auth/logout", { method: "POST" });
    setUser(null);
    setReservations([]);
    setSelected(null);
    setPendingDraft(null);
    setMode("search");
  }

  async function handleBookingSuccess() {
    setSelected(null);
    setPendingDraft(null);
    setMode("reservations");
    notify("success", t("reservationCreatedMsg"));
    await Promise.all([loadReservations(), runSearch(null, search)]);
  }

  return (
    <div className="app">
      <Header
        user={user}
        mode={mode}
        onNavigate={(nextMode) => {
          setMode(nextMode);
          setNotice(null);
        }}
        onOpenAdmin={() => {
          setMode("admin");
          setNotice(null);
        }}
        onLogout={logout}
      />

      {notice && (
        <div className={`notice notice-${notice.type}`} role="status">
          <span>{notice.text}</span>
          <button
            type="button"
            className="notice-close"
            onClick={() => setNotice(null)}
            aria-label={t("dismiss")}
          >
            ×
          </button>
        </div>
      )}

      {mode === "auth" && (
        <AuthView
          auth={auth}
          setAuth={setAuth}
          authMode={authMode}
          setAuthMode={setAuthMode}
          busy={busy}
          onSubmit={submitAuth}
          demoAdminEmail={meta.demoAdminEmail}
        />
      )}

      {mode === "search" && (
        <SearchCatalog
          search={search}
          setSearch={setSearch}
          locations={locations}
          vehicles={vehicles}
          currency={meta.currency}
          onSearch={runSearch}
          onSelectVehicle={(vehicle) => {
            setPendingDraft(null);
            setSelected(vehicle);
          }}
        />
      )}

      {selected && mode !== "auth" && (
        <VehicleModal
          vehicle={selected}
          initialStart={pendingDraft?.start || search.start}
          initialEnd={pendingDraft?.end || search.end}
          initialPaymentMethod={pendingDraft?.paymentMethod || "pickup"}
          meta={meta}
          user={user}
          onClose={() => {
            setSelected(null);
            setPendingDraft(null);
          }}
          onSuccess={handleBookingSuccess}
          onRequireAuth={(draft) => {
            setPendingDraft(draft);
            setMode("auth");
            notify("info", t("authSignInBeforeReserve"));
          }}
        />
      )}

      {mode === "reservations" && (
        <ReservationsView
          reservations={reservations}
          vehicles={vehicles}
          currency={meta.currency}
          onReload={async () => {
            await loadReservations();
            await runSearch(null, search);
          }}
          onNotify={notify}
        />
      )}

      {mode === "admin" && user?.role === "admin" && (
        <AdminPanel
          currency={meta.currency}
          onNotify={notify}
          onCatalogChanged={async () => {
            await Promise.all([loadLocations(), runSearch(null, search)]);
          }}
        />
      )}
    </div>
  );
}
