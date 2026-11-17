# Guía para contribuir a DonaGest

Esta guía explica cómo trabajamos en el equipo: ramas, commits, Pull Requests y revisiones.

## 1. Preparar el proyecto

```bash
cp .env-example .env        # si el puerto 5432 está ocupado, usar DB_PORT=5433
docker compose up -d
npm ci
npm run start:dev
```

## 2. Ramas

| Rama | Para qué |
|---|---|
| `main` | Versión estable. Solo recibe PRs de release desde `develop`. |
| `develop` | Integración. Todas las funcionalidades llegan aquí primero. |
| `feature/<descripcion>` | Una funcionalidad nueva, por ejemplo `feature/entregas`. |
| `fix/<descripcion>` | Corrección de un error, por ejemplo `fix/stock-negativo`. |

Reglas:

- Toda rama `feature/*` o `fix/*` sale de `develop` actualizado:
  ```bash
  git checkout develop && git pull
  git checkout -b feature/mi-cambio
  ```
- No se hace commit directo a `main` ni a `develop`.
- No se usa `git push --force`.

## 3. Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/es/) en español, en minúscula e imperativo:

```
<tipo>(<módulo>): <qué hace>
```

| Tipo | Cuándo |
|---|---|
| `feat` | Funcionalidad nueva |
| `fix` | Corrección de un error |
| `test` | Pruebas nuevas o cambios en pruebas |
| `docs` | Documentación (README, Postman, guías) |
| `chore` | Configuración, dependencias o herramientas |
| `refactor` | Cambio de código que no cambia el comportamiento |

Ejemplos:

- `feat(donor): agregar búsqueda de donantes por nombre o documento`
- `fix(affected-zone): usar valores por defecto al reemplazar una zona con put`
- `test(delivery): agregar pruebas de las transiciones de estado`

Cada commit debe ser un paso pequeño y completo: tiene que compilar y pasar las pruebas por sí solo. Antes de cada commit:

```bash
npm run build
npm run lint
npm run format:check
npm run test
```

## 4. Pull Requests

1. Sube la rama (`git push -u origin feature/mi-cambio`) y abre el PR hacia `develop`.
2. Llena la plantilla: **Qué se hizo**, **Endpoints** y **Cómo probarlo**.
3. Asigna como revisor a otro integrante.
4. Comenta en el PR el resultado de tus pruebas: qué comandos pasaron y qué respondió cada endpoint.

## 5. Revisión

Quien revisa:

1. Descarga la rama con `gh pr checkout <número>` y corre `npm ci`, build, lint, `npm run test` y `npm run test:e2e`.
2. Prueba los endpoints del PR en Swagger o Postman, con casos de éxito y de error.
3. Si algo falla, pide cambios (`gh pr review <número> --request-changes`). El autor corrige con un commit `fix` en la misma rama.
4. Si todo está bien, aprueba y hace el merge hacia `develop`.

## 6. Reglas del código

- Código en inglés; mensajes de error y Swagger en español.
- El controller solo recibe y delega; la lógica va en el service; los DTOs validan lo que llega.
- Toda operación que mueve el inventario va en una transacción.
- Para mensajes en consola se usa el `Logger` de NestJS, y no se usa el tipo `any` (lint falla en ambos casos).
- Si cambias un endpoint, actualiza el README y la colección de Postman.
- Nunca subas `.env` ni tokens o contraseñas.
