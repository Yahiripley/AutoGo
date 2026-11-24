import React from "react";
import { useI18n } from "../i18n.js";

export function AuthView({ auth, setAuth, authMode, setAuthMode, busy, onSubmit, demoAdminEmail }) {
  const { t } = useI18n();

  return (
    <main className="narrow">
      <div className="card auth-card">
        <div className="tabs">
          <button
            type="button"
            className={authMode === "login" ? "active" : ""}
            onClick={() => setAuthMode("login")}
          >
            {t("authSignInTab")}
          </button>
          <button
            type="button"
            className={authMode === "register" ? "active" : ""}
            onClick={() => setAuthMode("register")}
          >
            {t("authRegisterTab")}
          </button>
        </div>

        <form className="form-stack" onSubmit={onSubmit}>
          {authMode === "register" && (
            <label>
              <span>{t("authName")}</span>
              <input
                value={auth.name}
                onChange={(event) => setAuth({ ...auth, name: event.target.value })}
                required
              />
            </label>
          )}
          <label>
            <span>{t("authEmail")}</span>
            <input
              type="email"
              value={auth.email}
              onChange={(event) => setAuth({ ...auth, email: event.target.value })}
              required
            />
          </label>
          <label>
            <span>{t("authPassword")}</span>
            <input
              type="password"
              minLength={8}
              value={auth.password}
              onChange={(event) => setAuth({ ...auth, password: event.target.value })}
              required
            />
          </label>
          <button className="primary full-width" disabled={busy}>
            {authMode === "login" ? t("authSignInBtn") : t("authRegisterBtn")}
          </button>
        </form>

        {authMode === "login" && demoAdminEmail && (
          <div className="demo-hint">
            <span>
              <strong>{t("authDemoAdminHint")}</strong> {demoAdminEmail} / <code>Admin123!</code>
            </span>
            <button
              type="button"
              className="btn-link"
              onClick={() => setAuth({ ...auth, email: demoAdminEmail, password: "Admin123!" })}
            >
              {t("authDemoFillBtn")}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
