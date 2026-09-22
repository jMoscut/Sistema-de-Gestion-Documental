# SGDP — Manual Técnico

## Sistema de Gestión Documental Pública · Municipalidad de San Raymundo

| | |
|---|---|
| Versión del documento | 1.0 |
| Fecha | Septiembre 2026 |
| Autora | Jackeline Nikole Sanchez Moscut |
| Dirigido a | Personal técnico que instale, configure, mantenga o despliegue el sistema |

Este manual documenta el sistema **tal como está implementado**, verificado directamente contra el código fuente (backend `sgdp-backend/`, frontend `sgdp-frontend/`). No es un documento de requerimientos ni de casos de uso — para eso ver `SGDP_DERCAS_Completo.md` y `SGDP_Casos_de_Uso.md` en esta misma carpeta.

---

## Índice

1. [Introducción](#1-introducción)
2. [Arquitectura del Sistema](#2-arquitectura-del-sistema)
3. [Stack Tecnológico](#3-stack-tecnológico)
4. [Estructura del Proyecto](#4-estructura-del-proyecto)
5. [Instalación y Configuración Local](#5-instalación-y-configuración-local)
6. [Variables de Entorno](#6-variables-de-entorno)
7. [Base de Datos](#7-base-de-datos)
8. [Seguridad y Control de Acceso](#8-seguridad-y-control-de-acceso)
9. [Módulos del Backend](#9-módulos-del-backend)
10. [Frontend](#10-frontend)
11. [Sistema de Notificaciones](#11-sistema-de-notificaciones)
12. [Almacenamiento de Archivos (Cloudflare R2)](#12-almacenamiento-de-archivos-cloudflare-r2)
13. [Correo Electrónico (Brevo)](#13-correo-electrónico-brevo)
14. [Pruebas Automatizadas](#14-pruebas-automatizadas)
15. [CI/CD — GitHub Actions](#15-cicd--github-actions)
16. [Despliegue en Producción](#16-despliegue-en-producción)
17. [Seguridad — Escaneo OWASP ZAP](#17-seguridad--escaneo-owasp-zap)
18. [Solución de Problemas Comunes](#18-solución-de-problemas-comunes)
19. [Glosario Técnico](#19-glosario-técnico)

---

## 1. Introducción

SGDP es una aplicación web de dos capas (backend REST + frontend SPA) para la gestión documental de la Municipalidad de San Raymundo: repositorio de documentos institucionales, atención de solicitudes de acceso a la información pública (Decreto 57-2008, LAIP) y publicación proactiva de información de oficio (Art. 10).

Repositorio: `sgdp-backend/` (API) y `sgdp-frontend/` (SPA), cada uno con su propio `pom.xml`/`package.json`.

---

## 2. Arquitectura del Sistema

```
┌─────────────────────┐      HTTPS/JSON       ┌──────────────────────┐
│   sgdp-frontend      │ ───────────────────▶  │    sgdp-backend      │
│   React 18 + Vite    │ ◀───────────────────  │  Spring Boot 3.3.4   │
│ (Cloudflare Pages)    │       JWT Bearer       │     (Railway)         │
└─────────────────────┘                        └──────────┬───────────┘
                                                            │
                        ┌───────────────────────────────────┼───────────────────────┐
                        │                                   │                       │
                 ┌──────▼──────┐                   ┌────────▼────────┐   ┌──────────▼─────────┐
                 │  Neon        │                   │  Cloudflare R2   │   │  Brevo               │
                 │  PostgreSQL 16│                   │  (S3-compatible) │   │  (email transaccional)│
                 └──────────────┘                   └──────────────────┘   └────────────────────┘
```

- **Frontend**: SPA React servida como build estático en Cloudflare Pages. Dos árboles de rutas: público (`/`, `/solicitud`, `/seguimiento`, `/buscar`, `/informacion-publica`) y administrativo (`/admin/*`, protegido por JWT).
- **Backend**: API REST sin estado (`SessionCreationPolicy.STATELESS`). Toda autenticación vía JWT (`Authorization: Bearer <token>`), validado en cada request por `JwtFilter`.
- **Base de datos**: PostgreSQL 16 serverless en Neon, con Flyway para migraciones versionadas.
- **Archivos**: todos los PDF (documentos del repositorio y de información de oficio) se almacenan en Cloudflare R2; el backend actúa como proxy — nunca se expone una URL pública directa de R2.
- **Correo**: Brevo vía API HTTP (no SMTP/Spring Mail) para confirmaciones de solicitud, respuestas/denegaciones y alertas de vencimiento próximo al ciudadano.

---

## 3. Stack Tecnológico

**Backend** (`sgdp-backend/pom.xml`):

| Componente | Versión |
|---|---|
| Java | 17 |
| Spring Boot | 3.3.4 |
| Spring Security | 6.x (incluido en Boot 3.3.4) |
| jjwt (JWT) | 0.12.6 |
| PostgreSQL driver | — (Hibernate 6, dialecto `PostgreSQLDialect`) |
| Flyway | — (gestionado por Spring Boot BOM) |
| AWS SDK v2 (para R2) | 2.26.31 |
| iText (PDF) | 8.0.4 |
| OpenCSV | 5.9 |
| JaCoCo | 0.8.11 |

**Frontend** (`sgdp-frontend/package.json`):

| Componente | Versión |
|---|---|
| React | 18.3 |
| TypeScript | 5.5 |
| Vite | 5.4 |
| TanStack Query | 5.56 |
| React Hook Form | 7.53 |
| Zod | 3.23 |
| React Router DOM | 6.26 |
| Tailwind CSS | 3.4 |
| Axios | 1.7 |
| date-fns | 3.6 |
| Jest + Testing Library | 29.7 / 16.0 |

**Infraestructura**: Railway (backend), Cloudflare Pages (frontend), Neon (PostgreSQL 16), Cloudflare R2 (archivos), Brevo (correo), GitHub Actions (CI/CD).

---

## 4. Estructura del Proyecto

### Backend — `sgdp-backend/src/main/java/gt/gob/sanraymundo/sgdp/`

```
config/       SecurityConfig, CorsConfig, JacksonConfig, R2Config, WebConfig, DataInitializer
controller/   10 controladores REST (ver sección 9)
dto/          request/ y response/ — DTOs de entrada y salida
exception/    NegocioException, RecursoNoEncontradoException, GlobalExceptionHandler
model/
  entity/     13 entidades JPA (ver sección 7)
  enums/      EstadoSolicitud, NivelAcceso, RolUsuario, TipoAccion
repository/   Spring Data JPA repositories + Specifications (búsqueda de documentos)
scheduler/    PlazosScheduler (único scheduler del sistema)
security/     JwtFilter, JwtUtil, CustomUserDetailsService
service/      15 servicios (ver sección 9)
```

### Frontend — `sgdp-frontend/src/`

```
components/
  admin/      Sidebar, Topbar, AdminLayout, NotificationBell (campanita)
  common/     Button, Input, Alert, Spinner, Badge
context/      AuthContext (estado de sesión, login/logout)
hooks/        useAuth
pages/
  admin/      DashboardPage, DocumentosPage, SolicitudesPage, InformacionOficioPage,
              UsuariosPage, AuditoriaPage, ReportesPage, LoginPage, ChangePasswordPage
  public/     HomePage, BuscadorPublicoPage, InformacionOficioPage,
              PresentarSolicitudPage, SeguimientoPage
services/     Un archivo por dominio (documentos, solicitudes, usuarios, oficio, auditoria,
              reportes, notificaciones, publico, dashboard, auth) — todos sobre Axios (`api.ts`)
types/        Interfaces TypeScript por dominio, espejo de los DTOs del backend
```

---

## 5. Instalación y Configuración Local

### Requisitos previos
- Java 17
- Node.js 18+
- PostgreSQL 16 (local, o cuenta Neon)
- Cuenta S3-compatible para archivos (Cloudflare R2, o MinIO en local)
- Cuenta Brevo (opcional en desarrollo — sin `BREVO_API_KEY` el envío de correo simplemente no ocurre, no rompe el flujo)

### Backend

```bash
cd sgdp-backend
cp .env.example application-local.properties   # completar con credenciales reales
mvn spring-boot:run
```

La API queda en `http://localhost:8080`. Flyway ejecuta las 11 migraciones automáticamente al iniciar (`spring.flyway.enabled=true`).

### Frontend

```bash
cd sgdp-frontend
npm install
cp .env.example .env.local
npm run dev
```

La SPA queda en `http://localhost:5173`, con proxy a `/api` hacia el backend.

---

## 6. Variables de Entorno

Todas con valor por defecto para desarrollo local (ver `application.properties`), sobreescribibles por variable de entorno real en producción:

| Variable | Descripción | Default local |
|---|---|---|
| `DATABASE_URL` | JDBC URL de PostgreSQL | `jdbc:postgresql://localhost:5432/sgdp_db` |
| `DATABASE_USERNAME` / `DATABASE_PASSWORD` | Credenciales de BD | `sgdp_app` / `local_dev_password` |
| `JWT_SECRET` | Secreto de firma JWT, mínimo 64 caracteres | clave de desarrollo (no usar en producción) |
| `R2_ACCESS_KEY` / `R2_SECRET_KEY` | Credenciales S3-compatibles de Cloudflare R2 | `minioadmin` / `minioadmin` |
| `R2_BUCKET_NAME` | Nombre del bucket | `sgdp-documentos` |
| `R2_ENDPOINT` | Endpoint S3-compatible | `http://localhost:9000` (MinIO local) |
| `BREVO_API_KEY` | API key de Brevo (vacío = correo deshabilitado) | vacío |
| `BREVO_SENDER_EMAIL` / `BREVO_SENDER_NAME` | Remitente de los correos | `noreply@sanraymundo.gob.gt` |
| `FRONTEND_URL` | Origen permitido por CORS | `http://localhost:5173` |
| `VITE_API_URL` (frontend) | Base URL de la API consumida por el frontend | `/api` |

> **Nota sobre zona horaria**: el sistema **no depende de ninguna variable `TZ`** del contenedor. Todos los timestamps que importan (auditoría, bloqueo de cuenta) se calculan explícitamente en UTC en el código (`Instant.now()` / `LocalDateTime.now(ZoneOffset.UTC)`) y se convierten a la zona correcta (navegador del usuario, o `America/Guatemala` para mensajes de servidor) en el punto de presentación. Configurar `TZ` en Railway no tiene efecto sobre esto — ver sección 18.

---

## 7. Base de Datos

### Migraciones Flyway (`sgdp-backend/src/main/resources/db/migration/`)

| Migración | Contenido |
|---|---|
| V1 | Tablas base: `usuarios`, `documentos`, `categorias_documento`, `solicitudes_informacion`, `registro_auditoria`, `historial_contrasenas` |
| V2 | Inserción de las 29 categorías fijas del Art. 10 LAIP |
| V3 | Usuario administrador inicial |
| V4 | Índices de búsqueda |
| V5 | Columnas de archivo para información de oficio |
| V6 | Reestructuración jerárquica de oficio: `categoria_oficio`, `carpeta_oficio`, `documento_oficio` (inserta las 29 categorías LAIP directamente, numeradas 1–29 conforme Decreto 57-2008 Art. 10) |
| V7 | Las 7 secciones de transparencia (LAIP, COMUDE, PRESUPUESTARIA, SINACIG, RENDICION_CUENTAS, DECRETO_101_97, DECRETO_36_2024) |
| V8 | Tabla `metas_cumplimiento` |
| V9 | Ciclo de vida documental, hash SHA-256, columnas de seguridad |
| V10 | Simplificación de `nivel_acceso` a solo PUBLICO/INTERNO |
| V11 | Login por `nombre_usuario` en vez de correo electrónico |

### Entidades JPA (13 tablas de dominio + `flyway_schema_history`)

`Usuario`, `Documento`, `CategoriaDocumento`, `SolicitudInformacion`, `CategoriaOficio`, `CarpetaOficio`, `DocumentoOficio`, `InformacionOficio`, `RegistroAuditoria`, `HistorialContrasena`, `VersionDocumento`, `SecuenciaCodigo`, `MetaCumplimiento`.

Para el diccionario de datos completo (campo por campo, tipos y restricciones reales) ver la sección 7 de `SGDP_DERCAS_Completo.md` — verificado directamente contra un export real del esquema de Neon.

---

## 8. Seguridad y Control de Acceso

### 8.1 Reglas de autorización reales (`SecurityConfig.java`)

```
OPTIONS /**                          → permitAll (preflight CORS)
POST /api/auth/login                 → permitAll
/api/publico/**                      → permitAll
/actuator/health                     → permitAll

/api/admin/auditoria/**              → ADMINISTRADOR
/api/admin/reportes/auditoria/**     → ADMINISTRADOR
/api/usuarios/**                     → ADMINISTRADOR

/api/admin/dashboard/**              → ADMINISTRADOR, OFICIAL, FUNCIONARIO
GET /api/admin/oficio/**             → ADMINISTRADOR, OFICIAL, FUNCIONARIO (lectura)

/api/admin/**                        → ADMINISTRADOR, OFICIAL (resto: escritura de oficio, reportes)
/api/solicitudes/**                  → ADMINISTRADOR, OFICIAL

cualquier otra ruta                  → requiere estar autenticado
```

`/api/documentos/**` no tiene regla explícita — cae en "requiere autenticado", visible para los 3 roles (Funcionario incluido, de solo lectura por lógica de negocio en el frontend/controller, no por restricción de Spring Security).

Peticiones sin token válido devuelven **401** (no 403), para que el frontend pueda redirigir a login. Peticiones con rol insuficiente devuelven **403** (`AccessDeniedException` → `GlobalExceptionHandler`).

### 8.2 JWT

- Generado en `AuthService.login()` tras validar credenciales.
- Expiración: 8 horas.
- Validado en cada request por `JwtFilter`, que puebla el `SecurityContext`.
- El nombre de usuario en el login es `nombre_usuario`, **no** el correo electrónico (desde V11).

### 8.3 Bloqueo de cuenta por intentos fallidos

- `MAX_INTENTOS_FALLIDOS = 3`, `MINUTOS_BLOQUEO = 15` (constantes en `AuthService`).
- El incremento del contador y el cálculo de `bloqueado_hasta` corren en **`UsuarioService.registrarIntentoFallido()`**, anotado `@Transactional(propagation = REQUIRES_NEW)` — transacción independiente de `login()`, para que el contador persista aunque `login()` termine lanzando una excepción y haga rollback de su propia transacción (bug real corregido esta versión: antes, el contador nunca se guardaba y la cuenta jamás se bloqueaba).
- `bloqueado_hasta` se calcula y compara siempre con `LocalDateTime.now(ZoneOffset.UTC)`, nunca con la zona por defecto del servidor.
- Mensaje al usuario ("Cuenta bloqueada temporalmente...") convierte la hora a `America/Guatemala` (UTC-6, sin horario de verano) solo para mostrarla — el dato en BD sigue siendo UTC puro.
- El Administrador puede desbloquear manualmente antes de que expiren los 15 minutos: `PUT /api/usuarios/{id}/desbloquear` → `UsuarioService.desbloquearCuenta()`, que valida que la cuenta siga realmente bloqueada (si no, HTTP 400 "La cuenta no está bloqueada.").

### 8.4 Auditoría inmutable

- `REVOKE UPDATE, DELETE ON registro_auditoria FROM sgdp_app` a nivel de base de datos.
- Toda escritura de auditoría (`AuditoriaService.registrar()`, `registrarExito()`, `registrarFallo()`) corre en `@Transactional(propagation = REQUIRES_NEW)` — el registro de auditoría persiste incluso si la operación que lo originó falla y hace rollback.
- `timestamp_utc` es un `Instant` (no `LocalDateTime`), serializado con offset `Z` — el frontend lo convierte automáticamente a la hora local del navegador al mostrarlo (`date-fns parseISO` + `format`).

---

## 9. Módulos del Backend

### Controladores (`controller/`)

| Controlador | Responsabilidad |
|---|---|
| `AuthController` | Login, cambio de contraseña, logout |
| `DocumentoController` | CRUD de documentos y categorías, descarga con verificación de hash, versionado |
| `SolicitudAdminController` | Listado, asignación, respuesta, denegación y prórroga de solicitudes LAIP |
| `NotificacionAdminController` | `GET /api/admin/notificaciones` — campanita |
| `OficioAdminController` | Gestión de categorías/carpetas/documentos de información de oficio |
| `UsuarioController` | CRUD de usuarios, activar/desactivar, restablecer contraseña, desbloquear cuenta |
| `AuditoriaAdminController` | Consulta filtrada del log de auditoría |
| `ReporteAdminController` | Exportación CSV/PDF de solicitudes, documentos y auditoría |
| `DashboardAdminController` | Estadísticas y metas de cumplimiento |
| `PublicoController` | Todos los endpoints del Portal Ciudadano (sin autenticación) |

### Servicios (`service/`)

`AuthService`, `UsuarioService`, `DocumentoService`, `SolicitudService`, `NotificacionService`, `InformacionOficioService`, `OficioAdminService`, `AuditoriaService`, `AuditoriaAdminService`, `DiasHabilesService`, `EmailService`, `FileValidatorService`, `HashService`, `MetaCumplimientoService`, `R2StorageService`.

### Reglas de negocio clave verificadas en código

- **Permisos de solicitudes**: el rol `ADMINISTRADOR` solo puede ver y asignar (`puedeActuar = !isAdmin && esOficialAsignado`). Solo el Oficial asignado a una solicitud específica puede responder, prorrogar o denegarla. Un Oficial solo puede autoasignarse (el selector de asignación se bloquea a su propio ID); solo el Administrador puede asignar a cualquier otro oficial.
- **VENCIDA no es un estado terminal**: está incluido como estado de origen válido en `asignarOficial()`, `responder()`, `prorrogar()` y `denegar()` dentro de `SolicitudService` — una solicitud vencida conserva las mismas acciones que una activa.
- **Plazo de solicitudes**: 10 días hábiles iniciales (`DiasHabilesService.calcularFechaLimite()`); prórroga = fecha límite actual + 10 días hábiles adicionales.
- **Verificación de integridad**: el hash SHA-256 se calcula en el backend al registrar el documento y se recalcula/compara en cada descarga (`DocumentoService.descargarConVerificacion()`).

---

## 10. Frontend

### Enrutamiento

- **Público** (`react-router-dom`, sin guard): `/`, `/solicitud`, `/seguimiento`, `/buscar`, `/informacion-publica`.
- **Admin** (`/admin/*`, protegido por `AuthContext`): redirige a `/admin/login` si no hay sesión válida; redirige a `/admin/cambiar-contrasena` si `requiereCambioContrasena` es verdadero.

### Estado de sesión

`AuthContext` decodifica el JWT en el cliente para poblar `user` (id, nombre, rol) sin llamada adicional al backend; persiste el token en `localStorage`.

### Datos remotos

TanStack Query para todo el fetching — cache, invalidación tras mutaciones, y polling donde aplica (Dashboard y campanita de notificaciones refrescan cada 60 segundos vía `refetchInterval`).

### Componente de notificaciones

`NotificationBell.tsx` en el Topbar, visible solo para `ADMINISTRADOR` y `OFICIAL`. Al hacer clic en una notificación, navega a `/admin/solicitudes` o `/admin/oficio` según el tipo.

---

## 11. Sistema de Notificaciones

Dos mecanismos independientes, no confundir uno con otro:

| Mecanismo | Destinatario | Canal | Disparador |
|---|---|---|---|
| `PlazosScheduler` | Ciudadano solicitante | Email (Brevo) | Job diario `@Scheduled(cron = "0 0 13 * * *")` — 13:00 UTC = 7:00 AM Guatemala. Marca VENCIDA las solicitudes que superaron su plazo y envía `EmailService.alertaDia7()` a las que tienen ≤3 días hábiles restantes |
| `NotificacionService` | Personal (Administrador, Oficial) | Campanita in-app, sin correo | Bajo demanda, en cada `GET /api/admin/notificaciones` (frontend hace polling cada 60s). Tres tipos: `SOLICITUD_POR_VENCER` (≤3 días hábiles), `SOLICITUD_VENCIDA`, `OFICIO_DESACTUALIZADO` (carpeta sin publicar en >25 días) |

La alerta de oficio desactualizado también se muestra de forma expandible en el Dashboard (`AlertaCarpetasDesactualizadas`), calculada por `CarpetaOficioRepository.findCarpetasDesactualizadas()`.

---

## 12. Almacenamiento de Archivos (Cloudflare R2)

- Cliente: AWS SDK v2, configurado en `R2Config.java` contra el endpoint S3-compatible de R2.
- El backend siempre actúa como proxy de descarga — nunca se expone una URL pública directa del bucket.
- Documentos del repositorio y documentos de oficio comparten el mismo bucket, con claves organizadas por tipo.
- Validación de archivo: `FileValidatorService` verifica encabezado real de PDF (no solo extensión/MIME declarado por el cliente).

---

## 13. Correo Electrónico (Brevo)

- `EmailService` llama a la API HTTP de Brevo (no usa Spring Mail/SMTP).
- Envíos reales: confirmación al presentar una solicitud, notificación de respuesta o denegación al ciudadano, y `alertaDia7()` (vencimiento próximo) vía `PlazosScheduler`.
- Sin `BREVO_API_KEY` configurada, el envío simplemente no ocurre — el error se registra en el log, no interrumpe el flujo (ej. la solicitud se crea igual aunque el correo falle).

---

## 14. Pruebas Automatizadas

| | Backend | Frontend |
|---|---|---|
| Framework | JUnit 5 + Mockito | Jest + React Testing Library |
| Total de pruebas | 155 | 164 (27 suites) |
| Gate de cobertura (CI) | JaCoCo ≥ 45% líneas | ≥ 50% |
| Comando | `mvn test` (o `mvn verify` para incluir el gate) | `npm run test:coverage` |

El umbral se bajó de un objetivo inicial de 70% a 45%/50% tras medir variación real de cobertura entre el entorno local y el runner de CI (Postgres vía Docker en GitHub Actions se comporta distinto a una BD de desarrollo local).

Pruebas backend destacadas: `AuthServiceTest` (login, bloqueo/desbloqueo), `UsuarioServiceTest` (`registrarIntentoFallido`, `desbloquearCuenta`), `SolicitudServiceTest` (permisos, reactivación VENCIDA), `NotificacionServiceTest`, `AuditoriaServiceTest` (incluye pruebas de que un fallo del repositorio no propaga y no rompe el flujo llamador), `DiasHabilesServiceTest`.

---

## 15. CI/CD — GitHub Actions

Workflows en `.github/workflows/`:

| Workflow | Disparador | Qué hace |
|---|---|---|
| `ci.yml` | Push / PR | `mvn verify` (backend, incluye gate JaCoCo) + `npm run test:coverage` (frontend, incluye gate Jest). Bloquea el resto del pipeline si falla cualquiera de los dos |
| `deploy-frontend.yml` | Push a main (tras CI verde) | Build y deploy del frontend a Cloudflare Pages |
| `security-scan.yml` | Manual (`workflow_dispatch`) | Escaneo OWASP ZAP baseline contra producción (ver sección 17) |

El gate de JaCoCo está ligado a la fase `verify` de Maven (`jacoco-maven-plugin`, ejecución `check` sin `<phase>` explícita, se dispara automáticamente en `verify`) — no requiere un paso adicional en el YAML para hacerse cumplir.

---

## 16. Despliegue en Producción

- **Backend**: Railway, contenedor Docker, deploy automático desde GitHub tras CI verde. Migraciones Flyway se aplican al arrancar el contenedor.
- **Frontend**: Cloudflare Pages, build estático servido tras `npm run build`.
- **Base de datos**: Neon (PostgreSQL 16 serverless), con backups automáticos gestionados por el proveedor.
- **Archivos**: Cloudflare R2.
- **HSTS**: Railway termina TLS antes de que la petición llegue a la app, por lo que Spring no confiaba en `X-Forwarded-Proto` y no emitía la cabecera `Strict-Transport-Security`. Se corrigió con una sola línea: `server.forward-headers-strategy=framework` en `application.properties`.

---

## 17. Seguridad — Escaneo OWASP ZAP

Ejecutado como baseline scan real contra la URL de producción, vía `docker run ghcr.io/zaproxy/zaproxy:stable zap-baseline.py` disparado manualmente desde GitHub Actions (`security-scan.yml`).

**Resultado**: 0 alertas HIGH, 0 MEDIUM, 0 LOW, 1 informativa.

**Hallazgo corregido durante el proceso**: ausencia de cabecera HSTS (ver sección 16) — antes del fix, la primera corrida mostró 1 alerta LOW por esta causa; tras aplicar `server.forward-headers-strategy=framework`, la segunda corrida quedó limpia.

---

## 18. Solución de Problemas Comunes

**"Cuenta bloqueada" no aparece nunca aunque falle el login repetidas veces**
Bug histórico ya corregido: si vuelve a aparecer, verificar que `UsuarioService.registrarIntentoFallido()` siga anotado `@Transactional(propagation = REQUIRES_NEW)` — sin eso, el contador se pierde en el rollback de la transacción de `login()`.

**El mensaje de cuenta bloqueada muestra una hora que no es la de Guatemala**
Verificar que `AuthService` y `UsuarioService` sigan calculando/comparando `bloqueado_hasta` con `LocalDateTime.now(ZoneOffset.UTC)` explícito, y que el mensaje al usuario pase por la conversión a `ZoneId.of("America/Guatemala")` antes de mostrarse. **No** intentar arreglarlo configurando la variable `TZ` del contenedor — no tiene efecto sobre este cálculo, que es explícito en código.

**Timestamps de auditoría se ven con varias horas de diferencia**
Confirmar que `RegistroAuditoria.timestampUtc` siga siendo `Instant` (no `LocalDateTime`) — Jackson necesita serializarlo con offset `Z` para que el frontend (`parseISO` + `format` de date-fns) lo convierta correctamente a la hora local del navegador.

**Un intento de login con usuario mal escrito no incrementa el contador de intentos fallidos**
Comportamiento esperado: `AuthService.login()` solo incrementa `intentos_fallidos` cuando el usuario existe y la contraseña es incorrecta. Un nombre de usuario inexistente cae en una rama distinta (`BadCredentialsException` inmediata) que no toca ningún contador — por diseño, ya que no hay una fila de `Usuario` que actualizar.

**Falla el CI con `xmllint: command not found`**
Ya no debería ocurrir — se eliminó un paso redundante en `ci.yml` que reparseaba el XML de JaCoCo; el gate real ya lo aplica `jacoco-maven-plugin` durante `mvn verify`.

---

## 19. Glosario Técnico

| Término | Definición |
|---|---|
| REQUIRES_NEW | Propagación de transacción de Spring que abre una transacción completamente independiente, con su propio commit/rollback — usada en este proyecto para que la auditoría y el contador de intentos fallidos sobrevivan al rollback de la operación que los originó |
| JWT | JSON Web Token — usado para autenticación stateless; expira a las 8 horas |
| RBAC | Control de acceso basado en roles (`ADMINISTRADOR`, `OFICIAL`, `FUNCIONARIO`) |
| APPEND-ONLY | Tabla de BD con `REVOKE UPDATE, DELETE`, garantizando inmutabilidad del log de auditoría |
| Campanita | Componente `NotificationBell` — centro de notificaciones internas, sin correo, visible para Administrador y Oficial |
| PlazosScheduler | Único job programado del sistema; corre diario a las 7 AM hora de Guatemala; marca solicitudes VENCIDA y envía email de alerta al ciudadano |
| Baseline scan | Modo de escaneo pasivo de OWASP ZAP, usado en este proyecto vía GitHub Actions manual |

---

*Manual Técnico — SGDP — Municipalidad de San Raymundo — Versión 1.0 — Septiembre 2026*
