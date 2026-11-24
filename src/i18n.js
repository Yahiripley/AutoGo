import React, { createContext, useContext, useState } from "react";

const STORAGE_KEY = "autogo_lang";

const translations = {
  es: {
    brandTagline: "Renta de autos sin complicaciones",
    navVehicles: "Vehículos",
    navReservations: "Mis reservas",
    navAdmin: "Administración",
    navSignIn: "Iniciar sesión",
    navLogout: "Cerrar sesión",
    roleAdmin: "Admin",
    roleCustomer: "Cliente",
    langLabel: "Idioma",

    authSignInTab: "Iniciar sesión",
    authRegisterTab: "Crear cuenta",
    authName: "Nombre completo",
    authEmail: "Correo electrónico",
    authPassword: "Contraseña (mín. 8 caracteres)",
    authSignInBtn: "Entrar a mi cuenta",
    authRegisterBtn: "Crear cuenta",
    authWelcomeBack: "Sesión iniciada correctamente.",
    authAccountCreated: "Cuenta creada y sesión iniciada.",
    authSignInBeforeReserve: "Inicia sesión o crea una cuenta para completar tu reserva.",
    authDemoAdminHint: "Demo administrador local:",
    authDemoFillBtn: "Usar correo demo",

    heroTitle: "Encuentra tu próximo auto en minutos",
    heroSubtitle: "Consulta disponibilidad real, calcula el total al instante y elige pagar hoy o al recoger.",
    locationLabel: "Ciudad o sucursal",
    locationPlaceholder: "Ej. Monterrey, Guadalajara...",
    allLocations: "Todas las ciudades",
    pickupLabel: "Recogida",
    returnLabel: "Devolución",
    categoryLabel: "Categoría",
    anyOption: "Todas",
    passengersLabel: "Pasajeros",
    sortLabel: "Ordenar por",
    sortDefault: "Recomendados",
    sortPriceAsc: "Menor precio",
    sortPriceDesc: "Mayor precio",
    sortCapacityDesc: "Mayor capacidad",
    searchBtn: "Buscar autos",
    quickPresetsLabel: "Atajos de fechas:",
    preset1d: "1 día",
    preset3d: "3 días",
    preset7d: "1 semana",
    clearDates: "Limpiar fechas",

    seatsCount: "{n} pasajeros",
    perDay: "/ día",
    estimatedForDays: "Total por {days} día(s): {total}",
    reserveBtn: "Ver y reservar",
    noVehiclesFound: "No hay vehículos disponibles con esos filtros. Prueba otra ciudad o ajusta las fechas.",
    resultsCount: "{n} vehículo(s) disponible(s)",

    modalTitlePrefix: "Detalle y reserva:",
    modalChooseDatesPrompt: "Selecciona fechas válidas de recogida y devolución para calcular el total.",
    modalDaysLabel: "Duración estimada",
    modalDailyRateLabel: "Tarifa diaria",
    modalTotalLabel: "Total estimado",
    modalPolicySummary: "Cancelación gratuita hasta {hours}h antes de la recogida. Después aplica reembolso parcial del {percent}% en pagos inmediatos.",
    modalPaymentMethod: "Método de pago",
    paymentPickup: "Pagar al recoger (sin cargo ahora)",
    paymentImmediate: "Pagar ahora (inmediato)",
    modalConfirmBtn: "Confirmar reserva",
    modalChecking: "Verificando disponibilidad...",
    modalPaymentRecoveryTitle: "No se pudo completar el pago inmediato",
    modalPaymentRecoveryDesc: "Tu selección sigue intacta. Puedes reintentar el pago o cambiar a pago al recoger.",
    modalRetryPayment: "Reintentar pago ahora",
    modalSwitchToPickup: "Cambiar a pagar al recoger",
    modalUnavailableBanner: "Este vehículo dejó de estar disponible para las fechas elegidas. Ajusta las fechas o elige otro auto.",
    reservationCreatedMsg: "¡Reserva confirmada con éxito!",

    reservationsTitle: "Mis reservas",
    reservationsSubtitle: "Consulta detalles, cambia fechas o vehículo, y revisa políticas antes de cancelar.",
    noReservations: "Aún no tienes reservas registradas.",
    pickupLocationLabel: "Lugar de recogida",
    periodLabel: "Periodo",
    totalLabel: "Total",
    paymentLabel: "Pago",
    refundLabel: "Reembolso",
    modifyBtn: "Modificar",
    cancelBtn: "Cancelar reserva",

    modifyModalTitle: "Modificar reserva #{id}",
    modifyVehicleLabel: "Vehículo",
    modifyNewTotalLabel: "Nuevo total estimado",
    modifySaveBtn: "Guardar cambios",
    modifySuccessMsg: "Reserva actualizada correctamente.",

    cancelModalTitle: "Confirmar cancelación",
    cancelModalQuestion: "¿Seguro que deseas cancelar la reserva de {vehicle}?",
    cancelTierFree: "Cancelación gratuita (100% de reembolso): estás dentro de la ventana de {hours}h previas.",
    cancelTierPartial: "Cancelación tardía ({percent}% de reembolso): fuera de la ventana de {hours}h previas.",
    cancelTierNone: "Cancelación tardía sin reembolso aplicable según la política vigente.",
    cancelTierPickup: "Pago al recoger pendiente: se cancelará sin ningún cargo.",
    cancelEstimatedRefund: "Reembolso estimado:",
    cancelConfirmBtn: "Sí, cancelar reserva",
    cancelKeepBtn: "Volver",
    cancelledSuccessWithRefund: "Reserva cancelada. Reembolso registrado: {amount}.",
    cancelledSuccessNoCharge: "Reserva cancelada sin cargos.",

    adminTitle: "Administración de flota",
    adminVehiclesTab: "Vehículos ({n})",
    adminBlocksTab: "Bloqueos ({n})",
    adminReservationsTab: "Reservas ({n})",
    adminAddVehicleTitle: "Agregar vehículo",
    adminEditVehicleTitle: "Editar vehículo: {name}",
    adminNameLabel: "Modelo / Nombre",
    adminLocationLabel: "Ciudad",
    adminPriceMxnLabel: "Tarifa diaria (MXN)",
    adminDescriptionLabel: "Descripción",
    adminImageUrlLabel: "URL de imagen (opcional)",
    adminCreateBtn: "Crear vehículo",
    adminSaveEditBtn: "Guardar cambios",
    adminCancelEditBtn: "Cancelar edición",
    adminEditBtn: "Editar",
    adminDisableBtn: "Desactivar",
    adminRestoreBtn: "Reactivar",
    adminVehicleCreated: "Vehículo creado correctamente.",
    adminVehicleUpdated: "Vehículo actualizado correctamente.",
    adminBlockTitle: "Bloquear inventario",
    adminVehicleSelect: "Vehículo",
    adminSelectPlaceholder: "Selecciona un vehículo",
    adminReasonLabel: "Motivo (mantenimiento, inspección...)",
    adminBlockBtn: "Crear bloqueo",
    adminBlockListTitle: "Bloqueos programados",
    adminNoBlocks: "No hay bloqueos registrados.",
    adminRemoveBlockBtn: "Eliminar",
    adminBlockCreated: "Periodo bloqueado correctamente.",
    adminBlockOverlapWarning: "Periodo bloqueado. Atención: hay {n} reserva(s) activa(s) que se traslapan con estas fechas.",
    adminBlockRemoved: "Bloqueo eliminado.",
    adminFilterStatus: "Estado de reserva",
    adminFilterPayment: "Estado de pago",
    adminCustomerLabel: "Cliente",

    statusConfirmed: "Confirmada",
    statusCancelled: "Cancelada",
    paymentStatusPaid: "Pagado",
    paymentStatusPending: "Pendiente al recoger",
    refundStatusPending: "Reembolso pendiente",
    refundStatusCompleted: "Reembolsado",
    vehicleActive: "Activo",
    vehicleInactive: "Inactivo",
    categorySedan: "Sedán",
    categorySuv: "SUV",

    close: "Cerrar",
    dismiss: "Ocultar",

    errors: {
      AUTH_REQUIRED: "Debes iniciar sesión para continuar.",
      ADMIN_REQUIRED: "Esta sección requiere permisos de administrador.",
      INVALID_CREDENTIALS: "Correo o contraseña incorrectos.",
      EMAIL_EXISTS: "Ya existe una cuenta registrada con este correo.",
      INVALID_REGISTER_INPUT: "Ingresa nombre, correo válido y contraseña de al menos 8 caracteres.",
      INVALID_DATE_RANGE: "La fecha de devolución debe ser posterior a la de recogida.",
      VEHICLE_NOT_FOUND: "No se encontró el vehículo seleccionado.",
      VEHICLE_UNAVAILABLE: "El vehículo no está disponible para las fechas seleccionadas.",
      INVALID_RESERVATION_INPUT: "Selecciona un vehículo y un periodo válido.",
      INVALID_PAYMENT_METHOD: "Selecciona un método de pago válido.",
      PAYMENT_FAILED: "El pago inmediato fue rechazado. Puedes reintentar o pagar al recoger.",
      RESERVATION_NOT_FOUND: "No se encontró la reserva.",
      RESERVATION_ACCESS_DENIED: "No tienes permiso para acceder a esta reserva.",
      RESERVATION_CANCELLED: "Las reservas canceladas no se pueden modificar.",
      RESERVATION_ALREADY_CANCELLED: "Esta reserva ya fue cancelada.",
      REPLACEMENT_UNAVAILABLE: "El vehículo elegido no está disponible.",
      INVALID_VEHICLE_INPUT: "Completa los datos del vehículo con valores válidos mayores a cero.",
      INVALID_BLOCK_INPUT: "Selecciona un rango válido donde el fin sea posterior al inicio.",
      BLOCK_NOT_FOUND: "El bloqueo ya no existe.",
      GENERIC: "Ocurrió un error al procesar la solicitud.",
    },
  },
  en: {
    brandTagline: "Hassle-free car rental",
    navVehicles: "Vehicles",
    navReservations: "My reservations",
    navAdmin: "Admin",
    navSignIn: "Sign in",
    navLogout: "Sign out",
    roleAdmin: "Admin",
    roleCustomer: "Customer",
    langLabel: "Language",

    authSignInTab: "Sign in",
    authRegisterTab: "Create account",
    authName: "Full name",
    authEmail: "Email address",
    authPassword: "Password (min. 8 characters)",
    authSignInBtn: "Sign in",
    authRegisterBtn: "Create account",
    authWelcomeBack: "Welcome back.",
    authAccountCreated: "Account created and signed in.",
    authSignInBeforeReserve: "Sign in or create an account to finish your reservation.",
    authDemoAdminHint: "Local demo admin:",
    authDemoFillBtn: "Fill demo email",

    heroTitle: "Find your next drive in minutes",
    heroSubtitle: "Check live availability, see the full price upfront, and pay now or at pickup.",
    locationLabel: "City or branch",
    locationPlaceholder: "e.g. Monterrey, Guadalajara...",
    allLocations: "All cities",
    pickupLabel: "Pickup",
    returnLabel: "Return",
    categoryLabel: "Category",
    anyOption: "Any",
    passengersLabel: "Passengers",
    sortLabel: "Sort by",
    sortDefault: "Recommended",
    sortPriceAsc: "Lowest price",
    sortPriceDesc: "Highest price",
    sortCapacityDesc: "Largest capacity",
    searchBtn: "Search cars",
    quickPresetsLabel: "Quick dates:",
    preset1d: "1 day",
    preset3d: "3 days",
    preset7d: "1 week",
    clearDates: "Clear dates",

    seatsCount: "{n} seats",
    perDay: "/ day",
    estimatedForDays: "Total for {days} day(s): {total}",
    reserveBtn: "View & reserve",
    noVehiclesFound: "No vehicles match those filters. Try another city or adjust your dates.",
    resultsCount: "{n} vehicle(s) available",

    modalTitlePrefix: "Vehicle & booking:",
    modalChooseDatesPrompt: "Choose valid pickup and return dates to calculate your total.",
    modalDaysLabel: "Estimated duration",
    modalDailyRateLabel: "Daily rate",
    modalTotalLabel: "Estimated total",
    modalPolicySummary: "Free cancellation up to {hours}h before pickup. Later cancellations receive a {percent}% refund on immediate payments.",
    modalPaymentMethod: "Payment method",
    paymentPickup: "Pay at pickup (no charge now)",
    paymentImmediate: "Pay now (immediate)",
    modalConfirmBtn: "Confirm reservation",
    modalChecking: "Checking availability...",
    modalPaymentRecoveryTitle: "Immediate payment could not be completed",
    modalPaymentRecoveryDesc: "Your booking details are preserved. Retry immediate payment or switch to pay at pickup.",
    modalRetryPayment: "Retry immediate payment",
    modalSwitchToPickup: "Switch to pay at pickup",
    modalUnavailableBanner: "This vehicle became unavailable for the selected dates. Adjust dates or choose another car.",
    reservationCreatedMsg: "Reservation confirmed!",

    reservationsTitle: "My reservations",
    reservationsSubtitle: "Inspect details, adjust dates or vehicle, and preview cancellation policy outcomes.",
    noReservations: "You have no reservations yet.",
    pickupLocationLabel: "Pickup location",
    periodLabel: "Period",
    totalLabel: "Total",
    paymentLabel: "Payment",
    refundLabel: "Refund",
    modifyBtn: "Modify",
    cancelBtn: "Cancel reservation",

    modifyModalTitle: "Modify reservation #{id}",
    modifyVehicleLabel: "Vehicle",
    modifyNewTotalLabel: "Updated estimated total",
    modifySaveBtn: "Save changes",
    modifySuccessMsg: "Reservation updated.",

    cancelModalTitle: "Confirm cancellation",
    cancelModalQuestion: "Are you sure you want to cancel your reservation for {vehicle}?",
    cancelTierFree: "Free cancellation (100% refund): within the {hours}h free-cancellation window.",
    cancelTierPartial: "Late cancellation ({percent}% refund): outside the {hours}h free-cancellation window.",
    cancelTierNone: "Late cancellation with no refund under the applied policy.",
    cancelTierPickup: "Pay at pickup pending: this reservation will be cancelled with no charge.",
    cancelEstimatedRefund: "Estimated refund:",
    cancelConfirmBtn: "Yes, cancel reservation",
    cancelKeepBtn: "Keep reservation",
    cancelledSuccessWithRefund: "Reservation cancelled. Refund queued: {amount}.",
    cancelledSuccessNoCharge: "Reservation cancelled with no charge.",

    adminTitle: "Fleet administration",
    adminVehiclesTab: "Vehicles ({n})",
    adminBlocksTab: "Blocks ({n})",
    adminReservationsTab: "Reservations ({n})",
    adminAddVehicleTitle: "Add vehicle",
    adminEditVehicleTitle: "Edit vehicle: {name}",
    adminNameLabel: "Model / Name",
    adminLocationLabel: "City",
    adminPriceMxnLabel: "Daily rate (MXN)",
    adminDescriptionLabel: "Description",
    adminImageUrlLabel: "Image URL (optional)",
    adminCreateBtn: "Create vehicle",
    adminSaveEditBtn: "Save changes",
    adminCancelEditBtn: "Cancel edit",
    adminEditBtn: "Edit",
    adminDisableBtn: "Disable",
    adminRestoreBtn: "Restore",
    adminVehicleCreated: "Vehicle created.",
    adminVehicleUpdated: "Vehicle updated.",
    adminBlockTitle: "Block inventory",
    adminVehicleSelect: "Vehicle",
    adminSelectPlaceholder: "Select a vehicle",
    adminReasonLabel: "Reason (maintenance, inspection...)",
    adminBlockBtn: "Block period",
    adminBlockListTitle: "Scheduled blocks",
    adminNoBlocks: "No inventory blocks recorded.",
    adminRemoveBlockBtn: "Remove",
    adminBlockCreated: "Inventory period blocked.",
    adminBlockOverlapWarning: "Period blocked. Warning: {n} active reservation(s) overlap these dates.",
    adminBlockRemoved: "Inventory block removed.",
    adminFilterStatus: "Reservation status",
    adminFilterPayment: "Payment status",
    adminCustomerLabel: "Customer",

    statusConfirmed: "Confirmed",
    statusCancelled: "Cancelled",
    paymentStatusPaid: "Paid",
    paymentStatusPending: "Pay at pickup",
    refundStatusPending: "Refund pending",
    refundStatusCompleted: "Refunded",
    vehicleActive: "Active",
    vehicleInactive: "Inactive",
    categorySedan: "Sedan",
    categorySuv: "SUV",

    close: "Close",
    dismiss: "Dismiss",

    errors: {
      AUTH_REQUIRED: "Please sign in to continue.",
      ADMIN_REQUIRED: "Administrator permissions are required.",
      INVALID_CREDENTIALS: "Invalid email or password.",
      EMAIL_EXISTS: "An account with this email already exists.",
      INVALID_REGISTER_INPUT: "Enter your name, a valid email, and a password of at least 8 characters.",
      INVALID_DATE_RANGE: "Return date must be later than pickup date.",
      VEHICLE_NOT_FOUND: "Vehicle not found.",
      VEHICLE_UNAVAILABLE: "This vehicle is unavailable for the selected dates.",
      INVALID_RESERVATION_INPUT: "Choose a valid vehicle and rental period.",
      INVALID_PAYMENT_METHOD: "Choose a valid payment method.",
      PAYMENT_FAILED: "Immediate payment failed. Retry or switch to pay at pickup.",
      RESERVATION_NOT_FOUND: "Reservation not found.",
      RESERVATION_ACCESS_DENIED: "You do not have access to this reservation.",
      RESERVATION_CANCELLED: "Cancelled reservations cannot be modified.",
      RESERVATION_ALREADY_CANCELLED: "This reservation is already cancelled.",
      REPLACEMENT_UNAVAILABLE: "The selected replacement vehicle is unavailable.",
      INVALID_VEHICLE_INPUT: "Complete all vehicle fields with valid positive values.",
      INVALID_BLOCK_INPUT: "Choose a valid block period where end is after start.",
      BLOCK_NOT_FOUND: "Inventory block not found.",
      GENERIC: "Something went wrong while processing your request.",
    },
  },
};

function detectInitialLang() {
  if (typeof window === "undefined") return "es";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "es" || saved === "en") return saved;
  return window.navigator?.language?.toLowerCase().startsWith("en") ? "en" : "es";
}

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(detectInitialLang);

  function setLang(nextLang) {
    const normalized = nextLang === "en" ? "en" : "es";
    setLangState(normalized);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, normalized);
      document.documentElement.lang = normalized;
    }
  }

  function t(key, vars = {}) {
    const dict = translations[lang] || translations.es;
    let template = dict[key] ?? translations.es[key] ?? key;
    if (typeof template !== "string") return key;
    for (const [varKey, varValue] of Object.entries(vars)) {
      template = template.replaceAll(`{${varKey}}`, String(varValue));
    }
    return template;
  }

  function translateError(error) {
    const dict = translations[lang] || translations.es;
    if (error?.code && dict.errors[error.code]) {
      return dict.errors[error.code];
    }
    return error?.message || dict.errors.GENERIC;
  }

  return React.createElement(
    I18nContext.Provider,
    { value: { lang, setLang, t, translateError } },
    children
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
