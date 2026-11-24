# Tasks

## 1. Persistencia de sesiones, configuración y bootstrap de administrador

- [x] 1.1 Agregar tabla `sessions` en `server/db.js`, migrar el manejo de cookies en `server/index.js` a sesiones persistidas en SQLite con firma HMAC (`sessionSecret`) y limpieza de sesiones expiradas; verificar con una prueba que la sesión sobrevive a una reinicialización de la app/handler.
- [x] 1.2 Agregar soporte configurable de bootstrap de administrador (`AUTOGO_ADMIN_EMAIL`, `AUTOGO_ADMIN_PASSWORD`, más cuenta demo por defecto fuera de producción cuando no exista admin) en `server/config.js` y `server/db.js`, y añadir pruebas unitarias en `tests/config.test.js` y `tests/migrations.test.js` verificando su creación idempotente.
- [x] 1.3 Exportar la factory de la aplicación Express (`createApp`) en `server/index.js` sin acoplar el `listen()` al importar en pruebas, y agregar script de desarrollo unificado en `package.json` para arrancar servidor API y cliente Vite juntos; verificar que `npm test` y el arranque local respondan en `/api/health`.

## 2. Mejoras de API para catálogo, reservas, errores localizables y administración

- [x] 2.1 Actualizar `GET /api/vehicles` (búsqueda parcial insensible a mayúsculas en `location` y parámetro de ordenamiento `sort`) y añadir `GET /api/locations` para listar ciudades activas; verificar con pruebas HTTP que búsquedas en minúsculas/parciales y ordenamientos devuelven los resultados esperados.
- [x] 2.2 Añadir `code` estructurado en respuestas de error de `server/index.js`, añadir `GET /api/reservations/:id/cancellation-preview` para previsualizar el reembolso según `policy_snapshot`, e incluir metadatos del vehículo/política en `GET /api/reservations`; verificar con pruebas HTTP que la previsualización coincide con cancelación gratuita, tardía y pago al recoger.
- [x] 2.3 Añadir endpoints administrativos `GET /api/admin/vehicles` (incluye vehículos inactivos), `GET /api/admin/blocks`, `DELETE /api/admin/blocks/:id` y detección de traslapes en `POST /api/admin/vehicles/:id/blocks`, además de exponer estado de reembolsos en `GET /api/admin/reservations`; verificar con pruebas HTTP las restricciones de rol (`401`/`403`) y la gestión de bloqueos e inactivos.

## 3. Sistema bilingüe (ES/EN) y utilidades de formato

- [x] 3.1 Crear `src/i18n.js` con diccionario completo en español (`es`) e inglés (`en`), contexto/hook `useI18n` con persistencia en `localStorage`, traducciones para navegación, formularios, estados, categorías y códigos de error de la API; verificar compilación con `npm run build`.
- [x] 3.2 Crear `src/format.js` para formateo consistente de moneda (`MXN` a partir de centavos), fechas legibles según el idioma activo, cálculo de días de renta y cálculo local de ventana de cancelación gratuita; verificar con pruebas unitarias en `tests/format.test.js`.

## 4. Interfaz de cliente amigable: búsqueda, detalle, reserva y recuperación de pago

- [x] 4.1 Refactorizar `src/main.jsx` en componentes limpios (`src/App.jsx`, `src/components/Header.jsx`, `src/components/AuthView.jsx`) mostrando nombre y badge de rol del usuario activo, selector de idioma ES/EN y banner de notificaciones diferenciadas (`success`/`error`/`info`) descartables; verificar flujo de registro, login y logout en build.
- [x] 4.2 Implementar `src/components/SearchCatalog.jsx` con fechas predeterminadas válidas, atajos rápidos de duración (`1d`, `3d`, `7d`), sugerencias de ubicación desde `/api/locations`, filtros de categoría/capacidad y ordenamiento, además de tarjetas mejoradas con distintivos visuales por categoría; verificar en build que no haya errores de consola ni compilación.
- [x] 4.3 Implementar `src/components/VehicleModal.jsx` mostrando descripción, términos, edición en vivo de fechas dentro del modal, desglose de días × tarifa diaria = total, política de cancelación y recuperación en sitio cuando falla el pago inmediato (reintentar o cambiar a pago al recoger); verificar que los errores `402` y `409` mantengan el flujo recuperable.

## 5. Gestión de reservas propias y panel de administración usable

- [x] 5.1 Implementar `src/components/ReservationsView.jsx` con badges localizados, detalle completo de reserva, modal de modificación de fechas/vehículo conectado a `PATCH /api/reservations/:id` con recálculo previo de precio, y modal de confirmación de cancelación alimentado por `/api/reservations/:id/cancellation-preview`; verificar en build y con pruebas de API.
- [x] 5.2 Implementar `src/components/AdminPanel.jsx` eliminando `window.prompt()` y captura en centavos: formularios en pesos (`MXN`), edición completa de vehículo, botón activar/desactivar visible también para inactivos, tabla de bloqueos con creación/eliminación y advertencia de traslapes, y lista de reservas con filtro por estado; verificar en build.
- [x] 5.3 Renovar `src/styles.css` e `index.html` para lograr una jerarquía visual moderna, limpia, responsiva y accesible (modales, badges de estado, tarjetas de vehículos, controles rápidos y estados vacíos).

## 6. Verificación end-to-end e integración

- [x] 6.1 Crear suite de pruebas HTTP end-to-end en `tests/api.e2e.test.js` cubriendo registro/login con sesión persistente, búsqueda parcial, reserva concurrente (`409`), fallo y recuperación de pago inmediato, modificación de reserva, cancelación gratuita/tardía/al-recoger y control de acceso admin vs cliente.
- [x] 6.2 Ejecutar `npm test`, `npm run build` y una comprobación smoke local de la aplicación servida (`GET /api/health` y rutas principales) para confirmar que todas las pruebas y la compilación pasan sin errores.
