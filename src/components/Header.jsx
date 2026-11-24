import React from "react";
import { useI18n } from "../i18n.js";

export function Header({ user, mode, onNavigate, onOpenAdmin, onLogout }) {
  const { lang, setLang, t } = useI18n();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="brand" type="button" onClick={() => onNavigate("search")}>
          <span className="brand-mark">A</span>
          <span>
            <strong>AutoGo</strong>
            <small>{t("brandTagline")}</small>
          </span>
        </button>
      </div>

      <nav className="topbar-nav" aria-label="Main navigation">
        <button
          type="button"
          className={mode === "search" ? "nav-btn active" : "nav-btn"}
          onClick={() => onNavigate("search")}
        >
          {t("navVehicles")}
        </button>
        {user && (
          <button
            type="button"
            className={mode === "reservations" ? "nav-btn active" : "nav-btn"}
            onClick={() => onNavigate("reservations")}
          >
            {t("navReservations")}
          </button>
        )}
        {user?.role === "admin" && (
          <button
            type="button"
            className={mode === "admin" ? "nav-btn active" : "nav-btn"}
            onClick={onOpenAdmin}
          >
            {t("navAdmin")}
          </button>
        )}
      </nav>

      <div className="topbar-actions">
        <div className="lang-switch" role="group" aria-label={t("langLabel")}>
          <button
            type="button"
            className={lang === "es" ? "lang-btn active" : "lang-btn"}
            onClick={() => setLang("es")}
          >
            ES
          </button>
          <button
            type="button"
            className={lang === "en" ? "lang-btn active" : "lang-btn"}
            onClick={() => setLang("en")}
          >
            EN
          </button>
        </div>

        {user ? (
          <div className="user-pill">
            <span className="user-name">{user.name}</span>
            <span className={user.role === "admin" ? "badge badge-admin" : "badge badge-customer"}>
              {user.role === "admin" ? t("roleAdmin") : t("roleCustomer")}
            </span>
            <button type="button" className="btn-ghost" onClick={onLogout}>
              {t("navLogout")}
            </button>
          </div>
        ) : (
          <button type="button" className="btn-outline" onClick={() => onNavigate("auth")}>
            {t("navSignIn")}
          </button>
        )}
      </div>
    </header>
  );
}
