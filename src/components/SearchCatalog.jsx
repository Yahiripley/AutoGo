import React from "react";
import { useI18n } from "../i18n.js";
import { calculateRentalDays, formatCurrency, getPresetDates } from "../format.js";

function VehicleArtwork({ vehicle }) {
  if (vehicle.image_url) {
    return <img className="vehicle-thumb" src={vehicle.image_url} alt={vehicle.name} />;
  }
  const isSuv = String(vehicle.category).toLowerCase() === "suv";
  return (
    <div className={isSuv ? "vehicle-icon suv" : "vehicle-icon sedan"} aria-hidden="true">
      <svg viewBox="0 0 64 40" width="54" height="34" fill="none" stroke="currentColor" strokeWidth="2.5">
        {isSuv ? (
          <path d="M6 26V19l7-8h26l9 8 8 2v5H6z" strokeLinejoin="round" />
        ) : (
          <path d="M6 26v-5l9-8h22l11 8 8 2v3H6z" strokeLinejoin="round" />
        )}
        <circle cx="17" cy="28" r="4.5" fill="currentColor" />
        <circle cx="46" cy="28" r="4.5" fill="currentColor" />
      </svg>
      <span className="vehicle-cat-tag">{vehicle.category}</span>
    </div>
  );
}

export function SearchCatalog({
  search,
  setSearch,
  locations,
  vehicles,
  currency,
  onSearch,
  onSelectVehicle,
}) {
  const { lang, t } = useI18n();
  const selectedDays = calculateRentalDays(search.start, search.end);

  function applyPreset(days) {
    const preset = getPresetDates(days);
    const nextSearch = { ...search, ...preset };
    setSearch(nextSearch);
    onSearch(null, nextSearch);
  }

  function clearDates() {
    const nextSearch = { ...search, start: "", end: "" };
    setSearch(nextSearch);
    onSearch(null, nextSearch);
  }

  function pickLocation(loc) {
    const nextSearch = { ...search, location: loc };
    setSearch(nextSearch);
    onSearch(null, nextSearch);
  }

  return (
    <main>
      <section className="search-panel">
        <div className="hero-copy">
          <h1>{t("heroTitle")}</h1>
          <p>{t("heroSubtitle")}</p>
        </div>

        <form className="search-grid" onSubmit={(event) => onSearch(event, search)}>
          <label>
            <span>{t("locationLabel")}</span>
            <input
              list="autogo-locations"
              value={search.location}
              onChange={(e) => setSearch({ ...search, location: e.target.value })}
              placeholder={t("locationPlaceholder")}
            />
            <datalist id="autogo-locations">
              {locations.map((loc) => (
                <option value={loc} key={loc} />
              ))}
            </datalist>
          </label>
          <label>
            <span>{t("pickupLabel")}</span>
            <input
              type="datetime-local"
              value={search.start}
              onChange={(e) => setSearch({ ...search, start: e.target.value })}
            />
          </label>
          <label>
            <span>{t("returnLabel")}</span>
            <input
              type="datetime-local"
              value={search.end}
              onChange={(e) => setSearch({ ...search, end: e.target.value })}
            />
          </label>
          <label>
            <span>{t("categoryLabel")}</span>
            <select
              value={search.category}
              onChange={(e) => setSearch({ ...search, category: e.target.value })}
            >
              <option value="">{t("anyOption")}</option>
              <option value="Sedan">{t("categorySedan")}</option>
              <option value="SUV">{t("categorySuv")}</option>
            </select>
          </label>
          <label>
            <span>{t("passengersLabel")}</span>
            <select
              value={search.capacity}
              onChange={(e) => setSearch({ ...search, capacity: e.target.value })}
            >
              <option value="">{t("anyOption")}</option>
              <option value="4">4+</option>
              <option value="5">5+</option>
              <option value="7">7+</option>
            </select>
          </label>
          <label>
            <span>{t("sortLabel")}</span>
            <select
              value={search.sort}
              onChange={(e) => {
                const next = { ...search, sort: e.target.value };
                setSearch(next);
                onSearch(null, next);
              }}
            >
              <option value="">{t("sortDefault")}</option>
              <option value="price_asc">{t("sortPriceAsc")}</option>
              <option value="price_desc">{t("sortPriceDesc")}</option>
              <option value="capacity_desc">{t("sortCapacityDesc")}</option>
            </select>
          </label>
          <button className="primary search-submit" type="submit">
            {t("searchBtn")}
          </button>
        </form>

        <div className="quick-bar">
          <div className="chip-row">
            <span className="quick-label">{t("quickPresetsLabel")}</span>
            <button type="button" className="chip" onClick={() => applyPreset(1)}>{t("preset1d")}</button>
            <button type="button" className="chip" onClick={() => applyPreset(3)}>{t("preset3d")}</button>
            <button type="button" className="chip" onClick={() => applyPreset(7)}>{t("preset7d")}</button>
            {(search.start || search.end) && (
              <button type="button" className="chip chip-muted" onClick={clearDates}>{t("clearDates")}</button>
            )}
          </div>
          {locations.length > 0 && (
            <div className="chip-row">
              <button
                type="button"
                className={!search.location ? "chip chip-active" : "chip"}
                onClick={() => pickLocation("")}
              >
                {t("allLocations")}
              </button>
              {locations.map((loc) => (
                <button
                  type="button"
                  key={loc}
                  className={search.location.toLowerCase() === loc.toLowerCase() ? "chip chip-active" : "chip"}
                  onClick={() => pickLocation(loc)}
                >
                  {loc}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="results-header">
        <p className="results-count">{t("resultsCount", { n: vehicles.length })}</p>
      </div>

      <section className="results">
        {vehicles.map((vehicle) => {
          const totalCents = selectedDays > 0 ? vehicle.daily_price_cents * selectedDays : null;
          return (
            <article className="vehicle-card" key={vehicle.id}>
              <VehicleArtwork vehicle={vehicle} />
              <div className="vehicle-body">
                <div className="vehicle-top">
                  <div>
                    <h2>{vehicle.name}</h2>
                    <p className="meta-line">
                      <span>{vehicle.category}</span>
                      <span>·</span>
                      <span>{t("seatsCount", { n: vehicle.capacity })}</span>
                      <span>·</span>
                      <span>{vehicle.location}</span>
                    </p>
                  </div>
                </div>
                {vehicle.description && <p className="vehicle-desc">{vehicle.description}</p>}
                <div className="vehicle-footer">
                  <div>
                    <p className="price">
                      {formatCurrency(vehicle.daily_price_cents, { currency, lang })}{" "}
                      <span>{t("perDay")}</span>
                    </p>
                    {totalCents !== null && (
                      <p className="total-estimate">
                        {t("estimatedForDays", {
                          days: selectedDays,
                          total: formatCurrency(totalCents, { currency, lang }),
                        })}
                      </p>
                    )}
                  </div>
                  <button className="primary" type="button" onClick={() => onSelectVehicle(vehicle)}>
                    {t("reserveBtn")}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
        {vehicles.length === 0 && <p className="empty">{t("noVehiclesFound")}</p>}
      </section>
    </main>
  );
}
