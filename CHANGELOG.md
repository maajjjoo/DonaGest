# Cambios de DonaGest API

Todos los cambios importantes de la API quedan en este archivo. Las versiones siguen [Versionado Semántico](https://semver.org/lang/es/).

## [1.1.0] - 2026-11-17

### Agregado

**Zonas afectadas y donantes**
- Búsqueda de zonas por nombre o municipio (`GET /affected-zones?search=`).
- Zonas y familias afectadas por departamento (`GET /affected-zones/stats`).
- Resumen de cada donante con donaciones, unidades y última donación (`GET /donors/:id/summary`).

**Productos, inventario y donaciones**
- Orden de productos por nombre o categoría (`sort` y `order`).
- Historial de ajustes manuales (`GET /inventory/:id/adjustments`).
- Filtro de alertas de stock por categoría (`GET /inventory/alerts?category=`).
- Filtro de donaciones por rango de fechas (`from` y `to`).
- Últimas 10 donaciones recibidas (`GET /donations/recent`).

**Entregas y reportes**
- Cambiar la fecha de una entrega PROGRAMADA (`PATCH /deliveries/:id/reschedule`).
- Actualizar las observaciones de una entrega (`PATCH /deliveries/:id/notes`).
- Entregas programadas con fecha vencida (`GET /deliveries/overdue`).
- Reporte de entregas por departamento (`GET /reports/deliveries-by-department`).
- Reporte de donaciones por mes (`GET /reports/donations-by-month`).
- `GET /health` ahora muestra la versión de la API y los segundos en línea.

**Calidad y documentación**
- Filtro global de errores: todas las respuestas de error traen `statusCode`, `error`, `message`, `path` y `timestamp`.
- Registro en consola de cada petición con método, ruta, código y tiempo.
- Pruebas e2e del CRUD de zonas y donantes, de productos, inventario y donaciones, del flujo completo de entregas y de los reportes.
- Plantilla de Pull Request y guía de contribución (`CONTRIBUTING.md`).
- Reglas de inventario y donaciones en el README.
- Colección de Postman con todos los endpoints nuevos (93 requests).

### Cambiado
- Eliminar un donante con donaciones, o un producto con donaciones o entregas, sigue respondiendo 409, pero ahora el mensaje dice el nombre del registro y la razón.

## [1.0.0] - 2026-11-16

Primera versión estable.

### Agregado
- Configuración base: NestJS 12, PostgreSQL 16 en Docker, TypeORM, validación global, prefijo `/api/v1`, Swagger en `/api/docs`, paginación y traducción de errores de la base de datos.
- **Zonas afectadas**: CRUD con departamentos de Colombia, tipo de emergencia, prioridad, filtros, orden de CRITICA a BAJA y activación o desactivación.
- **Donantes**: CRUD con documento y correo únicos, validación de celular colombiano y de documento según su tipo, búsqueda e historial de donaciones.
- **Productos**: CRUD con inventario automático en 0, nombre único, filtros y productos agotados.
- **Inventario**: consulta general y por producto, alertas de stock mínimo, cambio del mínimo y ajustes manuales con motivo sin dejar el stock en negativo.
- **Donaciones**: registro que suma al inventario en una transacción, anulación que descuenta el stock, filtros, máximo de 10.000 unidades y resumen por producto.
- **Entregas**: programación con control de stock, sin fechas pasadas y solo a zonas activas; mapa de estados (PROGRAMADA → EN_TRANSITO → ENTREGADA, o CANCELADA con devolución del stock), filtros y entregas de los próximos 7 días.
- **Reportes**: resumen general, resumen por zona, top 5 de donantes, inventario por categoría y zonas sin entregas.
- `GET /health` con verificación de la base de datos (503 si no responde).
- Datos iniciales (`npm run seed`) con emergencias en Sucre, La Guajira, Chocó y Risaralda.
- Pruebas unitarias, pruebas e2e, colección de Postman y README.

[1.1.0]: https://github.com/maajjjoo/DonaGest/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/maajjjoo/DonaGest/releases/tag/v1.0.0
