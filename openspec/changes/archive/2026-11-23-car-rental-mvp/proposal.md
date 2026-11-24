# Proposal

## Why

AutoGo necesita un MVP web verificable para probar OpenSpec con un dominio real: permitir descubrir vehículos disponibles y completar reservas sin operar contra inventario inexistente o obsoleto. Este cambio establece primero el contrato de comportamiento para que las decisiones de diseño y las tareas de implementación sean trazables.

## What Changes

- Introducir una cuenta y una sesión autenticada obligatoria para reservar.
- Incorporar catálogo de vehículos con ubicación, fechas, características y filtros.
- Permitir reservar en efectivo al recoger o pagar inmediatamente.
- Validar la disponibilidad nuevamente al confirmar una reserva y avisar si el vehículo ya no está disponible.
- Permitir consultar, modificar y cancelar reservas propias.
- Definir cancelación gratuita dentro de una ventana configurable y reembolso parcial o total según el plazo.
- Incorporar administración de vehículos, tarifas, disponibilidad e inventario.

## Capabilities

### New Capabilities

- `account-authentication`: Registro, inicio de sesión, cierre de sesión y acceso a datos propios.
- `vehicle-catalog`: Búsqueda, filtros y consulta detallada de vehículos disponibles.
- `vehicle-reservation`: Creación, pago, consulta, modificación y cancelación de reservas.
- `fleet-administration`: Administración de vehículos, precios, inventario y estado operativo.

### Modified Capabilities

- Ninguna. No hay capacidades existentes registradas.

## Impact

- Interfaz web para clientes y administradores.
- Servicios de autenticación, catálogo, reservas, pagos y administración.
- Persistencia de cuentas, vehículos, inventario, reservas y transacciones.
- Integración opcional con proveedor de pagos y validación de disponibilidad atómica.
- Afecta directamente a las primeras historias funcionales y a las pruebas end-to-end del MVP.
