# SGDP — Documento de Especificación de Requerimientos, Casos de Uso y Arquitectura del Sistema
## DERCAS v2.0

---

**Universidad Mariano Gálvez de Guatemala**  
Facultad de Ingeniería en Sistemas y Ciencias de la Computación  
Proyecto de Graduación I y II

| Campo | Detalle |
|-------|---------|
| Proyecto | Sistema de Gestión Documental Pública (SGDP) |
| Cliente | Municipalidad de San Raymundo, Guatemala |
| Estudiante | Jackeline Nikole Sanchez Moscut |
| Carné | 7590-22-332 |
| Asesor | Ing. Román Estuardo Cancinos Arbizu |
| Revisora | [PENDIENTE] |
| Versión | 2.0 |
| Fecha | Julio 2026 |
| Clasificación | Documento de proyecto académico |

---

## Tabla de Contenidos

1. [Introducción](#1-introducción)
2. [Descripción General del Sistema](#2-descripción-general-del-sistema)
3. [Requerimientos Funcionales](#3-requerimientos-funcionales-rf-01--rf-18)
4. [Requerimientos No Funcionales](#4-requerimientos-no-funcionales-rnf-01--rnf-07)
5. [Reglas de Negocio](#5-reglas-de-negocio-rn-01--rn-10)
6. [Arquitectura del Sistema](#6-arquitectura-del-sistema)
7. [Diccionario de Datos](#7-diccionario-de-datos)
8. [Criterios de Aceptación del Sistema](#8-criterios-de-aceptación-del-sistema-ca-01--ca-10)
9. [Tabla de Evaluación y Aceptación](#9-tabla-de-evaluación-y-aceptación)
10. [Modelo de Calidad ISO/IEC 25010](#10-modelo-de-calidad-isoiec-25010)
11. [Estrategia de Ciberseguridad](#11-estrategia-de-ciberseguridad)
12. [Plan de Pruebas Resumido](#12-plan-de-pruebas-resumido)
13. [Glosario Técnico](#13-glosario-técnico)

---

## 1. Introducción

### 1.1 Propósito del Documento

El presente DERCAS (Documento de Especificación de Requerimientos, Casos de Uso y Arquitectura del Sistema) establece de forma completa y verificable los requerimientos funcionales, no funcionales, reglas de negocio, arquitectura técnica y criterios de aceptación del Sistema de Gestión Documental Pública (SGDP) desarrollado para la Municipalidad de San Raymundo, Guatemala.

Este documento constituye el artefacto central de especificación para el proyecto de graduación universitaria, siguiendo la metodología FAST (Facilitated Application Specification Techniques) integrada con elementos de RUP (Rational Unified Process) y los estándares internacionales de gestión documental ISO 30300:2020, ISO 15489-1:2016 e ISO 16175-1:2020.

El DERCAS sirve como contrato técnico entre el equipo de desarrollo y la Municipalidad, y como documento base para la verificación académica del cumplimiento de requerimientos.

### 1.2 Alcance del Sistema

El SGDP gestiona el ciclo de vida completo de documentos oficiales de la Municipalidad de San Raymundo y el cumplimiento de las obligaciones de transparencia establecidas por el Decreto 57-2008 (Ley de Acceso a la Información Pública — LAIP).

**El sistema comprende dos interfaces diferenciadas:**

**Portal Público** (sin autenticación, Cloudflare Pages):
- Navegación de 7 secciones de transparencia obligatoria (Art. 10 LAIP)
- Búsqueda de texto completo en repositorio documental público
- Presentación de solicitudes de información (EXP-YYYY-NNNN)
- Seguimiento de trámites por código de expediente
- Descarga de documentos con nivel de acceso PÚBLICO

**Panel Administrativo** (JWT + RBAC, acceso directo por URL `/admin/login`):
- Gestión de solicitudes LAIP (responder, denegar, prorrogar)
- Registro y clasificación documental ISO 15489-1
- Publicación de información de oficio (Art. 10)
- Administración de usuarios y roles (ADMINISTRADOR únicamente)
- Consulta de log de auditoría (ADMINISTRADOR únicamente)
- Dashboard de cumplimiento en tiempo real

**Fuera del alcance**: Sistema financiero municipal, catastro, licencias de construcción, sistema de nómina, portal de proveedores.

### 1.3 Definiciones y Acrónimos

| Término | Definición |
|---------|-----------|
| SGDP | Sistema de Gestión Documental Pública |
| LAIP | Ley de Acceso a la Información Pública (Decreto 57-2008) |
| RBAC | Role-Based Access Control — control de acceso basado en roles |
| JWT | JSON Web Token — estándar RFC 7519 para autenticación sin estado |
| RF | Requerimiento Funcional |
| RNF | Requerimiento No Funcional |
| RN | Regla de Negocio |
| CA | Criterio de Aceptación |
| CU | Caso de Uso |
| API | Application Programming Interface |
| REST | Representational State Transfer |
| SHA-256 | Secure Hash Algorithm 256-bit — función hash criptográfica |
| TLS | Transport Layer Security — protocolo de cifrado en tránsito |
| APPEND-ONLY | Tabla que solo permite INSERT, no UPDATE ni DELETE |
| DPI | Documento Personal de Identificación (Guatemala) |
| DAFIM | Dirección de Administración Financiera Municipal |
| SECAI | Secretaría Específica de Cumplimiento del Acceso a la Información |
| ISO | International Organization for Standardization |
| FAST | Facilitated Application Specification Techniques |
| DERCAS | Documento de Especificación de Requerimientos, Casos de Uso y Arquitectura |
| RUP | Rational Unified Process |
| SDLC | Software Development Life Cycle |
| BCrypt | Algoritmo de hash de contraseñas con factor de costo configurable |
| tsvector | Tipo de dato PostgreSQL para búsqueda de texto completo |
| tsquery | Tipo de dato PostgreSQL para consultas de texto completo |
| Flyway | Herramienta de migración de esquema de base de datos |
| R2 | Cloudflare R2 Storage — almacenamiento de objetos compatible S3 |
| Railway | Plataforma de despliegue cloud para contenedores |
| Neon | PostgreSQL serverless en la nube |
| Zod | Biblioteca de validación de esquemas TypeScript |
| GIN | Generalized Inverted Index — tipo de índice PostgreSQL para tsvector |
| JaCoCo | Java Code Coverage — herramienta de cobertura para JUnit |
| RTL | React Testing Library |

### 1.4 Referencias Normativas

| Norma/Ley | Título | Aplicación en SGDP |
|-----------|--------|-------------------|
| Decreto 57-2008 | Ley de Acceso a la Información Pública (LAIP) | Marco legal principal: Art. 10 (oficio), Art. 42 (plazos), Art. 26 (denegación) |
| ISO 30300:2020 | Sistemas de gestión para los documentos | Marco conceptual del sistema de gestión documental |
| ISO 30301:2019 | Requisitos del sistema de gestión para los documentos | Requisitos aplicados al diseño del SGDP |
| ISO 30302:2015 | Directrices para la implementación | Guía para el plan de implementación |
| ISO 15489-1:2016 | Gestión de documentos — Conceptos y principios | Metadatos obligatorios (título, categoría, fecha, unidad, nivel acceso) |
| ISO 16175-1:2020 | Principios y requisitos funcionales para registros | Funcionalidades de registro y ciclo de vida documental |
| ISO/IEC 25010:2011 | Modelo de calidad del producto software | Evaluación de calidad en 8 características |
| OWASP Top 10 2021 | Top 10 riesgos de seguridad en aplicaciones web | Controles de seguridad implementados |

---

## 2. Descripción General del Sistema

### 2.1 Perspectiva del Producto

El SGDP es un sistema web desarrollado como proyecto de graduación universitaria con aplicación real en la Municipalidad de San Raymundo, departamento de Guatemala. Surge de la necesidad de dar cumplimiento al Decreto 57-2008 (LAIP), que exige a las entidades públicas guatemaltecas publicar información de oficio, atender solicitudes ciudadanas de información y mantener registros de auditoría.

El sistema se diferencia de soluciones genéricas de gestión documental en que fue diseñado específicamente para la realidad de municipios guatemaltecos de tamaño mediano: incluye los 29 artículos de información de oficio requeridos por LAIP, el cálculo de días hábiles con feriados guatemaltecos (incluyendo Semana Santa mediante el algoritmo de Meeus/Jones/Butcher y el día del patrono San Raymundo el 29 de junio), y los flujos de denegación con artículo legal específico.

### 2.2 Funciones Principales

| CU | Función | Descripción resumida |
|----|---------|----------------------|
| CU 0 | Portal Ciudadano | Navegación pública de documentos y solicitudes sin autenticación |
| CU 1 | Gestión Solicitudes LAIP | Ciclo completo: presentar → responder/denegar/prorrogar → notificar |
| CU 2 | Registro Documental | Upload PDF + metadatos ISO 15489-1 + SHA-256 + R2 |
| CU 3 | Búsqueda y Recuperación | Full-text tsvector/tsquery con filtro RBAC |
| CU 4 | Gestión de Usuarios | CRUD + RBAC + bloqueo + historial contraseñas |
| CU 5 | Información de Oficio | Jerarquía 3 niveles (sección→categoría→carpeta→doc) |
| CU 6 | Auditoría y Trazabilidad | Log APPEND-ONLY automático, consulta y exportación |
| CU 7 | Reportes de Cumplimiento | Dashboard real-time + exportación PDF/CSV (pendiente) |
| CU 8 | Reglas de Negocio | Transversal: aplicación de RN-01 a RN-10 |

### 2.3 Características de los Usuarios

| Rol | Perfil | Nivel técnico | Frecuencia de uso | Módulos de acceso |
|-----|--------|---------------|-------------------|-------------------|
| Ciudadano | Persona natural, vecino del municipio | Básico (navegador web) | Ocasional | Portal público completo |
| Funcionario Municipal | Personal administrativo, DAFIM, secretarías | Intermedio (Excel, Windows) | Diaria | Documentos, búsqueda |
| Oficial de Información | Funcionario designado (Art. 35 LAIP) | Intermedio | Diaria | Solicitudes, oficio, reportes, documentos |
| Administrador del Sistema | IT o Oficial designado como admin | Avanzado | Semanal | Todos los módulos |

### 2.4 Restricciones Generales

1. **Formato documental**: Solo se aceptan archivos PDF o PDF/A (ningún otro formato).
2. **Protocolo de comunicación**: Toda comunicación vía HTTPS; HTTP redirige automáticamente.
3. **Autenticación**: JWT con expiración de 8 horas; sin tokens de larga duración.
4. **Base de datos**: Exclusivamente PostgreSQL 16 (compatibilidad con tsvector/tsquery y GIN).
5. **Almacenamiento**: Cloudflare R2; no se almacenan archivos en el servidor Spring Boot.
6. **Hash**: SHA-256 se calcula siempre en backend; nunca en frontend.
7. **Contraseñas**: BCrypt factor 12 mínimo; nunca se almacenan en texto plano.
8. **Auditoría**: Inmutable (APPEND-ONLY) a nivel de base de datos.

### 2.5 Suposiciones y Dependencias

| Supuesto/Dependencia | Impacto si falla |
|----------------------|------------------|
| Disponibilidad de Neon PostgreSQL (SLA 99.9%) | Sistema no operativo |
| Disponibilidad de Cloudflare R2 | Uploads/downloads de archivos fallan |
| Railway mantiene contenedor Spring Boot activo | API no responde |
| Servidor SMTP de Google/Mailtrap disponible | Notificaciones por email no se envían |
| Cloudflare Pages sirve correctamente el frontend | Portal ciudadano inaccesible |
| Municipalidad mantiene conexión a internet estable | Usuarios internos sin acceso |

---

## 3. Requerimientos Funcionales (RF-01 – RF-18)

### RF-01 — Portal Público con 7 Secciones de Transparencia

| Campo | Detalle |
|-------|---------|
| ID | RF-01 |
| Nombre | Portal Público de Transparencia |
| Caso de uso | CU 0 |
| Prioridad | Alta |
| Descripción | El sistema debe publicar información en 7 secciones de transparencia conforme al Art. 10 del Decreto 57-2008, accesibles sin autenticación desde cualquier navegador moderno. |
| Entrada | Solicitud HTTP GET del ciudadano sin credenciales |
| Proceso | API retorna documentos públicos organizados por sección/categoría/carpeta; frontend React renderiza con componentes específicos por sección |
| Salida | Página web con documentos descargables y navegación por sección |
| Criterio de aceptación | CA-01 |
| Estado | Implementado |

### RF-02 — Formulario Solicitud LAIP y Código EXP-YYYY-NNNN

| Campo | Detalle |
|-------|---------|
| ID | RF-02 |
| Nombre | Presentación de Solicitud de Información Pública |
| Caso de uso | CU 1 |
| Prioridad | Alta |
| Descripción | El ciudadano puede presentar solicitudes de información pública mediante formulario web. El sistema genera código correlativo SOL-YYYY-NNNN único por año, confirma por email (Brevo) y calcula fecha límite de 10 días hábiles. |
| Entrada | Nombre, DPI, correo electrónico, teléfono (opcional), descripción de información solicitada |
| Proceso | Validación Zod frontend + validación Spring backend → INSERT solicitudes_informacion → generarCodigoExpediente() → calcular fecha_limite (DiasHabilesService) → email async vía Brevo |
| Salida | Código SOL-YYYY-NNNN + fecha límite + email de confirmación |
| Criterio de aceptación | CA-02 |
| Estado | Implementado |

### RF-03 — Plazo 10 Días Hábiles y Notificación Interna de Vencimiento Próximo

| Campo | Detalle |
|-------|---------|
| ID | RF-03 |
| Nombre | Control de Plazo LAIP 10 Días Hábiles |
| Caso de uso | CU 1 |
| Prioridad | Alta |
| Descripción | El sistema calcula el plazo de 10 días hábiles excluyendo feriados guatemaltecos (fijos + Semana Santa por algoritmo Meeus + 29-jun San Raymundo). Hay dos mecanismos de aviso independientes cuando quedan ≤ 3 días hábiles: (1) `PlazosScheduler` envía un **email al ciudadano solicitante** (job diario 7:00 AM Guatemala); (2) `NotificacionService` genera una **notificación interna** (campanita, sin correo) visible para Administrador y Oficial. El mismo job diario marca automáticamente VENCIDA la solicitud que supera el plazo sin respuesta — sin bloquear su gestión (ver RN-11). |
| Entrada | Fecha de recepción de la solicitud |
| Proceso | `DiasHabilesService.calcularFechaLimite()` al crear la solicitud → `PlazosScheduler.verificarPlazos()` (`@Scheduled(cron="0 0 13 * * *")`, 13:00 UTC = 7:00 AM Guatemala) recorre solicitudes activas: marca VENCIDA las que ya pasaron su `fecha_limite`, y envía `EmailService.alertaDia7()` al ciudadano cuando `diasHabilesRestantes ≤ 3` → en paralelo, `NotificacionService` calcula en cada consulta (sin scheduler) las mismas condiciones para exponerlas al personal vía `GET /api/admin/notificaciones` |
| Salida | `fecha_limite` en BD; email al ciudadano si quedan ≤ 3 días; notificación en campanita para el personal; estado VENCIDA si se supera el plazo |
| Criterio de aceptación | CA-02 |
| Estado | Implementado |

### RF-04 — Seguimiento por Código Único sin Login

| Campo | Detalle |
|-------|---------|
| ID | RF-04 |
| Nombre | Seguimiento Público de Solicitud |
| Caso de uso | CU 1 |
| Prioridad | Alta |
| Descripción | El ciudadano puede consultar el estado de su solicitud usando únicamente el código SOL-YYYY-NNNN, sin necesidad de crear cuenta ni autenticarse. El nombre del solicitante se muestra enmascarado (privatizeName: "Juan Pérez" → "Juan P."). |
| Entrada | Código SOL-YYYY-NNNN |
| Proceso | GET /api/publico/solicitudes/{codigo}/seguimiento → buscar por codigo_expediente → aplicar privatizeName → retornar estado, fechas, respuesta si disponible |
| Salida | Estado de la solicitud con nombre enmascarado, fechas y respuesta |
| Criterio de aceptación | CA-02 |
| Estado | Implementado |

### RF-05 — Registro Documental con Metadatos ISO 15489-1

| Campo | Detalle |
|-------|---------|
| ID | RF-05 |
| Nombre | Registro y Clasificación Documental |
| Caso de uso | CU 2 |
| Prioridad | Alta |
| Descripción | Administrador y Oficial pueden registrar documentos con metadatos: título, categoría, fecha de emisión, unidad de origen, nivel de acceso (PÚBLICO/INTERNO) y descripción opcional. Funcionario tiene acceso de solo consulta a este módulo. |
| Entrada | Archivo PDF + metadatos (multipart/form-data) |
| Proceso | Validar PDF → calcular SHA-256 → subir R2 → generar DOC-YYYY-NNNN → INSERT documentos → INSERT registro_auditoria |
| Salida | Documento registrado con código DOC-YYYY-NNNN, visible en panel admin |
| Criterio de aceptación | CA-03 |
| Estado | Implementado |

### RF-06 — SHA-256 en Upload y Verificación en Descarga

| Campo | Detalle |
|-------|---------|
| ID | RF-06 |
| Nombre | Integridad Documental SHA-256 |
| Caso de uso | CU 2, CU 3 |
| Prioridad | Alta |
| Descripción | El hash SHA-256 de cada documento es calculado en el backend al momento de carga (NUNCA en frontend) y almacenado en BD. En cada descarga se recalcula el hash del stream R2 y se compara contra el almacenado, garantizando integridad. |
| Entrada | Stream de bytes del archivo PDF |
| Proceso | `HashService`/cálculo SHA-256 sobre el `byte[]` del archivo al registrar → almacenar en `documentos.hash_sha256` / En descarga: `DocumentoService.descargarConVerificacion()` recalcula el hash del stream de R2 y lo compara contra el almacenado |
| Salida | Hash almacenado en BD; error de integridad si el hash no coincide en descarga |
| Criterio de aceptación | CA-03 |
| Estado | Implementado |

### RF-07 — Ciclo de Vida Documental

| Campo | Detalle |
|-------|---------|
| ID | RF-07 |
| Nombre | Estados del Ciclo de Vida Documental |
| Caso de uso | CU 2 |
| Prioridad | Media |
| Descripción | Cada documento tiene un campo `estado` de texto simple con los valores VIGENTE, OBSOLETO, BORRADOR o ARCHIVADO (no es una máquina de estados con transiciones forzadas). Las versiones anteriores se mantienen en la tabla `versiones_documento` para trazabilidad, junto con su propio hash SHA-256. |
| Entrada | Acción del usuario (cambiar estado, cargar nueva versión) |
| Proceso | `UPDATE documentos SET estado = ?` + `INSERT INTO versiones_documento` al registrar una nueva versión (incrementa `version_actual`) |
| Salida | Estado actualizado; versión anterior preservada con su hash |
| Criterio de aceptación | CA-03 |
| Estado | Implementado |

### RF-08 — Búsqueda por Coincidencia con Filtro RBAC

| Campo | Detalle |
|-------|---------|
| ID | RF-08 |
| Nombre | Búsqueda y Recuperación con Control de Acceso |
| Caso de uso | CU 3 |
| Prioridad | Alta |
| Descripción | Búsqueda por coincidencia de subcadena (no tokenizada) sobre título, descripción, código, nombre de archivo y unidad de origen, usando JPA Specifications (`LIKE '%palabra%'` con AND entre palabras, OR entre campos) — así "presu" encuentra "Presupuesto" y "2024" encuentra "DOC-2024-001". El nivel de acceso solo tiene 2 valores: PÚBLICO (visible sin autenticación en el Portal Ciudadano) e INTERNO (solo personal autenticado, cualquier rol). |
| Entrada | Término de búsqueda, filtros opcionales de categoría/nivel de acceso/estado |
| Proceso | `DocumentoSpecifications.texto(q)` + `nivelAcceso(...)` + `estado(...)` + `categoriaId(...)` combinadas con `Specification.and(...)` sobre `DocumentoRepository` |
| Salida | Lista paginada de documentos que contienen el término buscado |
| Criterio de aceptación | CA-04 |
| Estado | Implementado |

### RF-09 — Correlativo DOC-YYYY-NNNN

| Campo | Detalle |
|-------|---------|
| ID | RF-09 |
| Nombre | Código Correlativo de Documentos |
| Caso de uso | CU 2 |
| Prioridad | Media |
| Descripción | Cada documento registrado recibe un código único DOC-YYYY-NNNN donde YYYY es el año y NNNN es secuencial reiniciado anualmente. Concurrencia manejada con locking en tabla secuencias_codigo. |
| Entrada | Tipo = "DOC", año = YYYY |
| Proceso | SELECT ... FOR UPDATE en secuencias_codigo → incrementar → retornar código formateado |
| Salida | Código DOC-2026-0001 (ejemplo) asignado al documento |
| Criterio de aceptación | CA-03 |
| Estado | Implementado |

### RF-10 — RBAC con 3 Roles

| Campo | Detalle |
|-------|---------|
| ID | RF-10 |
| Nombre | Control de Acceso Basado en Roles |
| Caso de uso | CU 4 |
| Prioridad | Alta |
| Descripción | El sistema implementa RBAC con 3 roles internos (ADMINISTRADOR, OFICIAL, FUNCIONARIO) y el actor externo Ciudadano (sin auth). Cada endpoint verifica el rol mediante @PreAuthorize y JwtFilter. No se permite creación de cuentas públicas. |
| Entrada | Token JWT con claim de rol |
| Proceso | JwtFilter → SecurityContext → @PreAuthorize("hasRole('ADMINISTRADOR')") en controllers |
| Salida | Acceso concedido o HTTP 403 |
| Criterio de aceptación | CA-05 |
| Estado | Implementado |

### RF-11 — Bloqueo 3 Intentos + Historial Contraseñas

| Campo | Detalle |
|-------|---------|
| ID | RF-11 |
| Nombre | Seguridad de Autenticación |
| Caso de uso | CU 4 |
| Prioridad | Alta |
| Descripción | Bloqueo automático de cuenta tras 3 intentos fallidos consecutivos por 15 minutos. Historial de las últimas 3 contraseñas para evitar reutilización. BCrypt factor 12 para almacenamiento. El Administrador puede desbloquear manualmente una cuenta antes de que expire el tiempo de espera desde el módulo de Usuarios. |
| Entrada | Credenciales de login / nueva contraseña / acción de desbloqueo del Administrador |
| Proceso | `intentos_fallidos++` en transacción independiente (`REQUIRES_NEW`, para que persista aunque el login falle y haga rollback) → si ≥ 3: `bloqueado_hasta = now(UTC)+15min`, `intentos_fallidos = 0` / Al cambiar contraseña: comparar contra `historial_contrasenas` últimas 3 / Desbloqueo manual: `PUT /api/usuarios/{id}/desbloquear`, solo válido si `bloqueado_hasta` sigue vigente |
| Salida | HTTP 400 (NegocioException) si la cuenta está bloqueada, con el mensaje convertido a hora de Guatemala; HTTP 400 si la contraseña está en el historial |
| Criterio de aceptación | CA-05 |
| Estado | Implementado |

### RF-12 — Cambio Forzado Contraseña Primer Login

| Campo | Detalle |
|-------|---------|
| ID | RF-12 |
| Nombre | Cambio Obligatorio de Contraseña Inicial |
| Caso de uso | CU 4 |
| Prioridad | Alta |
| Descripción | Los usuarios nuevos o con contraseña restablecida tienen el flag cambio_contrasena_requerido=true. El JWT incluye claim requirePasswordChange=true. El frontend detecta este claim y redirige a pantalla de cambio antes de permitir cualquier otra operación. |
| Entrada | JWT con requirePasswordChange=true |
| Proceso | POST /api/auth/cambiar-contrasena → validar nueva contraseña → BCrypt → INSERT historial → UPDATE cambio_contrasena_requerido=false |
| Salida | Nueva contraseña activa; acceso completo al sistema |
| Criterio de aceptación | CA-05 |
| Estado | Implementado |

### RF-13 — 7 Secciones de Oficio con Jerarquía 3 Niveles

| Campo | Detalle |
|-------|---------|
| ID | RF-13 |
| Nombre | Publicación de Información de Oficio |
| Caso de uso | CU 5 |
| Prioridad | Alta |
| Descripción | El sistema organiza la información de oficio (Art. 10 LAIP) en jerarquía de 3 niveles bajo la sección: Sección (7 tipos fijos: LAIP, COMUDE, PRESUPUESTARIA, SINACIG, RENDICION_CUENTAS, DECRETO_101_97, DECRETO_36_2024) → Categoría → Carpeta → Documentos PDF. La sección LAIP tiene exactamente **29 categorías** fijas, numeradas 1–29 conforme al Art. 10 del Decreto 57-2008; las demás secciones tienen categorías configurables por el Administrador/Oficial. |
| Entrada | CRUD por Oficial/Administrador en panel admin |
| Proceso | POST /api/admin/oficio/categorias → /carpetas → /carpetas/{id}/documentos |
| Salida | Contenido publicado en portal ciudadano /informacion-publica |
| Criterio de aceptación | CA-01 |
| Estado | Implementado |

### RF-14 — Alerta 25 Días sin Actualizar Oficio

| Campo | Detalle |
|-------|---------|
| ID | RF-14 |
| Nombre | Alerta de Contenido de Oficio Desactualizado |
| Caso de uso | CU 5 |
| Prioridad | Media |
| Descripción | El sistema detecta carpetas de información de oficio que no han recibido nuevos documentos en 25 días o más. Se muestra en dos lugares: una alerta expandible en el Dashboard (con el listado de carpetas) y una notificación en la campanita (tipo `OFICIO_DESACTUALIZADO`), visible para Administrador y Oficial. No se envía correo por este motivo. |
| Entrada | Fecha de última publicación por carpeta |
| Proceso | `CarpetaOficioRepository.findCarpetasDesactualizadas()` (umbral 25 días) → consumido por `DashboardController` (alerta) y `NotificacionService` (campanita) |
| Salida | Alerta visual en el Dashboard con lista de carpetas; notificación en campanita |
| Criterio de aceptación | CA-01 |
| Estado | Implementado |

### RF-15 — Log Auditoría con Campos Completos

| Campo | Detalle |
|-------|---------|
| ID | RF-15 |
| Nombre | Registro de Auditoría Completo |
| Caso de uso | CU 6 |
| Prioridad | Alta |
| Descripción | Toda operación significativa del sistema genera automáticamente un registro en registro_auditoria con: timestamp UTC, usuario_id (del SecurityContext), tipo_accion, tabla_afectada, registro_id, ip_origen, resultado y descripción. |
| Entrada | Ejecución de cualquier operación CRUD o de negocio |
| Proceso | AuditoriaService.registrarExito/registrarDenegado/registrarError → INSERT registro_auditoria |
| Salida | Registro inmutable en tabla registro_auditoria |
| Criterio de aceptación | CA-06 |
| Estado | Implementado |

### RF-16 — Log APPEND-ONLY a Nivel de Base de Datos

| Campo | Detalle |
|-------|---------|
| ID | RF-16 |
| Nombre | Inmutabilidad del Log de Auditoría |
| Caso de uso | CU 6 |
| Prioridad | Alta |
| Descripción | El log de auditoría es inmutable a nivel de base de datos mediante REVOKE de permisos UPDATE y DELETE al usuario sgdp_app. Solo el superusuario de PostgreSQL puede modificar estos registros. |
| Entrada | Migración Flyway V4 aplicada al crear la BD |
| Proceso | REVOKE UPDATE, DELETE ON registro_auditoria FROM sgdp_app (ejecutado en migración) |
| Salida | Error de BD si se intenta UPDATE o DELETE en registro_auditoria |
| Criterio de aceptación | CA-06 |
| Estado | Implementado |

### RF-17 — Reportes LAIP Exportables PDF + CSV

| Campo | Detalle |
|-------|---------|
| ID | RF-17 |
| Nombre | Exportación de Reportes de Cumplimiento |
| Caso de uso | CU 7 |
| Prioridad | Alta |
| Descripción | El Oficial y Administrador pueden exportar tres reportes en formato PDF (iText) y CSV (OpenCSV): Solicitudes de Información, Repositorio Documental (incluye hashes SHA-256) y Registro de Auditoría (exclusivo Administrador). |
| Entrada | Selección de reporte y formato (PDF/CSV) desde el módulo Reportes |
| Proceso | `ReporteAdminController` → `reportesService` genera el archivo con iText/OpenCSV → descarga directa desde el navegador |
| Salida | Archivo PDF o CSV descargado |
| Criterio de aceptación | CA-07 |
| Estado | Implementado |

### RF-18 — Dashboard de Cumplimiento en Tiempo Real

| Campo | Detalle |
|-------|---------|
| ID | RF-18 |
| Nombre | Dashboard de Métricas en Tiempo Real |
| Caso de uso | CU 7 |
| Prioridad | Media |
| Descripción | Dashboard para Oficial y Administrador con métricas: solicitudes por estado, promedio de días de respuesta, % cumplimiento en plazo (10 días hábiles), documentos por categoría y metas de cumplimiento por módulo configurables. |
| Entrada | Solicitud GET autenticada al dashboard endpoint |
| Proceso | GET /api/admin/dashboard/stats → queries agregadas sobre solicitudes_informacion + documentos / GET /api/admin/dashboard/metas → tabla metas_cumplimiento |
| Salida | JSON con métricas actualizadas; UI con gráficos React |
| Criterio de aceptación | CA-07 |
| Estado | Implementado |

---

## 4. Requerimientos No Funcionales (RNF-01 – RNF-07)

### RNF-01 — Rendimiento

| Campo | Detalle |
|-------|---------|
| ID | RNF-01 |
| Nombre | Tiempo de Respuesta de Búsquedas |
| Prioridad | Alta |
| Descripción | El 95% de las búsquedas documentales deben completarse en menos de 3 segundos con un repositorio de hasta 10,000 documentos bajo carga normal (20 usuarios concurrentes). |
| Métrica | P95 < 3 segundos en búsqueda full-text con 10,000 documentos |
| Implementación | Índice GIN: `CREATE INDEX idx_documentos_fts ON documentos USING GIN (to_tsvector('spanish', titulo || ' ' || COALESCE(descripcion, '')))` |
| Estado | Implementado |

### RNF-02 — Disponibilidad

| Campo | Detalle |
|-------|---------|
| ID | RNF-02 |
| Nombre | Disponibilidad y Recuperación |
| Prioridad | Alta |
| Descripción | El sistema debe estar disponible el 99% del tiempo mensual (máximo 7.3 horas de inactividad). Copias de seguridad automáticas diarias de la base de datos. |
| Métrica | 99% uptime mensual; RTO < 4 horas; RPO < 24 horas |
| Implementación | Neon PostgreSQL (managed, backups automáticos diarios); Railway (auto-restart en crash); Cloudflare (anycast global) |
| Estado | Implementado (dependiente de SLA de providers) |

### RNF-03 — Seguridad

| Campo | Detalle |
|-------|---------|
| ID | RNF-03 |
| Nombre | Seguridad en Tránsito y en Reposo |
| Prioridad | Alta |
| Descripción | Toda comunicación debe usar TLS 1.3 mínimo. Documentos cifrados en reposo con AES-256 (R2). Contraseñas con BCrypt factor 12. JWT con expiración de 8 horas. |
| Métrica | Zero HIGH alerts en OWASP ZAP scan; TLS 1.3 forzado |
| Implementación | Cloudflare WAF + TLS 1.3; Cloudflare R2 (AES-256 at rest); BCryptPasswordEncoder(12); JWT 8h |
| Estado | Implementado |

### RNF-04 — Usabilidad

| Campo | Detalle |
|-------|---------|
| ID | RNF-04 |
| Nombre | Facilidad de Uso |
| Prioridad | Media |
| Descripción | Un funcionario municipal sin formación técnica especializada debe poder registrar un documento completo en menos de 3 minutos. El portal ciudadano debe ser navegable por usuarios con conocimiento básico de internet. |
| Métrica | Registro documental < 3 minutos en prueba de usuario con personal municipal |
| Implementación | React 18 + Tailwind CSS; formularios con validación en tiempo real (Zod); mensajes de error descriptivos en español |
| Estado | Implementado (prueba de usuario pendiente con Municipalidad) |

### RNF-05 — Compatibilidad

| Campo | Detalle |
|-------|---------|
| ID | RNF-05 |
| Nombre | Compatibilidad de Navegadores |
| Prioridad | Media |
| Descripción | El sistema debe funcionar correctamente en las versiones actualizadas de Chrome, Firefox, Edge y Safari, en escritorio y dispositivos móviles (diseño responsive). |
| Métrica | Funcionalidad completa en Chrome 120+, Firefox 121+, Edge 120+, Safari 17+ |
| Implementación | React 18 + Vite; Tailwind CSS responsive (mobile-first); sin dependencias de Flash o plugins |
| Estado | Implementado |

### RNF-06 — Cobertura de Pruebas

| Campo | Detalle |
|-------|---------|
| ID | RNF-06 |
| Nombre | Cobertura Mínima de Pruebas Automatizadas |
| Prioridad | Alta |
| Descripción | El sistema debe mantener cobertura de pruebas automatizadas ≥ 45% en backend (JaCoCo) y ≥ 50% en frontend (Jest). El pipeline CI/CD bloquea despliegue si no se cumple. El umbral se ajustó de un objetivo inicial de 70% a estos valores tras medir variación real entre entorno local y CI. |
| Métrica | Backend: JaCoCo ≥ 45% líneas; Frontend: Jest coverage ≥ 50% |
| Implementación | 155 pruebas JUnit 5 + Mockito (backend); 164 pruebas Jest + RTL en 27 suites (frontend); JaCoCo `check` ligado a la fase `verify` de Maven; GitHub Actions bloquea el deploy si falla |
| Estado | Implementado (backend 155/155 ✅; frontend 164/164 ✅) |

### RNF-07 — Escalabilidad y Arquitectura REST

| Campo | Detalle |
|-------|---------|
| ID | RNF-07 |
| Nombre | API REST sin Estado y Escalabilidad |
| Prioridad | Media |
| Descripción | La API backend debe ser completamente sin estado (stateless): sin sesiones de servidor, toda la autenticación via JWT. Debe soportar escalado vertical en Railway sin cambios de código. |
| Métrica | Sin sesiones HTTP en servidor; JWT auto-suficiente; horizontal scaling posible |
| Implementación | Spring Security 6 stateless; SessionCreationPolicy.STATELESS; JWT validado en cada request por JwtFilter |
| Estado | Implementado |

---

## 5. Reglas de Negocio (RN-01 – RN-12)

| ID | Módulo | Descripción | Implementación técnica | Estado |
|----|--------|-------------|------------------------|--------|
| RN-01 | Solicitudes LAIP | Plazo máximo de 10 días hábiles (Art. 42 Decreto 57-2008) para responder. Job diario (7 AM Guatemala) envía email al ciudadano y marca VENCIDA cuando corresponde; en paralelo, notificación interna (campanita) para el personal cuando quedan ≤ 3 días hábiles. VENCIDA no bloquea la gestión (ver RN-11/RN-12). | `DiasHabilesService.calcularFechaLimite()` (feriados GT fijos + Semana Santa Meeus + 29-jun) + `PlazosScheduler @Scheduled` + `NotificacionService` | Implementado |
| RN-02 | Solicitudes LAIP | Toda denegación de solicitud debe especificar una causal (no necesariamente un número de artículo formal). | `SolicitudService.denegar()`: campo `causalDenegacion`, mínimo 10 caracteres; HTTP 400 si se omite o es muy corta | Implementado |
| RN-03 | Documentos / Oficio | El sistema acepta únicamente archivos en formato PDF. Ningún otro formato es admitido. | Backend: `FileValidatorService` valida encabezado PDF; Frontend: validación de tipo de archivo | Implementado |
| RN-04 | Documentos | Documentos clasificados en 2 niveles de acceso: PÚBLICO (visible sin autenticación en el Portal Ciudadano) e INTERNO (solo personal autenticado, cualquier rol). | Enum `NivelAcceso` (`PUBLICO`, `INTERNO`); filtro en `DocumentoSpecifications.nivelAcceso()` | Implementado |
| RN-05 | Documentos | Metadatos obligatorios: título, categoría, fecha de emisión, unidad de origen y nivel de acceso. Ninguno de estos campos puede estar vacío. | DTOs con validación Jakarta Bean Validation + `@Valid` en el controller | Implementado |
| RN-06 | Documentos / Solicitudes | Códigos correlativos únicos por año: DOC-YYYY-NNNN para documentos y SOL-YYYY-NNNN para solicitudes. El contador reinicia cada 1° de enero. | Tabla `secuencias_codigo` (PK = `tipo`, campos `prefijo`, `ultimo_num`, `anio`) | Implementado |
| RN-07 | Auditoría | El log de auditoría es APPEND-ONLY: ningún usuario de la aplicación puede modificar o eliminar registros. Solo ADMINISTRADOR puede consultarlo. | `REVOKE UPDATE, DELETE ON registro_auditoria FROM sgdp_app`; `@PreAuthorize("hasRole('ADMINISTRADOR')")` en AuditoriaController | Implementado |
| RN-08 | Usuarios | Contraseñas almacenadas con BCrypt. Historial de las últimas 3 contraseñas impide reutilización. Bloqueo automático tras 3 intentos fallidos consecutivos por 15 minutos, calculado y comparado siempre en UTC explícito (independiente de la zona horaria del servidor); el mensaje mostrado al usuario se convierte a hora de Guatemala. El Administrador puede desbloquear manualmente antes de que expire el tiempo. | `BCryptPasswordEncoder`; tabla `historial_contrasenas`; campos `intentos_fallidos`, `bloqueado_hasta` en `usuarios`; `UsuarioService.registrarIntentoFallido()` en transacción `REQUIRES_NEW`; `PUT /api/usuarios/{id}/desbloquear` | Implementado |
| RN-09 | Usuarios | Usuarios nuevos o con contraseña restablecida deben cambiar su contraseña en el primer acceso antes de poder operar el sistema. | Campo `requiere_cambio_contrasena` en `usuarios`; el frontend redirige a `/admin/cambiar-contrasena` tras el login | Implementado |
| RN-10 | Documentos | El hash SHA-256 de cada documento se calcula en el backend al momento de la carga (nunca en el frontend). Se verifica en cada descarga comparando contra el hash almacenado. | Cálculo SHA-256 en `DocumentoService.registrar()`; verificación en `DocumentoService.descargarConVerificacion()` | Implementado |
| RN-11 | Solicitudes LAIP | El rol ADMINISTRADOR solo puede ver el listado y asignar un oficial responsable — no responde, prorroga ni deniega directamente. Solo el Oficial asignado a una solicitud específica puede responder, prorrogar o denegarla. Un Oficial puede autoasignarse una solicitud sin oficial asignado; solo el Administrador puede asignar a cualquier otro oficial. | `SolicitudesPage.tsx`: `puedeActuar(s) = !isAdmin && esOficialAsignado(s)`; `AsignarModal` con `soloAutoAsignar={isOficial}` | Implementado |
| RN-12 | Solicitudes LAIP | El estado VENCIDA no es un estado terminal: una solicitud vencida conserva exactamente las mismas acciones disponibles que una activa (asignar si no tiene oficial, responder, prorrogar, denegar por el oficial asignado). Solo cambia la etiqueta de estado visible. | `SolicitudService`: `VENCIDA` incluida como estado de origen válido en `asignarOficial()`, `responder()`, `prorrogar()` y `denegar()` | Implementado |

---

## 6. Arquitectura del Sistema

### 6.1 Arquitectura de 3 Capas

**Capa de Presentación** (Railway):
- React 18 con TypeScript 5 y Vite 5
- Tailwind CSS 3.4 para estilos
- TanStack Query v5 para manejo de estado servidor
- React Hook Form + Zod para formularios y validación
- React Router DOM v6 para enrutamiento
- Lucide React para iconografía
- Dos interfaces: portal público (`/`) y panel admin (`/admin/*`)

**Capa de Negocio** (Railway — Spring Boot):
- Java 17 LTS con Spring Boot 3.3.4
- Spring Security 6.x con JWT (jjwt 0.12.6)
- Spring Data JPA 3.x con Hibernate 6
- Spring Web MVC (REST controllers)
- Flyway para migraciones de base de datos
- Jakarta Bean Validation para validación de DTOs
- AWS SDK v2 para Cloudflare R2 (S3-compatible)
- Brevo (API HTTP) para envío de correo transaccional — no usa Spring Mail/SMTP

**Capa de Datos** (Neon — PostgreSQL 16):
- PostgreSQL 16 serverless (Neon)
- Búsqueda por coincidencia de subcadena vía JPA Specifications (no full-text tsvector)
- Cloudflare R2 para almacenamiento de archivos PDF
- HikariCP como pool de conexiones

### 6.2 Tabla de Tecnologías

| Capa | Tecnología | Versión | Justificación |
|------|-----------|---------|---------------|
| Frontend | React | 18.3 | Ecosistema maduro; componentes declarativos; SSR no requerido |
| Frontend | TypeScript | 5.x | Type safety; mejor DX; errores en tiempo de compilación |
| Frontend | Vite | 5.x | Build rápido; HMR nativo; soporte TypeScript nativo |
| Frontend | Tailwind CSS | 3.4 | Utility-first; responsive fácil; sin CSS global |
| Frontend | TanStack Query | 5.x | Caché, invalidación, loading states automáticos |
| Frontend | Zod | 3.x | Validación schema TypeScript-first |
| Backend | Java | 17 LTS | LTS hasta 2029; records; sealed classes |
| Backend | Spring Boot | 3.3.4 | Autoconfiguración; ecosystem; Spring Security 6 |
| Backend | Spring Security | 6.x | JWT stateless; @PreAuthorize; sin sesiones |
| Backend | PostgreSQL | 16 | JSONB (detalle de auditoría); transacciones ACID |
| Backend | Flyway | — | Migraciones versionadas; auditable; reproducible |
| Infraestructura | Railway | Cloud | Deploy desde GitHub de backend y frontend; env vars; auto-restart |
| Infraestructura | Neon | Serverless PostgreSQL | Branching; scale-to-zero; backups automáticos |
| Infraestructura | Cloudflare R2 | S3-compatible | Sin egress fees; almacenamiento de PDFs |
| Infraestructura | Brevo | Email transaccional | Confirmación de solicitud LAIP, notificación de respuesta/denegación (vía API HTTP) |
| CI/CD | GitHub Actions | N/A | Pipelines YAML; `mvn verify` + `npm test` en cada push; bloquea deploy si falla |

### 6.3 Endpoints API Principales

| Método | Ruta | Rol mínimo | Descripción |
|--------|------|-----------|-------------|
| POST | /api/auth/login | Público | Autenticación y obtención de JWT |
| POST | /api/auth/cambiar-contrasena | Autenticado | Cambio de contraseña (forzado o voluntario) |
| POST | /api/publico/solicitudes | Público | Presentar solicitud de información LAIP |
| GET | /api/publico/solicitudes/{codigo}/seguimiento | Público | Seguimiento por código SOL-YYYY-NNNN |
| GET | /api/publico/oficio/v2/categorias | Público | Listar secciones y categorías de oficio |
| GET | /api/publico/oficio/v2/carpetas | Público | Listar carpetas de una categoría |
| GET | /api/publico/oficio/documentos/{id}/descargar | Público | Descargar documento de oficio público |
| GET | /api/publico/documentos/buscar | Público | Búsqueda (por coincidencia) de documentos públicos |
| GET | /api/solicitudes | ADMINISTRADOR, OFICIAL | Listar solicitudes con filtros (FUNCIONARIO no tiene acceso) |
| GET | /api/solicitudes/{id} | ADMINISTRADOR, OFICIAL | Detalle de solicitud |
| GET | /api/solicitudes/oficiales | ADMINISTRADOR, OFICIAL | Listar oficiales disponibles para asignar |
| PUT | /api/solicitudes/{id}/asignar | ADMINISTRADOR, OFICIAL | Asignar oficial (Oficial solo puede autoasignarse) |
| PUT | /api/solicitudes/{id}/responder | OFICIAL asignado | Responder solicitud LAIP |
| PUT | /api/solicitudes/{id}/denegar | OFICIAL asignado | Denegar con causal |
| PUT | /api/solicitudes/{id}/prorrogar | OFICIAL asignado | Prorrogar plazo +10 días hábiles |
| GET | /api/admin/notificaciones | ADMINISTRADOR, OFICIAL | Notificaciones internas: por vencer, vencidas, oficio desactualizado |
| GET | /api/documentos | Todos los roles | Listar documentos del repositorio (FUNCIONARIO solo consulta) |
| POST | /api/documentos | ADMINISTRADOR, OFICIAL | Registrar nuevo documento (multipart) |
| GET | /api/documentos/{id} | Todos los roles | Detalle de documento |
| GET | /api/documentos/{id}/descargar | Todos los roles | Descargar documento con verificación de hash |
| POST | /api/documentos/{id}/nueva-version | ADMINISTRADOR, OFICIAL | Cargar nueva versión (multipart) |
| GET | /api/documentos/{id}/versiones | Todos los roles | Historial de versiones |
| GET | /api/admin/oficio/categorias | Todos los roles | Listar categorías de oficio (FUNCIONARIO solo consulta) |
| POST | /api/admin/oficio/categorias | ADMINISTRADOR, OFICIAL | Crear categoría de oficio |
| POST | /api/admin/oficio/carpetas | ADMINISTRADOR, OFICIAL | Crear carpeta en categoría |
| POST | /api/admin/oficio/carpetas/{id}/documentos | ADMINISTRADOR, OFICIAL | Subir documento a carpeta |
| GET | /api/usuarios | ADMINISTRADOR | Listar usuarios del sistema |
| POST | /api/usuarios | ADMINISTRADOR | Crear nuevo usuario |
| PUT | /api/usuarios/{id} | ADMINISTRADOR | Actualizar datos de usuario |
| PUT | /api/usuarios/{id}/toggle-activo | ADMINISTRADOR | Activar/desactivar usuario |
| PUT | /api/usuarios/{id}/reset-password | ADMINISTRADOR | Restablecer contraseña temporal |
| PUT | /api/usuarios/{id}/desbloquear | ADMINISTRADOR | Desbloquear cuenta bloqueada por intentos fallidos |
| GET | /api/admin/auditoria | ADMINISTRADOR | Consultar log de auditoría con filtros |
| GET | /api/admin/dashboard/stats | ADMINISTRADOR, OFICIAL, FUNCIONARIO | Estadísticas de cumplimiento |
| GET | /api/admin/dashboard/metas | ADMINISTRADOR, OFICIAL, FUNCIONARIO | Metas por módulo |
| POST | /api/admin/dashboard/metas/{modulo} | ADMINISTRADOR | Actualizar meta de módulo |
| GET | /api/admin/reportes/{tipo}/csv \| /pdf | ADMINISTRADOR, OFICIAL | Exportar solicitudes/documentos (auditoría solo ADMINISTRADOR) |

### 6.4 Estrategia de Almacenamiento en R2

Los archivos PDF se almacenan en Cloudflare R2 con las siguientes claves:

| Tipo de documento | Clave R2 | Ejemplo |
|-------------------|----------|---------|
| Documentos del repositorio | `documentos/{uuid}.pdf` | `documentos/3f7a2b1c-...pdf` |
| Documentos de oficio | `oficio/{seccion}/{uuid}.pdf` | `oficio/LAIP/8e9f...pdf` |

La URL de acceso nunca es pública directamente desde R2. El backend Spring Boot actúa como proxy, verificando autorización antes de retornar el stream.

---

## 7. Diccionario de Datos

### Tabla: usuarios

| Campo | Tipo | Longitud | Restricción | Descripción |
|-------|------|----------|-------------|-------------|
| id | BIGINT (IDENTITY) | — | PK NOT NULL | Identificador único autoincremental |
| nombre_completo | VARCHAR | 200 | NOT NULL | Nombre y apellidos del funcionario |
| dpi | VARCHAR | 15 | UNIQUE | DPI del funcionario (opcional) |
| nombre_usuario | VARCHAR | 50 | UNIQUE NOT NULL | Usuario de login (no es el correo) |
| correo_electronico | VARCHAR | 200 | UNIQUE | Correo institucional (opcional) |
| contrasena_hash | VARCHAR | 255 | NOT NULL | Hash BCrypt del password |
| rol | VARCHAR | 30 | NOT NULL CHECK(ENUM) | ADMINISTRADOR / OFICIAL / FUNCIONARIO |
| unidad_municipal | VARCHAR | 150 | NULLABLE | Dependencia municipal a la que pertenece |
| activo | BOOLEAN | — | NOT NULL DEFAULT true | Si el usuario puede ingresar |
| requiere_cambio_contrasena | BOOLEAN | — | NOT NULL DEFAULT false | Flag primer login / reset por Administrador |
| intentos_fallidos | INTEGER | — | NOT NULL DEFAULT 0 | Contador de fallos consecutivos (persiste en transacción independiente) |
| bloqueado_hasta | TIMESTAMP | — | NULLABLE | Instante UTC hasta el cual la cuenta está bloqueada; `NULL` o en el pasado = no bloqueada |
| ultimo_acceso | TIMESTAMP | — | NULLABLE | Timestamp del último login exitoso |
| created_at | TIMESTAMP | — | NOT NULL | Fecha de creación del registro |
| updated_at | TIMESTAMP | — | NOT NULL | Fecha de última modificación |

### Tabla: documentos

| Campo | Tipo | Longitud | Restricción | Descripción |
|-------|------|----------|-------------|-------------|
| id | BIGINT (IDENTITY) | — | PK NOT NULL | Identificador único |
| codigo | VARCHAR | — | UNIQUE NOT NULL | DOC-YYYY-NNNN |
| titulo | VARCHAR | 500 | NOT NULL | Título descriptivo del documento |
| descripcion | TEXT | — | NULLABLE | Descripción extendida |
| categoria_id | BIGINT | — | FK categorias_documento NOT NULL | Categoría documental |
| fecha_emision | DATE | — | NOT NULL | Fecha oficial de emisión |
| unidad_origen | VARCHAR | — | NOT NULL | Dependencia municipal que emitió |
| nivel_acceso | VARCHAR | 20 | NOT NULL CHECK(ENUM) | PUBLICO / INTERNO (solo 2 valores) |
| estado | VARCHAR | — | NOT NULL | VIGENTE / OBSOLETO / BORRADOR / ARCHIVADO (texto simple, no máquina de estados) |
| r2_key | VARCHAR | — | NOT NULL | Clave en Cloudflare R2 |
| nombre_archivo | VARCHAR | — | NOT NULL | Nombre original del archivo subido |
| tamano_bytes | BIGINT | — | NOT NULL | Tamaño del archivo en bytes |
| hash_sha256 | VARCHAR | — | NOT NULL | Hash SHA-256 del archivo PDF |
| version_actual | INTEGER | — | NOT NULL | Número de la versión vigente |
| registrado_por | BIGINT | — | FK usuarios | Usuario que registró el documento |
| search_vector | — | — | Columna generada, no mapeada en JPA | Usada solo a nivel de BD, no consultada desde el backend |
| created_at | TIMESTAMP | — | NOT NULL | Fecha de registro |
| updated_at | TIMESTAMP | — | NOT NULL | Fecha de última modificación |

### Tabla: solicitudes_informacion

| Campo | Tipo | Longitud | Restricción | Descripción |
|-------|------|----------|-------------|-------------|
| id | BIGINT (IDENTITY) | — | PK NOT NULL | Identificador único |
| codigo_expediente | VARCHAR | — | UNIQUE NOT NULL | SOL-YYYY-NNNN |
| nombre_solicitante | VARCHAR | — | NOT NULL | Nombre del ciudadano |
| dpi_solicitante | VARCHAR | — | NOT NULL | DPI del ciudadano (13 dígitos) |
| correo_solicitante | VARCHAR | — | NOT NULL | Email para notificaciones |
| telefono_solicitante | VARCHAR | — | NULLABLE | Teléfono opcional (8 dígitos) |
| descripcion_solicitud | TEXT | — | NOT NULL | Información solicitada (20–2000 caracteres) |
| estado | VARCHAR | — | NOT NULL DEFAULT 'PENDIENTE' | PENDIENTE / EN_PROCESO / PRORROGADA / RESPONDIDA / DENEGADA / VENCIDA |
| fecha_recepcion | DATE | — | NOT NULL | Cuándo se presentó |
| fecha_limite | DATE | — | NOT NULL | 10 días hábiles desde recepción |
| oficial_asignado | BIGINT | — | FK usuarios NULLABLE | Oficial responsable |
| fecha_prorroga | DATE | — | NULLABLE | Nueva fecha límite si se prorrogó (+10 días hábiles) |
| motivo_prorroga | TEXT | — | NULLABLE | Justificación de prórroga (mínimo 10 caracteres) |
| respuesta | TEXT | — | NULLABLE | Texto de la respuesta (mínimo 20 caracteres) |
| fecha_respuesta | TIMESTAMP | — | NULLABLE | Cuándo se respondió/denegó |
| causal_denegacion | TEXT | — | NULLABLE | Motivo de denegación (mínimo 10 caracteres) |
| documento_respuesta_id | BIGINT | — | FK documentos NULLABLE | Documento adjunto a la respuesta |
| created_at / updated_at | TIMESTAMP | — | NOT NULL | Trazabilidad del registro |

### Tabla: categorias_documento

| Campo | Tipo | Longitud | Restricción | Descripción |
|-------|------|----------|-------------|-------------|
| id | BIGINT (IDENTITY) | — | PK NOT NULL | Identificador único |
| nombre | VARCHAR | — | NOT NULL | Nombre de la categoría |
| descripcion | TEXT | — | NULLABLE | Descripción de la categoría |
| es_laip | BOOLEAN | — | NOT NULL | Si la categoría corresponde a información LAIP |
| activa | BOOLEAN | — | NOT NULL DEFAULT true | Si está activa para uso |
| created_at | TIMESTAMP | — | NOT NULL | Fecha de creación |

### Tabla: categoria_oficio

| Campo | Tipo | Longitud | Restricción | Descripción |
|-------|------|----------|-------------|-------------|
| id | BIGSERIAL | — | PK NOT NULL | Identificador único |
| seccion | VARCHAR | 30 | NOT NULL CHECK(ENUM) | LAIP/COMUDE/PRESUPUESTARIA/SINACIG/RENDICION_CUENTAS/DECRETO_101_97/DECRETO_36_2024 |
| numero | INTEGER | — | NOT NULL | Número de categoría dentro de la sección |
| nombre | VARCHAR | 300 | NOT NULL | Nombre descriptivo de la categoría |
| descripcion | TEXT | — | NULLABLE | Descripción extendida |
| creado_en | TIMESTAMPTZ | — | NOT NULL DEFAULT NOW() | Fecha de creación |

### Tabla: carpeta_oficio

| Campo | Tipo | Longitud | Restricción | Descripción |
|-------|------|----------|-------------|-------------|
| id | BIGSERIAL | — | PK NOT NULL | Identificador único |
| categoria_id | BIGINT | — | FK categoria_oficio NOT NULL | Categoría a la que pertenece |
| nombre | VARCHAR | 300 | NOT NULL | Nombre de la carpeta |
| descripcion | TEXT | — | NULLABLE | Descripción de la carpeta |
| creado_en | TIMESTAMPTZ | — | NOT NULL DEFAULT NOW() | Fecha de creación |
| actualizado_en | TIMESTAMPTZ | — | NOT NULL DEFAULT NOW() | Última actualización |

### Tabla: documento_oficio

| Campo | Tipo | Longitud | Restricción | Descripción |
|-------|------|----------|-------------|-------------|
| id | BIGSERIAL | — | PK NOT NULL | Identificador único |
| carpeta_id | BIGINT | — | FK carpeta_oficio NOT NULL | Carpeta contenedora |
| nombre_archivo | VARCHAR | 255 | NOT NULL | Nombre descriptivo del documento |
| r2_key | VARCHAR | 500 | NOT NULL | Clave en Cloudflare R2 |
| hash_sha256 | VARCHAR | 64 | NOT NULL | Hash SHA-256 |
| tamano_bytes | BIGINT | — | NOT NULL | Tamaño en bytes |
| descripcion | TEXT | — | NULLABLE | Descripción del documento |
| usuario_subida_id | BIGINT | — | FK usuarios | Oficial que publicó |
| fecha_publicacion | TIMESTAMPTZ | — | NOT NULL DEFAULT NOW() | Cuándo se publicó |

### Tabla: registro_auditoria

| Campo | Tipo | Longitud | Restricción | Descripción |
|-------|------|----------|-------------|-------------|
| id | BIGINT (IDENTITY) | — | PK NOT NULL | Identificador único (autoincremental) |
| timestamp_utc | TIMESTAMP | — | NOT NULL | Instante exacto del evento como `Instant` (UTC real, con offset `Z` al serializar); el frontend lo convierte a la hora local del navegador |
| usuario_id | BIGINT | — | FK usuarios NULLABLE | Usuario que ejecutó (null si acción pública o usuario no encontrado) |
| usuario_desc | VARCHAR | 300 | NULLABLE | Descripción textual del usuario/actor |
| ip_origen | VARCHAR | 45 | NULLABLE | IP del cliente (IPv4 o IPv6) |
| accion | VARCHAR | 50 | NOT NULL | LOGIN_EXITOSO, LOGIN_FALLIDO, CUENTA_BLOQUEADA, DESBLOQUEO_CUENTA, CREATE_DOC, DOWNLOAD_DOC, ASSIGN_SOL, RESPOND_SOL, etc. (enum `TipoAccion`) |
| objeto_tipo | VARCHAR | 100 | NULLABLE | Tipo de entidad afectada (ej. "USUARIO", "SOLICITUD") |
| objeto_id | VARCHAR | 100 | NULLABLE | ID del registro afectado |
| objeto_desc | VARCHAR | 500 | NULLABLE | Descripción del objeto afectado |
| resultado | VARCHAR | 20 | NOT NULL CHECK | EXITO / FALLO / DENEGADO |
| detalle | JSONB | — | NULLABLE | Información adicional estructurada (ej. `bloqueado_hasta`, motivo) |

**Restricción de seguridad**: `REVOKE UPDATE, DELETE ON registro_auditoria FROM sgdp_app`. Toda escritura de auditoría corre en transacción independiente (`REQUIRES_NEW`), para que el registro persista aunque la operación que la originó falle y haga rollback.

### Tabla: historial_contrasenas

| Campo | Tipo | Longitud | Restricción | Descripción |
|-------|------|----------|-------------|-------------|
| id | BIGSERIAL | — | PK NOT NULL | Identificador único |
| usuario_id | BIGINT | — | FK usuarios NOT NULL | Usuario propietario |
| contrasena_hash | VARCHAR | 255 | NOT NULL | Hash BCrypt de la contraseña anterior |
| fecha_cambio | TIMESTAMPTZ | — | NOT NULL DEFAULT NOW() | Cuándo se cambió |

### Tabla: versiones_documento

| Campo | Tipo | Longitud | Restricción | Descripción |
|-------|------|----------|-------------|-------------|
| id | BIGSERIAL | — | PK NOT NULL | Identificador único |
| documento_id | BIGINT | — | FK documentos NOT NULL | Documento padre |
| numero_version | INTEGER | — | NOT NULL | Número de versión (1, 2, 3...) |
| r2_key | VARCHAR | 500 | NOT NULL | Clave R2 de esta versión |
| hash_sha256 | VARCHAR | 64 | NOT NULL | Hash de esta versión |
| tamano_bytes | BIGINT | — | NOT NULL | Tamaño en bytes |
| usuario_id | BIGINT | — | FK usuarios | Usuario que creó la versión |
| creado_en | TIMESTAMPTZ | — | NOT NULL DEFAULT NOW() | Cuándo se creó |
| motivo_cambio | TEXT | — | NULLABLE | Por qué se creó nueva versión |

### Tabla: metas_cumplimiento

| Campo | Tipo | Longitud | Restricción | Descripción |
|-------|------|----------|-------------|-------------|
| id | BIGSERIAL | — | PK NOT NULL | Identificador único |
| modulo | VARCHAR | 50 | NOT NULL | solicitudes, documentos, oficio |
| meta_valor | INTEGER | — | NOT NULL | Valor objetivo (ej: 100 solicitudes/mes) |
| completado_valor | INTEGER | — | NOT NULL DEFAULT 0 | Valor actual completado |
| periodo_inicio | DATE | — | NOT NULL | Inicio del período de medición |
| periodo_fin | DATE | — | NOT NULL | Fin del período de medición |
| actualizado_en | TIMESTAMPTZ | — | NOT NULL DEFAULT NOW() | Última actualización |

### Tabla: secuencias_codigo

| Campo | Tipo | Longitud | Restricción | Descripción |
|-------|------|----------|-------------|-------------|
| tipo | VARCHAR | — | PK NOT NULL | "DOC" o "SOL" — es la propia llave primaria, sin `id` autoincremental separado |
| prefijo | VARCHAR | — | NOT NULL | Prefijo del código generado |
| ultimo_num | INTEGER | — | NOT NULL | Último número asignado |
| anio | INTEGER | — | NOT NULL | Año del correlativo vigente |

---

## 8. Criterios de Aceptación del Sistema (CA-01 – CA-10)

### CA-01 — Portal Público Funcional

| Campo | Detalle |
|-------|---------|
| ID | CA-01 |
| Módulo | Portal Ciudadano (CU 0, CU 5) |
| Precondición | Al menos una categoría de oficio con documentos publicados |
| Pasos | 1. Abrir https://sgdp.sanraymundo.gob.gt/ sin credenciales 2. Navegar a Información Pública 3. Expandir sección LAIP → categoría → carpeta 4. Hacer clic en Descargar en un documento |
| Resultado esperado | Todas las secciones cargan en < 3s; PDF se descarga correctamente; sin solicitud de login en ningún momento |
| Estado | Cumplido ✅ |

### CA-02 — Solicitud LAIP Completa

| Campo | Detalle |
|-------|---------|
| ID | CA-02 |
| Módulo | Solicitudes (CU 1) |
| Precondición | Sistema con SMTP configurado; Oficial autenticado |
| Pasos | 1. Ciudadano llena formulario de solicitud con datos válidos 2. Envía 3. Copia código SOL-YYYY-NNNN 4. Oficial se asigna o es asignado por el Administrador 5. Oficial responde desde panel admin 6. Ciudadano usa el código en Seguimiento |
| Resultado esperado | Código SOL generado; email de confirmación enviado al ciudadano (Brevo); respuesta visible en seguimiento; estado RESPONDIDA en BD |
| Estado | Cumplido ✅ |

### CA-03 — Integridad Documental SHA-256

| Campo | Detalle |
|-------|---------|
| ID | CA-03 |
| Módulo | Documentos (CU 2, CU 3) |
| Precondición | Usuario ADMINISTRADOR u OFICIAL autenticado; archivo PDF disponible |
| Pasos | 1. Registrar documento PDF con metadatos completos 2. Verificar código DOC-YYYY-NNNN asignado 3. Verificar hash SHA-256 en tabla documentos 4. Descargar el documento y verificar integridad |
| Resultado esperado | Documento en BD con código DOC y hash SHA-256; la descarga recalcula el hash y lo compara contra el almacenado sin error |
| Estado | Cumplido ✅ |

### CA-04 — Búsqueda con Filtro por Nivel de Acceso

| Campo | Detalle |
|-------|---------|
| ID | CA-04 |
| Módulo | Búsqueda (CU 3) |
| Precondición | Repositorio con documentos PÚBLICOS e INTERNOS |
| Pasos | 1. Buscar "presupuesto" sin autenticación (Portal Ciudadano) 2. Anotar resultados 3. Buscar el mismo término autenticado (cualquier rol) 4. Comparar resultados |
| Resultado esperado | Sin auth: solo documentos PÚBLICOS. Autenticado (cualquier rol): PÚBLICOS + INTERNOS. Coincidencia por subcadena, no requiere el término exacto |
| Estado | Cumplido ✅ |

### CA-05 — Seguridad de Cuentas

| Campo | Detalle |
|-------|---------|
| ID | CA-05 |
| Módulo | Usuarios (CU 4) |
| Precondición | Usuario activo en el sistema |
| Pasos | 1. Intentar login con contraseña incorrecta 3 veces consecutivas 2. Intentar un 4to login con contraseña correcta 3. Esperar 15 minutos o pedir al Administrador que desbloquee manualmente 4. Intentar login con credenciales correctas |
| Resultado esperado | 4to intento: HTTP 400 "Cuenta bloqueada por 15 minutos debido a múltiples intentos fallidos", con la hora de desbloqueo mostrada en horario de Guatemala; tras el desbloqueo (automático o manual por el Administrador): acceso restaurado |
| Estado | Cumplido ✅ |

### CA-06 — Auditoría Inmutable

| Campo | Detalle |
|-------|---------|
| ID | CA-06 |
| Módulo | Auditoría (CU 6) |
| Precondición | Superusuario PostgreSQL disponible para prueba directa |
| Pasos | 1. Ejecutar 10 operaciones en el sistema 2. Consultar log como ADMINISTRADOR 3. Intentar DELETE directo en registro_auditoria desde cliente BD con usuario sgdp_app |
| Resultado esperado | 10 registros en log; DELETE rechazado con "ERROR: permission denied for table registro_auditoria" |
| Estado | Cumplido ✅ |

### CA-07 — Reportes de Cumplimiento

| Campo | Detalle |
|-------|---------|
| ID | CA-07 |
| Módulo | Reportes (CU 7) |
| Precondición | Datos de solicitudes y documentos en BD |
| Pasos | 1. ADMINISTRADOR u OFICIAL accede a Reportes 2. Exporta CSV de Solicitudes de Información 3. Exporta PDF de Repositorio Documental 4. (Solo ADMINISTRADOR) exporta Registro de Auditoría |
| Resultado esperado | Archivos CSV y PDF descargados con los datos correctos; tarjeta de Auditoría no visible para OFICIAL |
| Estado | Cumplido ✅ |

### CA-08 — Rendimiento bajo Carga

| Campo | Detalle |
|-------|---------|
| ID | CA-08 |
| Módulo | Rendimiento (RNF-01) |
| Precondición | BD con ≥ 1,000 documentos indexados |
| Pasos | 1. Ejecutar 20 búsquedas concurrentes con herramienta de carga 2. Medir tiempo de respuesta P95 |
| Resultado esperado | P95 < 3 segundos; sin errores 5xx |
| Estado | Pendiente prueba formal (funcionamiento validado manualmente) |

### CA-09 — Seguridad de Transporte

| Campo | Detalle |
|-------|---------|
| ID | CA-09 |
| Módulo | Seguridad (RNF-03) |
| Precondición | Sistema desplegado en producción |
| Pasos | 1. Intentar acceder por HTTP 2. Verificar redirección a HTTPS 3. Verificar versión TLS con herramienta (ej. SSL Labs) |
| Resultado esperado | HTTP redirige a HTTPS; TLS 1.3 activo; calificación A en SSL Labs |
| Estado | Cumplido ✅ (Cloudflare WAF activo) |

### CA-10 — Usabilidad para Funcionario

| Campo | Detalle |
|-------|---------|
| ID | CA-10 |
| Módulo | Usabilidad (RNF-04) |
| Precondición | Funcionario sin formación técnica previa en el sistema |
| Pasos | 1. Dar instrucciones mínimas (URL y credenciales) 2. Pedir al funcionario registrar un documento 3. Medir tiempo desde inicio hasta confirmación |
| Resultado esperado | Registro completado en < 3 minutos; sin necesidad de asistencia técnica adicional |
| Estado | Pendiente prueba formal con personal municipal |

---

## 9. Tabla de Evaluación y Aceptación

| Módulo / CU | CAs vinculados | Estado | Observaciones | Firma evaluador |
|-------------|----------------|--------|---------------|-----------------|
| CU 0 — Portal Ciudadano | CA-01 | ✅ Cumplido | 5 páginas públicas funcionales | [PENDIENTE] |
| CU 1 — Solicitudes LAIP | CA-02 | ✅ Cumplido | Notificación interna de vencimiento (campanita) y reactivación de solicitudes VENCIDA implementadas | [PENDIENTE] |
| CU 2 — Registro Documental | CA-03 | ✅ Cumplido | Verificación de hash en descarga implementada | [PENDIENTE] |
| CU 3 — Búsqueda | CA-04, CA-08 | ✅ Cumplido | Carga formal pendiente | [PENDIENTE] |
| CU 4 — Usuarios | CA-05 | ✅ Cumplido | 155 pruebas backend pasan; desbloqueo manual por Administrador implementado | [PENDIENTE] |
| CU 5 — Oficio | CA-01 | ✅ Cumplido | Alerta 25 días implementada (Dashboard + campanita) | [PENDIENTE] |
| CU 6 — Auditoría | CA-06 | ✅ Cumplido | REVOKE implementado; escritura en transacción independiente | [PENDIENTE] |
| CU 7 — Reportes | CA-07 | ✅ Cumplido | Exportación PDF/CSV implementada (3 reportes) | [PENDIENTE] |
| CU 8 — Reglas Negocio | CA-03 a CA-06 | ✅ Cumplido | RN-11/RN-12 (permisos de solicitudes y reactivación VENCIDA) agregadas | [PENDIENTE] |

**Oficial de Información designado**: ________________________________  
**Cargo**: Oficial de Información LAIP, Municipalidad de San Raymundo  
**Fecha de evaluación**: ________________________________  
**Firma**: ________________________________

---

## 10. Modelo de Calidad ISO/IEC 25010

| Característica | Sub-característica | Aplicación en SGDP | Métrica | Estado |
|----------------|-------------------|-------------------|---------|--------|
| Adecuación funcional | Completitud funcional | CU 0–CU 8 cubren todos los requerimientos LAIP identificados | 18/18 RF definidos; 14/18 implementados | Parcial |
| Adecuación funcional | Corrección funcional | 42 pruebas backend + 9 frontend verifican comportamiento correcto | 0 test failures en CI/CD | Cumplido |
| Adecuación funcional | Pertinencia funcional | Sistema diseñado específicamente para contexto municipal guatemalteco | Incluye feriados GT, artículos LAIP específicos | Cumplido |
| Eficiencia de desempeño | Comportamiento temporal | Búsquedas < 3s con índice GIN; API REST stateless | P95 < 3s en búsqueda | Implementado |
| Eficiencia de desempeño | Utilización de recursos | HikariCP pool; lazy loading JPA; sin N+1 queries | Pool size configurado; queries optimizadas | Implementado |
| Compatibilidad | Interoperabilidad | API REST JSON; compatible con cualquier cliente HTTP; S3 API para R2 | Postman collection funcional | Cumplido |
| Compatibilidad | Coexistencia | Sin conflictos con otros sistemas municipales | Despliegue independiente | Cumplido |
| Usabilidad | Reconocibilidad | UI con iconografía Lucide; colores institucionales; navbar consistente | Test informal con usuarios | Implementado |
| Usabilidad | Aprendizaje | Formularios con validación en tiempo real; mensajes de error en español | < 3 min registro documental (objetivo) | Pendiente prueba |
| Usabilidad | Protección ante errores | Validación Zod frontend + Bean Validation backend; doble capa | 0 datos inválidos en BD si validación activa | Implementado |
| Fiabilidad | Tolerancia a fallos | Rollback transaccional JPA; EmailService @Async no bloquea flujo | Error en email no falla solicitud | Implementado |
| Fiabilidad | Recuperabilidad | Backups automáticos Neon; Railway auto-restart | RTO < 4h; RPO < 24h | Implementado (SLA providers) |
| Seguridad | Confidencialidad | JWT; RBAC; TLS 1.3; niveles PÚBLICO/INTERNO | 0 High/Medium/Low en escaneo OWASP ZAP real (1 informativo) | Implementado |
| Seguridad | Integridad | SHA-256 documental; APPEND-ONLY log; validación entrada | Hash en BD; REVOKE UPDATE/DELETE | Implementado |
| Seguridad | No repudio | Log auditoría con usuario_id, timestamp UTC, IP | Todo evento trazable a usuario | Implementado |
| Seguridad | Autenticidad | BCrypt factor 12; historial contraseñas; bloqueo 3 intentos | Estándar OWASP aplicado | Implementado |
| Mantenibilidad | Modularidad | Arquitectura capas: Controller→Service→Repository; DTOs separados | Bajo acoplamiento; alta cohesión | Implementado |
| Mantenibilidad | Analizabilidad | JaCoCo ≥ 70%; log auditoría completo; Flyway migraciones versionadas | Trazabilidad de cambios | Implementado |
| Mantenibilidad | Capacidad de prueba | JUnit 5 + Mockito; Jest + RTL; CI/CD pipeline | 42+9 pruebas automatizadas | Implementado |
| Portabilidad | Adaptabilidad | Docker-compatible (Railway); env vars para configuración | Sin config hardcodeada | Implementado |
| Portabilidad | Instalabilidad | GitHub Actions CI/CD; despliegue automático en push a main | < 5 min deploy | Implementado |

---

## 11. Estrategia de Ciberseguridad

### 11.1 Autenticación

- **Protocolo**: JSON Web Token (JWT) RFC 7519 con firma HMAC-SHA256
- **Expiración**: 8 horas; sin refresh tokens (re-login requerido)
- **Almacenamiento token**: localStorage en frontend (no cookie, evita CSRF)
- **Contraseñas**: BCrypt con factor de costo 12 (≈250ms/hash en hardware moderno)
- **Historial**: Últimas 3 contraseñas almacenadas en `historial_contrasenas`
- **Bloqueo**: 3 intentos fallidos consecutivos → bloqueo 15 minutos (campo `fecha_desbloqueo`)
- **Primer acceso**: `cambio_contrasena_requerido = true` forzado en frontend

### 11.2 Autorización (RBAC)

```
ADMINISTRADOR > OFICIAL > FUNCIONARIO > Ciudadano (sin auth)
```

- **Implementación**: Spring Security 6 con `@PreAuthorize` por endpoint
- **Verificación**: `JwtFilter` inyecta `UsernamePasswordAuthenticationToken` en cada petición
- **Sin sesiones**: `SessionCreationPolicy.STATELESS` — sin cookies de sesión
- **usuario_id**: SIEMPRE obtenido del `SecurityContextHolder`, NUNCA del request body

### 11.3 Cifrado

| Capa | Mecanismo | Cobertura |
|------|-----------|-----------|
| En tránsito | TLS 1.3 (Cloudflare WAF) | Toda comunicación cliente↔servidor |
| En reposo (archivos) | AES-256 (Cloudflare R2) | Todos los PDFs almacenados |
| Contraseñas | BCrypt factor 12 | Tabla usuarios.contrasena_hash |
| Integridad documental | SHA-256 (backend) | Todos los documentos PDF |

### 11.4 Auditoría y No Repudio

- **Cobertura**: Toda operación CRUD y de negocio genera registro en `registro_auditoria`
- **Inmutabilidad**: `REVOKE UPDATE, DELETE ON registro_auditoria FROM sgdp_app` — nivel BD
- **Campos**: timestamp UTC, usuario_id, tipo_accion, tabla_afectada, registro_id, ip_origen, resultado
- **Retención**: 5 años mínimo según normativa LAIP
- **Acceso**: Solo rol ADMINISTRADOR puede consultar y exportar

### 11.5 Controles OWASP Top 10 2021

| Categoría OWASP | Riesgo | Control implementado en SGDP |
|----------------|--------|-------------------------------|
| A01 — Broken Access Control | Alto | RBAC con @PreAuthorize; JwtFilter en cada petición; FUNCIONARIO no accede a auditoría/usuarios |
| A02 — Cryptographic Failures | Alto | TLS 1.3 forzado por Cloudflare; BCrypt factor 12; SHA-256 para integridad; AES-256 en R2 |
| A03 — Injection | Alto | Spring Data JPA con parámetros preparados (no SQL dinámico); Hibernate HQL; validación Bean Validation |
| A04 — Insecure Design | Medio | DERCAS documenta amenazas; APPEND-ONLY auditoría; diseño RBAC desde requirements |
| A05 — Security Misconfiguration | Medio | Env vars para secrets (no hardcode); CORS configurado explícitamente; headers de seguridad via Cloudflare |
| A06 — Vulnerable Components | Medio | Dependabot alerts en GitHub; Spring Boot 3.3.4 con parches de seguridad; versions actualizadas |
| A07 — Identification and Authentication Failures | Alto | Bloqueo 3 intentos; JWT 8h; BCrypt; historial contraseñas; cambio forzado primer login |
| A08 — Software and Data Integrity Failures | Medio | SHA-256 en cada PDF; GitHub Actions firma commits; no deserialización de datos externos |
| A09 — Security Logging and Monitoring Failures | Medio | Log completo en registro_auditoria; Railway logs accesibles; alertas de error en producción |
| A10 — Server-Side Request Forgery | Bajo | Sin proxy a URLs externas; R2 accedido via SDK con credenciales fijas; no redirecciones dinámicas |

---

## 12. Plan de Pruebas Resumido

### Nivel 1 — Pruebas Unitarias e Integración

**Backend (JUnit 5 + Mockito) — 155 pruebas en total**, cubriendo entre otros: `AuthServiceTest` (login, bloqueo/desbloqueo de cuenta, cambio de contraseña), `SolicitudServiceTest` (crear, asignar, responder, denegar, prorrogar, reactivación VENCIDA), `UsuarioServiceTest` (CRUD, `registrarIntentoFallido`, `desbloquearCuenta`), `DocumentoServiceTest` (registro, hash SHA-256, descarga con verificación), `NotificacionServiceTest` (por vencer, vencida, oficio desactualizado), `AuditoriaServiceTest`, `DiasHabilesServiceTest` (feriados GT, Semana Santa, 29-jun).

**Frontend (Jest + React Testing Library) — 164 pruebas en 27 suites**, cubriendo páginas públicas (`PresentarSolicitudPage`, `SeguimientoPage`, `BuscadorPublicoPage`, `InformacionOficioPage`), páginas admin (`SolicitudesPage`, `DocumentosPage`, `UsuariosPage`, `AuditoriaPage`, `ReportesPage`, `DashboardPage`) y componentes (`NotificationBell`, `Topbar`, `AdminLayout`, `AuthContext`).

**Pipeline CI/CD** (GitHub Actions — bloquea deploy si falla):
```yaml
# Backend: mvn verify
# JaCoCo: check rule BUNDLE: LINE >= 45% (bajado de un objetivo inicial de 70%
#   tras medir variación real entre entorno local y CI)
# Frontend: npm run test:coverage
# Threshold: >= 50%
```

### Nivel 2 — Pruebas de Integración API

Herramienta: Postman Collection (importable)

| Escenario | Método | Endpoint |
|-----------|--------|----------|
| Login exitoso | POST | /api/auth/login |
| Login bloqueado | POST | /api/auth/login (4to intento) |
| Crear solicitud ciudadano | POST | /api/publico/solicitudes |
| Seguimiento por código | GET | /api/publico/solicitudes/{codigo}/seguimiento |
| Upload documento PDF | POST | /api/documentos |
| Búsqueda documentos | GET | /api/documentos?q=presupuesto |
| Responder solicitud | PUT | /api/solicitudes/{id}/responder |
| Consultar auditoría | GET | /api/admin/auditoria |
| Acceso sin rol suficiente | GET | /api/admin/auditoria (con token FUNCIONARIO → 403 Acceso denegado) |

### Nivel 3 — Pruebas de Seguridad

Herramienta: OWASP ZAP (baseline scan, ejecutado vía GitHub Actions con `docker run ghcr.io/zaproxy/zaproxy:stable zap-baseline.py`)

- **Target**: URL de producción en Railway
- **Resultado real obtenido**: 0 alertas HIGH, 0 MEDIUM, 0 LOW, 1 informativa
- **Hallazgo corregido durante el escaneo**: cabecera HSTS ausente — resuelto con `server.forward-headers-strategy=framework` en `application.properties` (Railway termina TLS antes de la app; sin este ajuste Spring no confiaba en `X-Forwarded-Proto` y no emitía `Strict-Transport-Security`)

### Nivel 4 — Pruebas de Carga

Herramienta: Apache JMeter o k6

- **Escenario**: 20 usuarios concurrentes realizando búsquedas de texto completo
- **Duración**: 5 minutos sostenidos
- **Objetivo**: P95 < 3 segundos; 0 errores HTTP 5xx
- **Dataset**: 1,000 documentos pre-cargados en BD de prueba

### Pipeline CI/CD completo

```
GitHub Push → GitHub Actions:
  ├── Backend: mvn verify
  │   ├── JUnit 5 (155 tests)
  │   └── JaCoCo check (≥45%)
  ├── Frontend: npm run test:coverage
  │   ├── Jest + RTL (164 tests, 27 suites)
  │   └── Coverage threshold (≥50%)
  └── Si todo pasa → Deploy automático:
      ├── Backend → Railway (Docker container)
      └── Frontend → Railway (build + deploy)
```

---

## 13. Glosario Técnico

| Término | Definición |
|---------|-----------|
| APPEND-ONLY | Tabla de base de datos configurada con `REVOKE UPDATE, DELETE` para garantizar que solo se puedan insertar registros, nunca modificar ni eliminar. Garantiza inmutabilidad del log de auditoría. |
| API REST | Application Programming Interface basada en principios REST (Representational State Transfer): sin estado, recursos identificados por URL, operaciones con verbos HTTP (GET, POST, PUT, DELETE, PATCH). |
| BCrypt | Función de hash adaptativa para contraseñas basada en el cifrado Blowfish. El factor de costo (12 en SGDP) determina la dificultad computacional, protegiéndose contra ataques de fuerza bruta. |
| CDN | Content Delivery Network — red de servidores distribuidos globalmente que sirve contenido estático (HTML, JS, CSS, imágenes) desde el nodo más cercano al usuario, reduciendo latencia. |
| CI/CD | Continuous Integration / Continuous Deployment — práctica de automatizar la compilación, prueba y despliegue de software cada vez que se realiza un commit en el repositorio. |
| DERCAS | Documento de Especificación de Requerimientos, Casos de Uso y Arquitectura del Sistema. Artefacto central de especificación de software en la metodología de proyectos de graduación UMG. |
| DiasHabilesService | Servicio Spring Boot que calcula días hábiles guatemaltecos excluyendo fines de semana y feriados: 1-ene, 1-may, 30-jun, 15-ago, 15-sep, 20-oct, 1-nov, 24-dic, 25-dic, 31-dic + Semana Santa (algoritmo Meeus) + 29-jun (San Raymundo). |
| DOC-YYYY-NNNN | Código correlativo de documentos del repositorio SGDP. YYYY = año, NNNN = número secuencial (0001 en adelante). Se reinicia cada año. Ejemplo: DOC-2026-0042. |
| EXP-YYYY-NNNN | Código correlativo de expedientes/solicitudes LAIP. Misma estructura que DOC. Ejemplo: EXP-2026-0015. |
| FAST | Facilitated Application Specification Techniques — metodología de elicitación y especificación de requerimientos mediante sesiones colaborativas entre usuarios y equipo de desarrollo. |
| Flyway | Herramienta de migración de base de datos. Ejecuta scripts SQL versionados (V1__, V2__, etc.) en orden, garantizando que el esquema de BD sea reproducible y auditable. |
| GIN Index | Generalized Inverted Index — tipo de índice en PostgreSQL optimizado para búsquedas en tipos compuestos como tsvector, arrays y JSONB. Fundamental para búsqueda full-text con alto rendimiento. |
| GitHub Actions | Plataforma de CI/CD de GitHub. En SGDP ejecuta mvn verify y npm test en cada push, bloqueando el despliegue si alguna prueba falla o la cobertura no alcanza el 70%. |
| Hibernate | Framework ORM (Object-Relational Mapping) que Spring Data JPA usa internamente para mapear entidades Java a tablas PostgreSQL, gestionar transacciones y generar SQL. |
| ISO | International Organization for Standardization. Organismo que publica normas internacionales. SGDP aplica ISO 30300, ISO 15489-1, ISO 16175-1 e ISO/IEC 25010. |
| JaCoCo | Java Code Coverage Library. Herramienta que mide el porcentaje de líneas, ramas y métodos del código Java ejecutados durante las pruebas JUnit. SGDP requiere ≥ 70%. |
| JPA | Java Persistence API. Especificación Java para ORM. Spring Data JPA la implementa con Hibernate como proveedor. |
| JWT | JSON Web Token (RFC 7519). Token de autenticación compacto y auto-contenido, firmado con HMAC-SHA256. En SGDP expira en 8 horas y no requiere sesión en servidor. |
| JUnit 5 | Framework de pruebas unitarias para Java. En SGDP tiene 42 pruebas en 6 clases de prueba que verifican la lógica de negocio de los servicios principales. |
| LAIP | Ley de Acceso a la Información Pública — Decreto 57-2008 del Congreso de Guatemala. Establece la obligación de publicar información de oficio (Art. 10) y atender solicitudes en 10 días hábiles (Art. 42). |
| Mermaid | Lenguaje de diagramas basado en texto que se renderiza en Markdown (GitHub, Notion, Obsidian). Se usa en SGDP para todos los diagramas técnicos del proyecto. |
| Neon | Proveedor de PostgreSQL serverless en la nube. SGDP lo usa como base de datos en producción por su capacidad de branching, scale-to-zero y backups automáticos. |
| OWASP ZAP | Zed Attack Proxy — herramienta open source para pruebas de seguridad de aplicaciones web. En SGDP se usa para active scanning del backend Railway. |
| PlazosScheduler | Componente Spring Boot (`@Scheduled`) que se ejecuta automáticamente cada día a las 6 AM. Verifica solicitudes LAIP próximas a vencer (día 7 hábil) y marca como VENCIDAS las que superaron el plazo. |
| RBAC | Role-Based Access Control. Modelo de control de acceso donde los permisos se asignan a roles y los usuarios se asignan a roles. SGDP tiene 3 roles: ADMINISTRADOR, OFICIAL, FUNCIONARIO. |
| R2 | Cloudflare R2 Storage. Almacenamiento de objetos (blobs) compatible con la API S3 de Amazon, sin cargos de egress. SGDP almacena todos los PDFs en R2. |
| Railway | Plataforma de despliegue cloud para aplicaciones en contenedores. SGDP despliega el backend Spring Boot como contenedor Docker en Railway, con despliegue automático desde GitHub. |
| RTL | React Testing Library. Librería de pruebas para componentes React que promueve pruebas centradas en el comportamiento del usuario (queries por rol, texto, label). |
| RUP | Rational Unified Process. Metodología de desarrollo de software iterativa e incremental. SGDP usa elementos de RUP integrados con FAST para la especificación de requerimientos. |
| SDLC | Software Development Life Cycle. Proceso estructurado para planear, crear, probar y desplegar sistemas de información. |
| SECAI | Secretaría Específica de Cumplimiento del Acceso a la Información. Entidad guatemalteca a la que las municipalidades reportan su cumplimiento LAIP. SGDP genera reportes para SECAI. |
| SHA-256 | Secure Hash Algorithm de 256 bits. Función hash criptográfica unidireccional usada para verificar la integridad de documentos. En SGDP se calcula SIEMPRE en backend, nunca en frontend. |
| Spring Boot | Framework Java para crear aplicaciones Spring con configuración mínima. SGDP usa Spring Boot 3.3.4 con autoconfiguración de seguridad, JPA y REST. |
| Spring Security | Módulo de seguridad de Spring Framework. En SGDP gestiona autenticación JWT (stateless), autorización RBAC con @PreAuthorize y protección de endpoints. |
| SGDP | Sistema de Gestión Documental Pública. Sistema web desarrollado para la Municipalidad de San Raymundo para cumplir con LAIP y gestionar documentos oficiales. |
| TLS | Transport Layer Security. Protocolo criptográfico para comunicaciones seguras en red. SGDP requiere TLS 1.3 mínimo, gestionado por Cloudflare WAF. |
| tsvector/tsquery | Tipos de datos de PostgreSQL para búsqueda de texto completo. `tsvector` almacena el texto normalizado; `tsquery` es la consulta de búsqueda. Se indexan con GIN para máximo rendimiento. |
| UML | Unified Modeling Language. Lenguaje estándar para modelado de sistemas de software. En SGDP se usa para casos de uso, clases, secuencia, estados e infraestructura. |
| Zod | Biblioteca TypeScript-first para validación de esquemas. En SGDP valida formularios del frontend (solicitudes, documentos, login) con mensajes de error en español. |

---

*Documento generado: agosto 2026 · SGDP v1.0*  
*Universidad Mariano Gálvez de Guatemala · Facultad de Ingeniería*  
*Asesor: Ing. Román Estuardo Cancinos Arbizu*
