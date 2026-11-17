## Qué se hizo

<!-- Explica en pocas líneas qué cambia y por qué. -->

## Endpoints

<!-- Endpoints nuevos o modificados. Si no hay, escribe "No hay endpoints nuevos". -->

| Método | Ruta | Qué hace |
|---|---|---|
|  |  |  |

## Cómo probarlo

1. `npm ci`
2. `npm run build`, `npm run lint` y `npm run test`
3. `npm run test:e2e` (con `docker compose up -d`)
4. Pasos para probar el cambio en Swagger (`/api/docs`) o Postman, con un caso de éxito y uno de error.

## Revisión

- [ ] La rama sale de `develop` y el PR va hacia `develop`
- [ ] Compila y pasa lint y pruebas
- [ ] Los mensajes de error están en español
- [ ] Se actualizó el README o la colección de Postman si cambió algún endpoint
- [ ] No se sube el archivo `.env`
