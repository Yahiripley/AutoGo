# Proposal

## Why

El MVP actual de AutoGo cumple la estructura mínima en servidor, pero presenta fricciones importantes para usuarios y administradores: búsqueda estricta sensible a mayúsculas, fechas vacías sin cálculo previo del total, ausencia de interfaz para ver detalles del vehículo o modificar reservas, cancelaciones sin confirmación ni vista previa de reembolso, administración basada en `window.prompt()` en centavos, sesiones volátiles en memoria y mezcla de idioma inglés con moneda MXN. Este cambio transforma AutoGo en una aplicación práctica, sencilla, bilingüe (español/inglés) y amigable de punta a punta.

## What Changes

- **Experiencia bilingüe (ES/EN) y formato local**: Selector de idioma persistente entre español e inglés en toda la interfaz, mensajes de error localizados y formateo legible de montos y fechas según la moneda configurada (`MXN`).
- **Búsqueda y catálogo práctico**: Búsqueda de ubicación insensible a mayúsculas y coincidencia parcial, selector de ubicaciones disponibles, fechas iniciales sugeridas con atajos rápidos, ordenamiento de resultados y tarjetas visuales por categoría.
- **Detalle del vehículo y reserva guiada**: Vista de detalle completa con descripción, términos, cálculo automático de días y total, resumen de política de cancelación, y recuperación en sitio ante fallo de pago inmediato (reintentar o cambiar a pago al recoger).
- **Gestión completa de reservas propias**: Interfaz para modificar fechas o vehículo de reservas activas con recálculo de precio, diálogo de confirmación previo a cancelar mostrando el reembolso estimado según `policy_snapshot`, y badges claros de estado.
- **Administración de flota usable**: Edición completa de vehículos en moneda legible (pesos, sin centavos ni `window.prompt()`), activación/desactivación con visibilidad de vehículos inactivos para administradores, listado y eliminación de bloqueos de inventario con advertencia de conflictos, y filtros operativos en reservas/reembolsos.
- **Autenticación y operación confiable**: Persistencia de sesiones en SQLite (sin pérdida al reiniciar el servidor), bootstrap configurable de cuenta administradora para pruebas locales, indicador visible del usuario autenticado en cabecera, notificaciones diferenciadas por tipo y suite de pruebas end-to-end que cubra todos los flujos críticos.

## Capabilities

### New Capabilities
- `bilingual-experience`: Cambio de idioma en tiempo real entre español e inglés con preferencia persistente, mensajes de respuesta localizables y formato consistente de moneda y fechas.

### Modified Capabilities
- `account-authentication`: Persistencia de sesiones en base de datos, visualización del usuario y rol activos en la interfaz, y provisión inicial configurable de cuenta administradora.
- `vehicle-catalog`: Búsqueda tolerante por ubicación con opciones sugeridas, fechas predeterminadas y atajos, ordenamiento, y vista detallada del vehículo con cálculo total y términos.
- `vehicle-reservation`: Cotización y política de cancelación visibles antes de confirmar, recuperación directa ante fallo de pago inmediato, modificación de reservas desde la interfaz y confirmación explícita de cancelación con vista previa de reembolso.
- `fleet-administration`: Captura de tarifas en unidad monetaria principal, edición integral y reactivación de vehículos inactivos, consulta y eliminación de bloqueos de inventario, y visibilidad filtrada de reservas y reembolsos.

## Impact

- **Frontend** (`src/`, `index.html`): Refactorización de la SPA en componentes modulares con diccionario i18n (`es`/`en`), manejo de estados de carga/error/éxito, modales accesibles de detalle/edición/cancelación y panel administrativo completo.
- **Backend** (`server/`): Persistencia de sesiones en SQLite (`sessions`), endpoints administrativos adicionales (`GET /api/admin/vehicles`, `GET /api/admin/blocks`, `DELETE /api/admin/blocks/:id`), consulta de ubicaciones disponibles, cálculo/vista previa de reembolso y mensajes de error estructurados/localizables.
- **Configuración y scripts** (`package.json`, `server/config.js`, `server/db.js`): Script unificado de desarrollo para levantar API y frontend juntos, y semilla opcional/configurable de administrador.
- **Pruebas** (`tests/`): Nuevas pruebas de integración HTTP end-to-end para registro/login, reserva concurrente, fallo y recuperación de pago inmediato, modificación, cancelación gratuita/tardía y autorización de roles.
