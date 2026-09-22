# SGDP — Especificación de Casos de Uso
## Sistema de Gestión Documental Pública · Municipalidad de San Raymundo
**Autor**: Jackeline Nikole Sanchez Moscut · Carné 7590-22-332 · UMG 2026
**Versión**: 1.0 · Septiembre 2026
**Marco legal**: Decreto 57-2008 (LAIP) · ISO 15489-1:2016 · ISO 30300:2020

---

## Índice de Casos de Uso

| Código | Nombre | Módulo | Actores principales |
|--------|--------|--------|---------------------|
| CU 0 | Portal Ciudadano de Transparencia | Portal Público | Ciudadano |
| CU 1 | Gestión de Solicitudes de Información Pública | Solicitudes LAIP | Ciudadano, Administrador, Oficial, Sistema |
| CU 2 | Registro y Clasificación Documental | Gestión Documental | Oficial, Administrador |
| CU 3 | Búsqueda y Recuperación de Documentos | Gestión Documental | Ciudadano, Funcionario, Oficial, Administrador |
| CU 4 | Gestión de Usuarios y Control de Acceso | Administración Usuarios | Administrador |
| CU 5 | Publicación de Información de Oficio | Información de Oficio (Art. 10) | Oficial, Administrador |
| CU 6 | Registro de Auditoría y Trazabilidad | Auditoría | Sistema, Administrador |
| CU 7 | Generación de Reportes de Cumplimiento | Reportes y Dashboard | Oficial, Administrador |
| CU 8 | Reglas de Negocio Consolidadas | Transversal | Sistema, todos los roles |

---

## CU 0 — Portal Ciudadano de Transparencia

**Versión**: 1.0 · **Fecha**: Septiembre 2026
**Autor**: Jackeline Nikole Sanchez Moscut

| Historial de Revisiones | | | |
|---|---|---|---|
| Nombre | Fecha | Descripción del cambio | Versión |
| Jackeline Sanchez | Sep. 2026 | Versión final, verificada contra código fuente | 1.0 |

### 1. Introducción

**1.1. Definición:**
Portal web oficial de transparencia de la Municipalidad de San Raymundo, diseñado para el acceso público sin necesidad de autenticación. Permite a cualquier ciudadano navegar las 7 secciones de transparencia establecidas por el Artículo 10 del Decreto 57-2008 (LAIP), consultar y descargar documentos PDF publicados de oficio, buscar en el repositorio de documentos públicos, presentar solicitudes de acceso a información pública y dar seguimiento a trámites existentes mediante un código correlativo único.

**1.2. Objetivo:**
Centralizar el acceso ciudadano a la información institucional de la Municipalidad, garantizando el cumplimiento del principio de transparencia activa establecido por la Ley de Acceso a la Información Pública, sin requerir registro ni credenciales de ningún tipo.

### 2. Definición Caso de Uso

**2.1. Actores:**
- 2.1.1. Ciudadano (Usuario Externo): Persona que accede al portal de forma anónima para consultar información pública, descargar documentos, presentar solicitudes LAIP o dar seguimiento a trámites.
- 2.1.2. Sistema Informático: Backend Spring Boot desplegado en Railway, que entrega el contenido dinámico consumido por la SPA React (también en Railway).

**2.2. Precondiciones:**
- 2.2.1. El backend en Railway debe estar operativo y accesible vía HTTPS.
- 2.2.2. El sistema debe encontrarse activo con conexión a la base de datos PostgreSQL 16 (Neon).
- 2.2.3. Al menos una sección de transparencia debe contar con documentos publicados.
- 2.2.4. El frontend React debe estar desplegado y operativo en Railway.

**2.3. Flujo Normal Básico:**
- 2.3.1. El ciudadano accede a la URL del sistema a través de su navegador web vía HTTPS.
- 2.3.2. El sistema despliega la página principal (HomePage) con cuatro tarjetas de acceso rápido: Información Pública, Presentar Solicitud, Seguimiento y Buscar Documentos.
- 2.3.3. El ciudadano da clic en la opción Información Pública.
- 2.3.4. El sistema realiza la consulta `GET /api/publico/oficio/v2/categorias` y despliega las 7 secciones de transparencia (Art. 10 LAIP, COMUDE, Presupuestaria, SINACIG, Rendición de Cuentas, Decreto 101-97, Decreto 36-2024), cada una con sus categorías disponibles. La sección LAIP tiene 29 categorías fijas.
- 2.3.5. El ciudadano selecciona una sección (ej. LAIP) y una categoría (ej. Categoría 1 — Estructura Orgánica).
- 2.3.6. El sistema consulta `GET /api/publico/oficio/v2/carpetas` y presenta las carpetas disponibles para la categoría seleccionada.
- 2.3.7. El ciudadano expande una carpeta y visualiza la lista de documentos PDF publicados.
- 2.3.8. El ciudadano da clic en el botón Descargar sobre el documento de su interés.
- 2.3.9. El sistema ejecuta `GET /api/publico/oficio/documentos/{id}/descargar` y retorna el stream del archivo PDF desde Cloudflare R2, actuando siempre como proxy — nunca se expone una URL pública directa de R2.
- 2.3.10. El ciudadano recibe el archivo PDF en su navegador para su visualización o descarga local.
- 2.3.11. Fin del caso de uso.

> **Nota de verificación**: la descarga pública de un documento de oficio (`GET /api/publico/oficio/v2/documentos/{docId}/archivo`, sin autenticación) **no genera registro en `registro_auditoria`**, de forma consistente e intencional con el resto de descargas anónimas del sistema (tampoco se audita la descarga pública de documentos del repositorio) — no hay un usuario autenticado al cual atribuir el evento. En cambio, la gestión administrativa de la información de oficio (crear/editar/eliminar categorías, carpetas y documentos) sí queda auditada; ver CU 5.

### 3. Flujos Alternos

**3.1. FA01 — Documento no encontrado:**
- 3.1.1. El ciudadano intenta acceder a un documento cuyo identificador no existe en la base de datos o ha sido eliminado.
- 3.1.2. El sistema retorna HTTP 404 con el mensaje: "Documento no encontrado".
- 3.1.3. Fin del flujo alterno.

**3.2. FA02 — Servicio no disponible:**
- 3.2.1. El ciudadano realiza una solicitud pero el backend en Railway no responde dentro del tiempo de espera configurado.
- 3.2.2. El frontend despliega el mensaje: "No se pudo cargar la información. Intente nuevamente."
- 3.2.3. Fin del flujo alterno, el ciudadano puede reintentar la operación desde el paso 2.3.3.

**3.3. FA03 — Intento de acceso a documento del repositorio con nivel INTERNO:**
- 3.3.1. El ciudadano intenta acceder directamente mediante URL a un documento del repositorio (no de información de oficio) con nivel de acceso INTERNO.
- 3.3.2. El sistema rechaza la solicitud — no se expone ningún contenido del documento. [RN-04]
- 3.3.3. Fin del flujo alterno.

**3.4. FA04 — Búsqueda de documentos del repositorio:**
- 3.4.1. El ciudadano da clic en la opción Buscar Documentos desde la página principal.
- 3.4.2. El sistema muestra un campo de búsqueda con filtro opcional de categoría.
- 3.4.3. El ciudadano ingresa el término de búsqueda y presiona el botón Buscar.
- 3.4.4. El sistema consulta `GET /api/publico/documentos/buscar` aplicando automáticamente el filtro de nivel de acceso PÚBLICO. [RN-04] [RF-08]
- 3.4.5. El sistema presenta los resultados encontrados, o el mensaje "Sin documentos" si ninguno coincide.
- 3.4.6. Fin del flujo alterno.

**3.5. FA05 — Seguimiento de solicitud:**
- 3.5.1. El ciudadano da clic en la opción Seguimiento desde la página principal.
- 3.5.2. El sistema muestra un campo para ingresar el código de expediente.
- 3.5.3. El ciudadano ingresa su código SOL-YYYY-NNNN y da clic en Consultar.
- 3.5.4. Continúa en CU 1 — Gestión de Solicitudes, flujo de Seguimiento.
- 3.5.5. Fin del flujo alterno.

### 4. Postcondiciones
- 4.1. El ciudadano visualiza los documentos públicos disponibles sin necesidad de cuenta o autenticación.
- 4.2. Toda descarga de documentos del repositorio realizada por un usuario autenticado queda registrada en `registro_auditoria`. [RN-07]
- 4.3. El acceso a documentos del repositorio con nivel INTERNO es bloqueado en todo momento para usuarios no autenticados. [RN-04]

---

## CU 1 — Gestión de Solicitudes de Información Pública

**Versión**: 1.0 · **Fecha**: Septiembre 2026
**Autor**: Jackeline Nikole Sanchez Moscut

| Historial de Revisiones | | | |
|---|---|---|---|
| Nombre | Fecha | Descripción del cambio | Versión |
| Jackeline Sanchez | Sep. 2026 | Versión final, verificada contra código fuente | 1.0 |

### 1. Introducción

**1.1. Definición:**
Este caso de uso describe el ciclo de vida completo de las solicitudes de acceso a información pública bajo el Decreto 57-2008 (LAIP). Abarca la presentación por parte del ciudadano desde el portal público, la generación automática de un código correlativo SOL-YYYY-NNNN, el cálculo del plazo de 10 días hábiles con feriados guatemaltecos (incluyendo Semana Santa y el 29 de junio — día de San Raymundo), las notificaciones de vencimiento próximo (email al ciudadano y notificación interna al personal), y el procesamiento por parte del personal municipal: asignar, responder, denegar y prorrogar, conforme a las reglas de permisos establecidas.

**1.2. Objetivo:**
Garantizar el cumplimiento del Artículo 42 del Decreto 57-2008 mediante el control automatizado de plazos y estados de cada solicitud, asegurando que el ciudadano reciba una respuesta oportuna dentro de los 10 días hábiles legalmente establecidos, con trazabilidad completa de cada acción realizada.

### 2. Definición Caso de Uso

**2.1. Actores:**
- 2.1.1. Ciudadano (Usuario Externo): Presenta la solicitud desde el portal público sin autenticación y consulta el estado mediante código.
- 2.1.2. Administrador (Usuario Interno): Visualiza el listado completo de solicitudes y asigna un Oficial responsable. No puede responder, prorrogar ni denegar. [RN-11]
- 2.1.3. Oficial de Información (Usuario Interno): Se autoasigna o recibe asignación de solicitudes. Es el único autorizado para responder, prorrogar o denegar las solicitudes que le han sido asignadas. [RN-11]
- 2.1.4. Sistema Informático: `DiasHabilesService`, `PlazosScheduler`, `NotificacionService` y `EmailService` vía Brevo.

**2.2. Precondiciones:**
- 2.2.1. El sistema SGDP debe estar operativo y accesible vía HTTPS.
- 2.2.2. Para asignar, responder, prorrogar o denegar: el usuario interno debe estar autenticado con JWT válido y rol correspondiente.
- 2.2.3. Para denegar: la causal de denegación debe contar con un mínimo de 10 caracteres. [RN-02]

**2.3. Flujo Normal Básico — Presentación de Solicitud:**
- 2.3.1. El ciudadano accede a la sección Solicitudes del portal público (`/solicitud`).
- 2.3.2. El sistema despliega el formulario de solicitud con validación en tiempo real mediante Zod.
- 2.3.3. El ciudadano completa los campos: nombre completo, DPI (13 dígitos), correo electrónico, teléfono (opcional) y descripción de la información solicitada (entre 20 y 2,000 caracteres).
- 2.3.4. El ciudadano da clic en el botón Presentar Solicitud.
- 2.3.5. El sistema realiza la petición `POST /api/publico/solicitudes` y valida los campos en el backend.
- 2.3.6. El sistema genera el código correlativo SOL-YYYY-NNNN desde la tabla `secuencias_codigo` mediante `SolicitudService.generarCodigoExpediente()`, con bloqueo pesimista para garantizar unicidad bajo concurrencia. [RN-06]
- 2.3.7. El sistema calcula la fecha límite de respuesta igual a la fecha actual más 10 días hábiles, utilizando `DiasHabilesService`, que excluye feriados guatemaltecos fijos, Semana Santa (algoritmo Meeus/Jones/Butcher) y el 29 de junio como feriado local de San Raymundo. [RN-01]
- 2.3.8. El sistema inserta el registro en la tabla `solicitudes_informacion` con estado `PENDIENTE`.
- 2.3.9. El sistema envía confirmación por correo de forma asíncrona a través de la API HTTP de Brevo, incluyendo el código correlativo y la fecha límite.
- 2.3.10. El sistema registra el evento `CREATE_SOL` en `registro_auditoria`. [RN-07]
- 2.3.11. El sistema retorna el `codigoExpediente` (ej. "SOL-2026-0042") y la `fechaLimite` calculada.
- 2.3.12. El ciudadano visualiza el código en la pantalla de confirmación con un botón para copiarlo al portapapeles.
- 2.3.13. Fin del flujo normal básico.

**2.4. Flujo Normal Básico — Asignación y Procesamiento:**
- 2.4.1. El Administrador u Oficial accede a `/admin/solicitudes` con sesión autenticada.
- 2.4.2. El sistema realiza `GET /api/solicitudes` y retorna el listado filtrado por estado. El Administrador puede visualizar todas las solicitudes, pero solo tiene habilitada la acción Asignar. [RN-11]
- 2.4.3. El Administrador selecciona una solicitud sin oficial asignado y elige un Oficial del listado para asignarle la responsabilidad. [FA01] [RN-11]
- 2.4.4. El Oficial asignado da clic sobre su solicitud y elige la acción a ejecutar: Responder, Denegar o Prorrogar. Solo el Oficial asignado a esa solicitud tiene habilitadas estas opciones. [RN-11]
- 2.4.5. El Oficial redacta la respuesta, causal o motivo correspondiente según la acción elegida. [FA02] [FA03] [FA04]
- 2.4.6. El sistema actualiza el estado de la solicitud en `solicitudes_informacion` y envía notificación al ciudadano vía Brevo cuando aplica.
- 2.4.7. El sistema registra el evento correspondiente (`ASSIGN_SOL`, `RESPOND_SOL`, `DENY_SOL` o `PRORROGA_SOL`) en `registro_auditoria`. [RN-07]
- 2.4.8. Fin del flujo normal.

### 3. Flujos Alternos

**3.1. FA01 — Autoasignación por el Oficial:**
- 3.1.1. El Oficial visualiza una solicitud sin oficial asignado y da clic en el botón Asignar.
- 3.1.2. El sistema muestra el modal de asignación con el selector bloqueado al nombre del Oficial en sesión (`soloAutoAsignar=true`); solo el Administrador puede elegir a otro oficial distinto de sí mismo. [RN-11]
- 3.1.3. El Oficial confirma la autoasignación.
- 3.1.4. Fin del flujo alterno, continúa el flujo normal en el paso 2.4.4.

**3.2. FA02 — Responder solicitud:**
- 3.2.1. El Oficial asignado da clic en Responder sobre su solicitud.
- 3.2.2. El sistema muestra el formulario de respuesta con campo de texto (mínimo 20 caracteres) y opción de adjuntar documentos públicos existentes en el repositorio o en información de oficio.
- 3.2.3. El Oficial redacta la respuesta y da clic en Confirmar.
- 3.2.4. El sistema ejecuta `PUT /api/solicitudes/{id}/responder`, actualiza el estado a `RESPONDIDA` y envía el email al ciudadano vía Brevo.
- 3.2.5. Fin del flujo alterno.

**3.3. FA03 — Denegar solicitud:**
- 3.3.1. El Oficial asignado da clic en Denegar sobre su solicitud.
- 3.3.2. El sistema muestra el formulario de denegación con advertencia de irreversibilidad y campo de causal (mínimo 10 caracteres). [RN-02]
- 3.3.3. El Oficial ingresa la causal y confirma la denegación.
- 3.3.4. El sistema ejecuta `PUT /api/solicitudes/{id}/denegar`, actualiza el estado a `DENEGADA` y notifica al ciudadano.
- 3.3.5. Fin del flujo alterno.

**3.4. FA04 — Prorrogar solicitud:**
- 3.4.1. El Oficial asignado da clic en Prorrogar sobre su solicitud.
- 3.4.2. El sistema muestra el formulario de prórroga con campo de motivo (mínimo 10 caracteres).
- 3.4.3. El Oficial ingresa el motivo y confirma la prórroga.
- 3.4.4. El sistema ejecuta `PUT /api/solicitudes/{id}/prorrogar` y calcula la nueva fecha límite igual a la fecha límite actual más 10 días hábiles adicionales. Estado cambia a `PRORROGADA`.
- 3.4.5. Fin del flujo alterno.

**3.5. FA05 — Seguimiento de solicitud por el ciudadano:**
- 3.5.1. El ciudadano accede a `/seguimiento` e ingresa su código SOL-YYYY-NNNN.
- 3.5.2. El sistema realiza `GET /api/publico/solicitudes/{codigo}/seguimiento`.
- 3.5.3. El sistema retorna el estado actual, fechas relevantes y la respuesta si está disponible. El nombre del ciudadano se muestra parcialmente enmascarado (ej. "Juan P.").
- 3.5.4. Si el código no existe, el sistema muestra: "No se encontró el expediente [código]. Verifique que el código sea correcto."
- 3.5.5. Fin del flujo alterno.

**3.6. FA06 — Solicitud próxima a vencer:**
- 3.6.1. `PlazosScheduler` detecta, en su ejecución diaria (`@Scheduled(cron="0 0 13 * * *")`, 13:00 UTC = 7:00 AM Guatemala), que a una solicitud activa le quedan 3 días hábiles o menos para su `fecha_limite`. [RN-01]
- 3.6.2. El scheduler envía un correo electrónico al ciudadano solicitante mediante Brevo (`EmailService.alertaDia7()`).
- 3.6.3. En paralelo y de forma independiente, `NotificacionService` genera una notificación tipo `SOLICITUD_POR_VENCER` en la campanita del panel para Administrador y Oficial, calculada en cada consulta a `GET /api/admin/notificaciones` (sin depender del job diario, sin correo al personal).
- 3.6.4. Fin del flujo alterno.

**3.7. FA07 — Solicitud vencida:**
- 3.7.1. `PlazosScheduler` detecta que la `fecha_limite` de una solicitud activa ha sido superada sin respuesta registrada.
- 3.7.2. El sistema actualiza el estado de la solicitud a `VENCIDA` y registra el evento `VENCIMIENTO_SOL` en `registro_auditoria`. [RN-07] [RN-12]
- 3.7.3. La solicitud conserva exactamente las mismas acciones disponibles que cuando estaba activa: asignar (si no tiene oficial), responder, prorrogar y denegar (el oficial asignado). Solo cambia la etiqueta de estado visible. [RN-12]
- 3.7.4. El sistema genera una notificación tipo `SOLICITUD_VENCIDA` en la campanita para Administrador y Oficial.
- 3.7.5. Fin del flujo alterno, continúa con el paso 2.4.4 según corresponda.

### 4. Postcondiciones
- 4.1. La solicitud queda registrada en `solicitudes_informacion` con código SOL-YYYY-NNNN, `fecha_limite` calculada y estado actualizado.
- 4.2. El ciudadano recibe email de confirmación al presentar y al obtener resolución de su solicitud.
- 4.3. Todos los cambios de estado quedan registrados en `registro_auditoria` de forma inmutable. [RN-07]

---

## CU 2 — Registro y Clasificación Documental

**Versión**: 1.0 · **Fecha**: Septiembre 2026
**Autor**: Jackeline Nikole Sanchez Moscut

| Historial de Revisiones | | | |
|---|---|---|---|
| Nombre | Fecha | Descripción del cambio | Versión |
| Jackeline Sanchez | Sep. 2026 | Versión final, verificada contra código fuente | 1.0 |

### 1. Introducción

**1.1. Definición:**
Este caso de uso describe el proceso mediante el cual el personal municipal registra documentos oficiales en el repositorio SGDP con sus metadatos. Incluye la validación del formato PDF, la detección de contenido duplicado por hash, el cálculo de hash SHA-256 en backend al momento de la carga, el almacenamiento en Cloudflare R2, la generación de código correlativo DOC-YYYY-NNNN y el registro automático de auditoría. También cubre el ciclo de vida del documento: archivar, reactivar y subir una nueva versión con snapshot histórico en la tabla `versiones_documento`.

**1.2. Objetivo:**
Garantizar que todos los documentos del repositorio municipal cuenten con los metadatos obligatorios, con integridad verificable mediante SHA-256, trazabilidad completa de versiones y un ciclo de vida gestionado conforme a las políticas de acceso definidas.

### 2. Definición Caso de Uso

**2.1. Actores:**
- 2.1.1. Oficial de Información (Usuario Interno): Rol OFICIAL. Puede registrar documentos y gestionar el ciclo de vida: archivar, reactivar y subir nuevas versiones.
- 2.1.2. Administrador (Usuario Interno): Rol ADMINISTRADOR. Mismas capacidades que el Oficial.
- 2.1.3. Sistema Informático: `HashService`, `R2StorageService`, `FileValidatorService` y `AuditoriaService`.

> **Nota de verificación**: el rol FUNCIONARIO **no** tiene permiso para registrar, archivar, reactivar ni versionar documentos — solo tiene acceso de consulta y búsqueda (ver CU 3). Este es el comportamiento real (`DocumentosPage.tsx`: `puedeSubir = rol === 'ADMINISTRADOR' || rol === 'OFICIAL'`), a diferencia de versiones anteriores de este documento que listaban a Funcionario como capaz de registrar documentos.

**2.2. Precondiciones:**
- 2.2.1. El usuario debe estar autenticado con JWT válido y rol OFICIAL o ADMINISTRADOR.
- 2.2.2. El documento a registrar debe estar disponible en formato PDF. [RN-03]
- 2.2.3. Los metadatos obligatorios deben ser conocidos: título, categoría, fecha de emisión, unidad de origen y nivel de acceso. [RN-05]

**2.3. Flujo Normal Básico:**
- 2.3.1. El usuario interno accede a `/admin/documentos` con sesión autenticada.
- 2.3.2. El usuario da clic en el botón Nuevo Documento.
- 2.3.3. El sistema muestra el formulario de registro con los campos: título, categoría, fecha de emisión, unidad de origen, nivel de acceso (PÚBLICO o INTERNO), descripción opcional y selector de archivo PDF. [RN-05]
- 2.3.4. El usuario completa los metadatos obligatorios.
- 2.3.5. El usuario selecciona el archivo PDF desde su sistema de archivos local.
- 2.3.6. El sistema valida el tipo de archivo en el frontend antes de permitir el envío. [RN-03]
- 2.3.7. El usuario da clic en Guardar y el sistema envía la petición `POST /api/documentos` en formato `multipart/form-data`.
- 2.3.8. El backend valida los metadatos y el encabezado real del archivo mediante `FileValidatorService` (no solo la extensión o el MIME declarado). [RN-03] [RN-05]
- 2.3.9. El sistema calcula el hash SHA-256 del archivo mediante `HashService.sha256()`. [RN-10]
- 2.3.10. El sistema verifica que no exista ya un documento con el mismo hash (`documentoRepository.existsByHashSha256()`); si existe, rechaza la carga. [FA05]
- 2.3.11. El sistema sube el archivo a Cloudflare R2 mediante `R2StorageService.upload()`, con clave organizada por año/mes/código (`documentos/{año}/{mes}/{codigo}/{nombreArchivo}`).
- 2.3.12. El sistema genera el código correlativo DOC-YYYY-NNNN desde la tabla `secuencias_codigo` mediante `DocumentoService.generarCodigoDocumento()`, con bloqueo pesimista. [RN-06]
- 2.3.13. El sistema inserta el registro en la tabla `documentos` con los metadatos, el hash SHA-256 y el código DOC.
- 2.3.14. El sistema registra el evento `CREATE_DOC` en `registro_auditoria`. [RN-07]
- 2.3.15. El sistema retorna los datos del documento registrado; queda disponible de inmediato.
- 2.3.16. Fin del flujo normal.

### 3. Flujos Alternos

**3.1. FA01 — Archivo no es PDF:**
- 3.1.1. El archivo seleccionado no es un PDF válido (encabezado real verificado por `FileValidatorService`).
- 3.1.2. El sistema rechaza el archivo con un error de validación.
- 3.1.3. Fin del flujo alterno, continúa el flujo normal en el paso 2.3.5.

**3.2. FA02 — Fallo en Cloudflare R2:**
- 3.2.1. Se produce un error al intentar subir el archivo a R2.
- 3.2.2. La operación completa se revierte (`@Transactional`): el documento no se inserta en la base de datos, garantizando consistencia. No se genera código DOC para un documento que no llegó a persistirse.
- 3.2.3. Fin del flujo alterno.

**3.3. FA03 — Archivo supera el tamaño máximo:**
- 3.3.1. El archivo PDF supera el límite de **25 MB** configurado (`spring.servlet.multipart.max-file-size=25MB`).
- 3.3.2. El sistema rechaza la carga indicando que el archivo supera el tamaño máximo permitido.
- 3.3.3. Fin del flujo alterno, continúa el flujo normal en el paso 2.3.5.

**3.4. FA04 — Archivar / Reactivar documento:**
- 3.4.1. El Oficial o Administrador da clic en Archivar sobre un documento con estado `VIGENTE`.
- 3.4.2. El sistema ejecuta `PATCH /api/documentos/{id}/archivar`, actualiza el estado a `ARCHIVADO` y registra el evento `ARCHIVE_DOC` en `registro_auditoria`. [RN-07]
- 3.4.3. El documento deja de aparecer en los resultados de búsqueda pública.
- 3.4.4. Para reactivar, el Oficial o Administrador da clic en Reactivar sobre un documento `ARCHIVADO`: el sistema ejecuta `PATCH /api/documentos/{id}/reactivar`, actualiza el estado a `VIGENTE` y registra `REACTIVATE_DOC`. [RN-07]
- 3.4.5. Fin del flujo alterno.

**3.5. FA05 — Documento duplicado por contenido:**
- 3.5.1. El hash SHA-256 del archivo a registrar coincide con el de un documento ya existente en el repositorio.
- 3.5.2. El sistema rechaza la operación con el mensaje "Ya existe un documento con contenido idéntico" antes de subir el archivo a R2 o generar código.
- 3.5.3. Fin del flujo alterno, continúa el flujo normal en el paso 2.3.5.

**3.6. FA06 — Nueva versión documental:**
- 3.6.1. El Oficial o Administrador da clic en Subir nueva versión sobre un documento existente.
- 3.6.2. El sistema muestra el formulario para seleccionar el nuevo archivo PDF y un campo de motivo del cambio.
- 3.6.3. El usuario selecciona el nuevo PDF, ingresa el motivo y confirma.
- 3.6.4. El sistema ejecuta `POST /api/documentos/{id}/nueva-version` en formato multipart.
- 3.6.5. El backend guarda un snapshot del archivo actual en la tabla `versiones_documento` con su hash SHA-256 histórico, incrementa el campo `version_actual`, sube el nuevo PDF a R2 y calcula el nuevo hash SHA-256. [RN-10]
- 3.6.6. El sistema registra el evento `VERSION_DOC` en `registro_auditoria`. [RN-07]
- 3.6.7. El historial completo de versiones es accesible mediante `GET /api/documentos/{id}/versiones`.
- 3.6.8. Fin del flujo alterno.

### 4. Postcondiciones
- 4.1. El documento queda almacenado en Cloudflare R2 con su hash SHA-256 registrado en la base de datos para verificación en cada descarga. [RN-10]
- 4.2. El documento es visible en el panel de administración con su código DOC-YYYY-NNNN y el estado `VIGENTE`.
- 4.3. Todos los eventos quedan en `registro_auditoria` de forma inmutable. [RN-07]

---

## CU 3 — Búsqueda y Recuperación de Documentos

**Versión**: 1.0 · **Fecha**: Septiembre 2026
**Autor**: Jackeline Nikole Sanchez Moscut

| Historial de Revisiones | | | |
|---|---|---|---|
| Nombre | Fecha | Descripción del cambio | Versión |
| Jackeline Sanchez | Sep. 2026 | Versión final, verificada contra código fuente | 1.0 |

### 1. Introducción

**1.1. Definición:**
Este caso de uso describe el proceso de búsqueda y descarga de documentos del repositorio SGDP. La búsqueda se realiza mediante JPA Specifications con coincidencia de subcadena (`LIKE '%término%'`) sobre los campos título, descripción, código, nombre de archivo y unidad de origen — no es búsqueda de texto completo tokenizada (`tsvector`). Los resultados se filtran automáticamente según el nivel de acceso: los usuarios sin autenticación únicamente ven documentos con nivel PÚBLICO, mientras que los usuarios autenticados con cualquier rol (incluido Funcionario) pueden acceder también a documentos INTERNOS. Cada descarga autenticada se verifica con SHA-256 y queda registrada en auditoría.

**1.2. Objetivo:**
Proveer un mecanismo de búsqueda eficiente y seguro que garantice el acceso diferenciado por nivel de acceso, la integridad de cada documento descargado mediante verificación SHA-256, y la trazabilidad de las operaciones de descarga por usuarios autenticados.

### 2. Definición Caso de Uso

**2.1. Actores:**
- 2.1.1. Ciudadano (Usuario Externo): Accede a la búsqueda pública sin autenticación. Solo puede ver y descargar documentos con nivel PÚBLICO.
- 2.1.2. Funcionario / Oficial / Administrador (Usuario Interno): Accede a la búsqueda interna autenticado con JWT. Puede ver documentos PÚBLICOS e INTERNOS, de solo lectura.
- 2.1.3. Sistema Informático: Aplica el filtro de nivel de acceso, verifica hash SHA-256 en cada descarga autenticada y registra dichos accesos en auditoría.

**2.2. Precondiciones:**
- 2.2.1. El sistema debe estar operativo con documentos registrados en PostgreSQL 16.
- 2.2.2. Para acceder a documentos INTERNOS: el usuario debe estar autenticado con JWT válido.

**2.3. Flujo Normal Básico:**
- 2.3.1. El usuario accede a `/buscar` (portal público) o `/admin/documentos` (panel interno con JWT).
- 2.3.2. El usuario ingresa el término de búsqueda en el campo correspondiente (ej. "presupuesto").
- 2.3.3. El sistema construye la consulta mediante `DocumentoSpecifications.texto(q)`, dividiendo el término en palabras y exigiendo que cada una aparezca en alguno de los campos indexados.
- 2.3.4. El sistema aplica automáticamente el filtro de nivel de acceso: sin token JWT, únicamente documentos con nivel PÚBLICO; con JWT válido, documentos PÚBLICOS e INTERNOS. [RN-04]
- 2.3.5. El sistema ejecuta la consulta paginada mediante `DocumentoRepository` con `Specification.and()`.
- 2.3.6. El sistema retorna la lista de documentos encontrados con los campos: título, categoría, fecha de emisión, unidad de origen y código.
- 2.3.7. El usuario visualiza los resultados y da clic en Descargar sobre el documento seleccionado.
- 2.3.8. El sistema ejecuta `GET /api/publico/documentos/{id}/descargar` (público) o `GET /api/documentos/{id}/descargar` (interno, con verificación).
- 2.3.9. En la ruta interna, el sistema verifica que el hash SHA-256 del contenido obtenido desde R2 coincida con el hash almacenado en la base de datos, mediante `DocumentoService.descargarConVerificacion()`. [RN-10] [FA03]
- 2.3.10. El sistema retorna el stream del PDF para su descarga en el navegador.
- 2.3.11. En la ruta interna, el sistema registra el evento `DOWNLOAD_DOC` en `registro_auditoria`. [RN-07]
- 2.3.12. Fin del flujo normal.

### 3. Flujos Alternos

**3.1. FA01 — Sin resultados:**
- 3.1.1. Ningún documento del repositorio coincide con el término de búsqueda ingresado.
- 3.1.2. El sistema retorna una lista vacía con el mensaje: "No se encontraron documentos para su búsqueda."
- 3.1.3. Fin del flujo alterno.

**3.2. FA02 — Descarga sin autorización:**
- 3.2.1. Un usuario sin autenticación intenta descargar un documento con nivel de acceso INTERNO. [RN-04]
- 3.2.2. El sistema rechaza la descarga.
- 3.2.3. Fin del flujo alterno.

**3.3. FA03 — Fallo de integridad SHA-256:**
- 3.3.1. El hash SHA-256 calculado del contenido descargado desde R2 no coincide con el hash almacenado en la base de datos. [RN-10]
- 3.3.2. El sistema aborta la descarga, registra el evento `INTEGRITY_FAIL` en `registro_auditoria` con el código del documento afectado, y responde con un mensaje indicando que el archivo fue modificado en almacenamiento y debe reportarse al Administrador. [RN-07]
- 3.3.3. Fin del flujo alterno.

### 4. Postcondiciones
- 4.1. Los resultados presentados respetan en todo momento el filtro de nivel de acceso según el contexto del usuario. [RN-04]
- 4.2. Cada descarga interna exitosa queda registrada en `registro_auditoria` con timestamp, usuario y documento identificados. [RN-07]
- 4.3. Cualquier fallo de integridad SHA-256 queda registrado como `INTEGRITY_FAIL` para trazabilidad. [RN-10]

---

## CU 4 — Gestión de Usuarios y Control de Acceso

**Versión**: 1.0 · **Fecha**: Septiembre 2026
**Autor**: Jackeline Nikole Sanchez Moscut

| Historial de Revisiones | | | |
|---|---|---|---|
| Nombre | Fecha | Descripción del cambio | Versión |
| Jackeline Sanchez | Sep. 2026 | Versión final, verificada contra código fuente | 1.0 |

### 1. Introducción

**1.1. Definición:**
Este caso de uso describe la gestión del ciclo de vida de cuentas del personal municipal por parte del Administrador: crear, modificar, activar/desactivar, restablecer contraseña y desbloquear cuentas. Implementa controles de seguridad: bloqueo automático tras 3 intentos de inicio de sesión fallidos durante 15 minutos (con desbloqueo manual disponible para el Administrador), historial de las últimas 3 contraseñas para prevenir reutilización, cambio forzado de contraseña en el primer acceso y cifrado de contraseñas con BCrypt.

**1.2. Objetivo:**
Administrar de forma centralizada el acceso al sistema SGDP, garantizando que únicamente el personal municipal autorizado pueda ingresar, con controles de seguridad alineados a OWASP Top 10 2021 para la gestión de autenticación y autorización.

### 2. Definición Caso de Uso

**2.1. Actores:**
- 2.1.1. Administrador (Usuario Interno): Responsable de la creación, modificación, activación/desactivación y desbloqueo de cuentas de usuario.
- 2.1.2. Cualquier usuario interno: Realiza el inicio de sesión y el cambio de contraseña; su cuenta puede bloquearse y desbloquearse automáticamente por tiempo transcurrido.
- 2.1.3. Sistema Informático: `BCryptPasswordEncoder`, `UsuarioService`, `AuditoriaService`.

**2.2. Precondiciones:**
- 2.2.1. El Administrador debe estar autenticado con JWT válido y rol ADMINISTRADOR para gestionar cuentas.
- 2.2.2. Para crear un nuevo usuario: el nombre de usuario no debe existir previamente en la base de datos. [RN-08]

**2.3. Flujo Normal Básico — Crear Usuario:**
- 2.3.1. El Administrador accede a `/admin/usuarios` con sesión autenticada.
- 2.3.2. El sistema realiza `GET /api/usuarios` y presenta el listado del personal con la opción "Incluir inactivos".
- 2.3.3. El Administrador da clic en el botón Nuevo Usuario.
- 2.3.4. El sistema muestra el formulario de creación con los campos: nombre completo, nombre de usuario (mínimo 4 caracteres, debe iniciar con letra), correo electrónico (opcional), contraseña (mínimo 8 caracteres), rol y unidad municipal (opcional).
- 2.3.5. El Administrador completa el formulario y da clic en Guardar.
- 2.3.6. El sistema ejecuta `POST /api/usuarios` y valida la unicidad del nombre de usuario y el cumplimiento de los requisitos de contraseña. [RN-08]
- 2.3.7. El sistema genera el hash BCrypt de la contraseña. [RN-08]
- 2.3.8. El sistema inserta el registro en la tabla `usuarios` con el campo `requiere_cambio_contrasena = true`. [RN-09]
- 2.3.9. El sistema registra el evento `CREATE_USER` en `registro_auditoria`. [RN-07]
- 2.3.10. El sistema retorna los datos del usuario creado sin incluir la contraseña.
- 2.3.11. El Administrador comparte las credenciales temporales con el nuevo funcionario por canal seguro.
- 2.3.12. Fin del flujo normal.

**2.4. Flujo Normal Básico — Inicio de Sesión con Control de Bloqueo:**
- 2.4.1. El usuario interno accede a `/admin/login` e ingresa su nombre de usuario y contraseña.
- 2.4.2. El sistema ejecuta `POST /api/auth/login` con las credenciales proporcionadas.
- 2.4.3. El sistema verifica si el campo `bloqueado_hasta` es posterior al momento actual, comparado siempre en UTC explícito (`LocalDateTime.now(ZoneOffset.UTC)`, independiente de la zona configurada en el servidor). Si lo es, retorna el mensaje "Cuenta bloqueada temporalmente. Intente nuevamente después de las [hora convertida a Guatemala]." [RN-08] [FA04]
- 2.4.4. Si la cuenta no está bloqueada, el sistema compara la contraseña ingresada con el hash BCrypt almacenado.
- 2.4.5. Si la contraseña es correcta, el sistema reinicia `intentos_fallidos = 0`, actualiza `ultimo_acceso` y genera un JWT con expiración de 8 horas.
- 2.4.6. Si la contraseña es incorrecta, el sistema incrementa `intentos_fallidos` mediante `UsuarioService.registrarIntentoFallido()`, ejecutado en una transacción independiente (`@Transactional(propagation = REQUIRES_NEW)`) para que el contador persista aunque `login()` termine lanzando una excepción y haciendo rollback de su propia transacción. Si `intentos_fallidos` llega a 3, establece `bloqueado_hasta = now(UTC) + 15 minutos`. [RN-08] [FA04]
- 2.4.7. Si el campo `requiere_cambio_contrasena` es verdadero, el frontend redirige al usuario a `/admin/cambiar-contrasena` antes de permitir cualquier otra operación. [RN-09]
- 2.4.8. El sistema registra el evento `LOGIN_EXITOSO` o `LOGIN_FALLIDO` en `registro_auditoria`. [RN-07]
- 2.4.9. Fin del flujo normal.

### 3. Flujos Alternos

**3.1. FA01 — Nombre de usuario ya registrado:**
- 3.1.1. El nombre de usuario ingresado ya existe en la tabla `usuarios`.
- 3.1.2. El sistema retorna un error de validación indicando que el nombre de usuario ya está en uso.
- 3.1.3. Fin del flujo alterno, continúa el flujo normal en el paso 2.3.5.

**3.2. FA02 — Contraseña en historial:**
- 3.2.1. La nueva contraseña ingresada coincide con alguna de las últimas 3 contraseñas almacenadas en `historial_contrasenas`, o es igual a la contraseña actual. [RN-08]
- 3.2.2. El sistema rechaza el cambio indicando que no puede reutilizar sus últimas 3 contraseñas.
- 3.2.3. Fin del flujo alterno.

**3.3. FA03 — Desbloqueo manual por el Administrador:**
- 3.3.1. Antes de que transcurran los 15 minutos, el Administrador localiza la cuenta bloqueada en `/admin/usuarios` (indicador visible junto al usuario).
- 3.3.2. El Administrador da clic en Desbloquear cuenta.
- 3.3.3. El sistema ejecuta `PUT /api/usuarios/{id}/desbloquear`, valida que la cuenta siga realmente bloqueada, y establece `bloqueado_hasta = null` e `intentos_fallidos = 0`.
- 3.3.4. Si la cuenta ya no estaba bloqueada, el sistema responde: "La cuenta no está bloqueada."
- 3.3.5. Si el desbloqueo procede, el sistema registra el evento `DESBLOQUEO_CUENTA` en `registro_auditoria`. [RN-07]
- 3.3.6. Fin del flujo alterno.

**3.4. FA04 — Cuenta bloqueada por intentos fallidos:**
- 3.4.1. El usuario realiza el tercer intento de inicio de sesión fallido con el mismo nombre de usuario.
- 3.4.2. El sistema establece `bloqueado_hasta = now(UTC) + 15 minutos` y registra el evento `CUENTA_BLOQUEADA` en `registro_auditoria`. [RN-08] [RN-07]
- 3.4.3. A partir del cuarto intento, el sistema responde con el mensaje de bloqueo temporal, con la hora convertida a horario de Guatemala.
- 3.4.4. Fin del flujo alterno. La cuenta se desbloquea automáticamente al transcurrir los 15 minutos, o manualmente por el Administrador (FA03).

### 4. Postcondiciones
- 4.1. El nuevo usuario queda registrado con contraseña cifrada en BCrypt y el flag de cambio forzado activo. [RN-08] [RN-09]
- 4.2. Todos los eventos de gestión de usuarios y de autenticación quedan registrados en `registro_auditoria`. [RN-07]
- 4.3. El acceso al sistema queda restringido al personal autorizado con controles de bloqueo/desbloqueo y renovación de contraseña operativos. [RN-08]

---

## CU 5 — Publicación de Información de Oficio

**Versión**: 1.0 · **Fecha**: Septiembre 2026
**Autor**: Jackeline Nikole Sanchez Moscut

| Historial de Revisiones | | | |
|---|---|---|---|
| Nombre | Fecha | Descripción del cambio | Versión |
| Jackeline Sanchez | Sep. 2026 | Versión final, verificada contra código fuente | 1.0 |

### 1. Introducción

**1.1. Definición:**
Este caso de uso describe la gestión de la información que la Municipalidad de San Raymundo debe publicar de oficio conforme al Artículo 10 del Decreto 57-2008 (LAIP). Organiza el contenido en una jerarquía de tres niveles bajo la sección: Sección (7 tipos legales fijos) → Categoría → Carpeta → Documentos PDF. La sección LAIP cuenta con 29 categorías fijas numeradas conforme al artículo 10; las demás secciones tienen categorías configurables. El contenido publicado es inmediatamente visible en el portal ciudadano sin necesidad de autenticación.

**1.2. Objetivo:**
Garantizar el cumplimiento del Artículo 10 del Decreto 57-2008 mediante la publicación sistemática y oportuna de la información de oficio de la Municipalidad, manteniendo el portal ciudadano actualizado y alertando al personal cuando alguna carpeta supere los 25 días sin nuevas publicaciones.

### 2. Definición Caso de Uso

**2.1. Actores:**
- 2.1.1. Oficial de Información (Usuario Interno): Rol OFICIAL. Actor principal responsable de la publicación y mantenimiento de la información de oficio.
- 2.1.2. Administrador (Usuario Interno): Rol ADMINISTRADOR. Tiene las mismas capacidades que el Oficial para publicar y gestionar.
- 2.1.3. Sistema Informático: Sirve el contenido publicado al portal ciudadano y calcula la desactualización de carpetas.

**2.2. Precondiciones:**
- 2.2.1. El Oficial o Administrador debe estar autenticado con JWT válido.
- 2.2.2. Para subir un documento a una carpeta: la carpeta debe existir previamente en la tabla `carpeta_oficio`.
- 2.2.3. El documento a publicar debe estar en formato PDF. [RN-03]

**2.3. Flujo Normal Básico:**
- 2.3.1. El Oficial accede a `/admin/oficio` con sesión autenticada.
- 2.3.2. El sistema realiza `GET /api/admin/oficio/categorias` y despliega las 7 secciones de transparencia con sus categorías.
- 2.3.3. El Oficial selecciona la sección correspondiente (ej. LAIP) y la categoría (ej. Categoría 1 — Estructura Orgánica).
- 2.3.4. El Oficial selecciona una carpeta existente o crea una nueva mediante `POST /api/admin/oficio/categorias/{catId}/carpetas`. [FA01]
- 2.3.5. El Oficial da clic en Subir Documento dentro de la carpeta seleccionada.
- 2.3.6. El sistema muestra el formulario de carga con selector de archivo PDF y campo de descripción opcional.
- 2.3.7. El Oficial selecciona el archivo PDF y opcionalmente ingresa una descripción.
- 2.3.8. El sistema ejecuta `POST /api/admin/oficio/carpetas/{carpetaId}/documentos` en formato multipart. [RN-03]
- 2.3.9. El backend valida el formato PDF, calcula el hash SHA-256 y sube el archivo a Cloudflare R2.
- 2.3.10. El sistema inserta el registro en la tabla `documento_oficio` con referencia a la carpeta correspondiente.
- 2.3.11. El sistema registra el evento `PUBLISH_OFICIO` en `registro_auditoria`, con el usuario, la IP de origen y el documento publicado. [RN-07]
- 2.3.12. El sistema retorna éxito y el documento queda disponible de inmediato en el portal ciudadano `/informacion-publica`.
- 2.3.13. Fin del flujo normal.

> **Nota de verificación**: a diferencia del registro de documentos del repositorio (CU 2), donde la auditoría se invoca desde `DocumentoService`, en información de oficio la llamada a `AuditoriaService` vive en `OficioAdminController` (no en `OficioAdminService`) — mismo resultado final, distinta capa. Crear/editar/eliminar categoría, carpeta o documento quedan todos registrados con `PUBLISH_OFICIO` o `UPDATE_CAT`. Lo único que no se audita es la descarga pública anónima (ver CU 0), por diseño.

### 3. Flujos Alternos

**3.1. FA01 — Crear nueva carpeta:**
- 3.1.1. La categoría seleccionada no cuenta con carpetas existentes o el Oficial desea crear una nueva.
- 3.1.2. El Oficial da clic en Nueva Carpeta, ingresa el nombre y descripción opcional, y confirma.
- 3.1.3. El sistema ejecuta `POST /api/admin/oficio/categorias/{catId}/carpetas` y crea la carpeta dentro de la categoría seleccionada.
- 3.1.4. Fin del flujo alterno, continúa el flujo normal en el paso 2.3.5.

**3.2. FA02 — Alerta de contenido desactualizado:**
- 3.2.1. `CarpetaOficioRepository.findCarpetasDesactualizadas()` detecta que una o más carpetas llevan más de 25 días sin recibir nuevos documentos.
- 3.2.2. El sistema muestra una alerta colapsable en el DashboardPage con el listado de carpetas afectadas. [RF-14]
- 3.2.3. `NotificacionService` genera una notificación de tipo `OFICIO_DESACTUALIZADO` en la campanita del panel para Administrador y Oficial. No se envía correo electrónico por este evento.
- 3.2.4. Fin del flujo alterno.

**3.3. FA03 — FUNCIONARIO intenta publicar:**
- 3.3.1. Un usuario con rol FUNCIONARIO intenta invocar los endpoints de escritura de información de oficio (crear categoría, carpeta o documento).
- 3.3.2. El sistema rechaza el acceso. Los botones de publicación no son visibles en la interfaz para este rol; Funcionario sí puede consultar (`GET`) el contenido publicado.
- 3.3.3. Fin del flujo alterno.

### 4. Postcondiciones
- 4.1. El documento PDF publicado queda disponible de forma inmediata en el portal ciudadano `/informacion-publica` bajo la categoría y carpeta correspondientes.
- 4.2. Las carpetas con más de 25 días sin actualización generan alertas visibles para el personal responsable (Dashboard y campanita). [RF-14]
- 4.3. Toda creación, edición o eliminación de categoría, carpeta o documento de oficio queda registrada en `registro_auditoria`. [RN-07]

---

## CU 6 — Registro de Auditoría y Trazabilidad

**Versión**: 1.0 · **Fecha**: Septiembre 2026
**Autor**: Jackeline Nikole Sanchez Moscut

| Historial de Revisiones | | | |
|---|---|---|---|
| Nombre | Fecha | Descripción del cambio | Versión |
| Jackeline Sanchez | Sep. 2026 | Versión final, verificada contra código fuente | 1.0 |

### 1. Introducción

**1.1. Definición:**
Este caso de uso describe el mecanismo de registro automático de eventos significativos del sistema SGDP en una tabla APPEND-ONLY protegida a nivel de base de datos mediante permisos revocados. Provee al Administrador una interfaz de consulta con filtros y exportación en formato CSV y PDF. El log es un requisito de trazabilidad y rendición de cuentas conforme a ISO 30300:2020.

**1.2. Objetivo:**
Garantizar la trazabilidad completa e inmutable de las operaciones del sistema que sí están instrumentadas, permitiendo la auditoría de cada acción registrada, su autor, el momento en que ocurrió y el resultado obtenido.

### 2. Definición Caso de Uso

**2.1. Actores:**
- 2.1.1. Sistema Informático: Actor principal. El registro de auditoría es automático; `AuditoriaService` es invocado desde los servicios de autenticación, usuarios, documentos y solicitudes.
- 2.1.2. Administrador (Usuario Interno): Único rol con acceso de lectura al módulo de auditoría y exportación de reportes.

**2.2. Precondiciones:**
- 2.2.1. `AuditoriaService` debe estar inyectado en los servicios que ejecutan operaciones auditables.
- 2.2.2. El usuario ejecutante debe ser identificado vía `SecurityContext`/parámetro explícito, nunca desde un campo de `usuario_id` enviado libremente en el cuerpo de la petición.
- 2.2.3. La migración Flyway **V9** (`V9__ciclo_vida_sha256_seguridad.sql`) debe haberse ejecutado correctamente (`REVOKE UPDATE, DELETE ON TABLE registro_auditoria FROM sgdp_app`).

**2.3. Flujo Normal Básico — Registro automático:**
- 2.3.1. Un servicio instrumentado (`AuthService`, `UsuarioService`, `DocumentoService`, `SolicitudService`, `ReporteAdminController`) completa o falla una operación relevante.
- 2.3.2. El servicio invoca `AuditoriaService.registrarExito()` o `registrarFallo()` con el tipo de acción (`TipoAccion`), el actor, la IP de origen y una descripción.
- 2.3.3. El sistema ejecuta `INSERT INTO registro_auditoria` con los campos: `timestamp_utc` (como `Instant`, UTC real), `usuario_id`, `usuario_desc`, `ip_origen`, `accion`, `objeto_tipo`, `objeto_id`, `objeto_desc`, `resultado` y `detalle`.
- 2.3.4. La base de datos garantiza la inmutabilidad del registro: ningún proceso puede ejecutar UPDATE o DELETE sobre `registro_auditoria` gracias al REVOKE aplicado en la migración V9. [RN-07]
- 2.3.5. La escritura de auditoría corre en una transacción independiente (`@Transactional(propagation = REQUIRES_NEW)`), por lo que el registro persiste incluso si la operación que lo originó falla y hace rollback de su propia transacción.
- 2.3.6. Fin del flujo normal.

**2.4. Flujo Normal Básico — Consulta y exportación por el Administrador:**
- 2.4.1. El Administrador accede a `/admin/auditoria` con sesión autenticada. Solo el rol ADMINISTRADOR puede acceder a este módulo. [RN-07]
- 2.4.2. El Administrador configura los filtros: tipo de acción y rango de fechas.
- 2.4.3. El sistema ejecuta `GET /api/admin/auditoria` con los filtros indicados y retorna el listado paginado de eventos.
- 2.4.4. El Administrador puede dar clic en Ver detalle sobre un evento para visualizar el campo `detalle` en formato JSON.
- 2.4.5. El Administrador exporta el listado en CSV o PDF desde el módulo Reportes (ver CU 7).
- 2.4.6. Fin del flujo normal.

### 3. Flujos Alternos

**3.1. FA01 — Intento de DELETE en registro_auditoria:**
- 3.1.1. Cualquier usuario o proceso del sistema intenta ejecutar `DELETE FROM registro_auditoria` directamente sobre la base de datos.
- 3.1.2. La base de datos rechaza la operación por permisos insuficientes del usuario de aplicación `sgdp_app`.
- 3.1.3. Fin del flujo alterno. La integridad del log queda garantizada. [RN-07]

**3.2. FA02 — Operación principal fallida:**
- 3.2.1. Un servicio lanza una excepción antes de completar la operación y realiza rollback de su transacción principal.
- 3.2.2. `AuditoriaService.registrarFallo()` se ejecuta en su propia transacción `REQUIRES_NEW`, garantizando que el evento de fallo persista en el log aunque la operación principal haya fallado. [RN-07]
- 3.2.3. Fin del flujo alterno.

**3.3. FA03 — Acceso no autorizado al módulo de auditoría:**
- 3.3.1. Un usuario con rol OFICIAL o FUNCIONARIO intenta acceder a `/admin/auditoria` o a `/api/admin/auditoria`.
- 3.3.2. El sistema rechaza el acceso. El módulo de auditoría no es visible en el menú para estos roles. [RN-07]
- 3.3.3. Fin del flujo alterno.

### 4. Postcondiciones
- 4.1. Cada operación auditada del sistema queda registrada con todos los campos requeridos en `registro_auditoria` de forma inmutable. [RN-07]
- 4.2. El Administrador puede consultar, filtrar y exportar el historial de eventos registrados.
- 4.3. Los eventos de fallo quedan registrados de forma independiente, garantizando trazabilidad incluso ante fallos del sistema. [RN-07]

---

## CU 7 — Generación de Reportes de Cumplimiento

**Versión**: 1.0 · **Fecha**: Septiembre 2026
**Autor**: Jackeline Nikole Sanchez Moscut

| Historial de Revisiones | | | |
|---|---|---|---|
| Nombre | Fecha | Descripción del cambio | Versión |
| Jackeline Sanchez | Sep. 2026 | Versión final, verificada contra código fuente | 1.0 |

### 1. Introducción

**1.1. Definición:**
Este caso de uso describe el acceso del Oficial de Información y del Administrador a un panel de control (dashboard) con métricas de cumplimiento en tiempo real, al centro de notificaciones internas, y a la generación de reportes exportables en formato CSV y PDF para tres fuentes de datos: solicitudes de información pública, repositorio documental y registro de auditoría. El dashboard incluye indicadores de solicitudes por estado, cumplimiento LAIP (categorías con contenido publicado sobre 29) y metas por módulo configurables.

**1.2. Objetivo:**
Proveer al personal municipal las herramientas de análisis y reportería necesarias para evaluar el cumplimiento de la Ley de Acceso a la Información Pública, identificar solicitudes y publicaciones en riesgo de incumplimiento, y generar evidencia documental del desempeño institucional.

### 2. Definición Caso de Uso

**2.1. Actores:**
- 2.1.1. Oficial de Información (Usuario Interno): Actor principal. Accede al dashboard, a la campanita de notificaciones y puede exportar reportes de solicitudes y documentos.
- 2.1.2. Administrador (Usuario Interno): Mismas capacidades que el Oficial, además puede editar las metas por módulo y exportar el reporte de auditoría.
- 2.1.3. Sistema Informático: Calcula métricas mediante consultas agregadas y genera los archivos de exportación.

**2.2. Precondiciones:**
- 2.2.1. El usuario debe estar autenticado con JWT válido y rol OFICIAL o ADMINISTRADOR (el Dashboard también es visible para FUNCIONARIO).
- 2.2.2. Deben existir datos registrados en las tablas `solicitudes_informacion` y `documentos`.

**2.3. Flujo Normal Básico — Dashboard:**
- 2.3.1. El Oficial accede a `/admin/dashboard` con sesión autenticada.
- 2.3.2. El sistema realiza `GET /api/admin/dashboard` y retorna las estadísticas: solicitudes por estado, total de documentos, porcentaje de cumplimiento LAIP y carpetas de oficio desactualizadas. [RF-18]
- 2.3.3. El sistema realiza `GET /api/admin/dashboard/metas` y retorna las metas configuradas por módulo con su porcentaje de cumplimiento actual desde la tabla `metas_cumplimiento`. [RF-18]
- 2.3.4. El Oficial visualiza las tarjetas con métricas y las barras de progreso de metas por módulo.
- 2.3.5. El Administrador puede actualizar el valor de una meta dando clic en el ícono de edición y confirmando el nuevo valor.
- 2.3.6. Fin del flujo normal.

**2.4. Flujo Normal Básico — Exportación de Reportes:**
- 2.4.1. El Oficial o Administrador da clic en la sección Reportes del menú y accede a `/admin/reportes`.
- 2.4.2. El sistema muestra las tarjetas de reporte disponibles según el rol: Solicitudes de Información y Repositorio Documental (visibles para OFICIAL y ADMINISTRADOR); Registro de Auditoría (visible únicamente para ADMINISTRADOR). [RN-07] [RF-17]
- 2.4.3. El usuario da clic en Exportar CSV o Exportar PDF en la tarjeta de su interés.
- 2.4.4. `ReporteAdminController` genera el archivo solicitado mediante OpenCSV (CSV) o iText (PDF) y lo envía al navegador del usuario para descarga. [RF-17]
- 2.4.5. El sistema registra el evento `EXPORT_REPORT` (solicitudes o documentos) o `EXPORT_LOG` (auditoría) en `registro_auditoria`. [RN-07]
- 2.4.6. Fin del flujo normal.

### 3. Flujos Alternos

**3.1. FA01 — Sin datos en el período:**
- 3.1.1. No existen registros en la base de datos para el período o filtros seleccionados.
- 3.1.2. El dashboard muestra ceros en los indicadores correspondientes.
- 3.1.3. Fin del flujo alterno.

**3.2. FA02 — FUNCIONARIO intenta acceder a Reportes:**
- 3.2.1. Un usuario con rol FUNCIONARIO intenta acceder a `/admin/reportes` (Dashboard sí le es accesible).
- 3.2.2. El sistema rechaza el acceso. El módulo de reportes no es visible en el menú para este rol.
- 3.2.3. Fin del flujo alterno.

**3.3. FA03 — Centro de notificaciones:**
- 3.3.1. El Administrador u Oficial da clic en el ícono de campanita en la barra superior (visible únicamente para estos dos roles).
- 3.3.2. El sistema consulta `GET /api/admin/notificaciones` y despliega los eventos vigentes: solicitudes por vencer (`SOLICITUD_POR_VENCER`), solicitudes vencidas (`SOLICITUD_VENCIDA`) y carpetas de oficio desactualizadas (`OFICIO_DESACTUALIZADO`). La consulta se refresca cada 60 segundos.
- 3.3.3. El usuario da clic sobre una notificación y el sistema navega directamente a `/admin/solicitudes` o `/admin/oficio` según corresponda.
- 3.3.4. Fin del flujo alterno.

### 4. Postcondiciones
- 4.1. El Oficial y el Administrador cuentan con métricas actualizadas para la toma de decisiones sobre el cumplimiento LAIP.
- 4.2. Cada exportación de reporte queda registrada como `EXPORT_REPORT` o `EXPORT_LOG` en `registro_auditoria`. [RN-07]
- 4.3. El acceso al reporte de auditoría y al módulo de Reportes en general queda restringido a OFICIAL y ADMINISTRADOR, con la exportación de auditoría exclusiva del Administrador. [RN-07]

---

## CU 8 — Reglas de Negocio Consolidadas

**Versión**: 1.0 · **Fecha**: Septiembre 2026
**Autor**: Jackeline Nikole Sanchez Moscut

| Historial de Revisiones | | | |
|---|---|---|---|
| Nombre | Fecha | Descripción del cambio | Versión |
| Jackeline Sanchez | Sep. 2026 | Versión final, verificada contra código fuente | 1.0 |

### 1. Introducción

**1.1. Definición:**
Este caso de uso consolida todas las reglas de negocio (RN-01 a RN-12) que gobiernan el funcionamiento del sistema SGDP, garantizando coherencia operativa, seguridad, validaciones técnicas y cumplimiento normativo en todos los módulos. Las reglas se aplican en dos capas: validación en el frontend mediante Zod (TypeScript) y validación de negocio en el backend mediante Spring Services y Jakarta Bean Validation.

**1.2. Objetivo:**
Centralizar y formalizar las reglas que regulan todos los procesos del sistema, permitiendo su referencia desde los demás casos de uso mediante identificador único (RN-XX) para asegurar trazabilidad, control normativo y mantenibilidad.

### 2. Definición Caso de Uso

**2.1. Actores:**
- 2.1.1. Sistema Informático: Actor principal. Aplica todas las reglas automáticamente en cada operación.
- 2.1.2. Todos los roles y el ciudadano: Receptores del efecto de cada regla según corresponda.

**2.2. Precondiciones:**
- 2.2.1. El sistema SGDP debe estar desplegado con las migraciones Flyway V1 a V11 aplicadas correctamente.
- 2.2.2. `AuditoriaService` debe estar disponible e inyectado en los servicios que auditan (autenticación, usuarios, documentos, solicitudes, reportes).
- 2.2.3. El contexto de seguridad de Spring debe estar activo en cada petición HTTP autenticada para la identificación del usuario ejecutante.

### 3. Catálogo de Reglas de Negocio

**RN-01 — Plazo LAIP (10 días hábiles)**
El sistema garantiza que el plazo máximo de respuesta a una solicitud sea de 10 días hábiles desde la fecha de recepción, conforme al Artículo 42 del Decreto 57-2008. El cálculo excluye feriados guatemaltecos fijos, Semana Santa (Meeus/Jones/Butcher) y el 29 de junio. Cuando restan 3 días hábiles o menos, el sistema envía un correo al ciudadano (job diario) y una notificación interna al personal (consulta bajo demanda).
- Implementación: `DiasHabilesService.calcularFechaLimite()` · `PlazosScheduler` (13:00 UTC) · `NotificacionService`

**RN-02 — Causal de denegación obligatoria**
Toda denegación de solicitud debe estar fundamentada con una causal de al menos 10 caracteres. Sin este campo, el sistema rechaza la operación. La advertencia de irreversibilidad se muestra antes de confirmar.
- Implementación: `SolicitudService.denegar()` — validación de longitud mínima en `causalDenegacion`

**RN-03 — Solo archivos PDF**
El sistema acepta únicamente archivos en formato PDF en todos los puntos de carga (documentos e información de oficio). El frontend valida el tipo de archivo antes del envío; el backend valida el encabezado real del archivo de forma independiente.
- Implementación: `FileValidatorService` (backend) · validación de tipo en frontend

**RN-04 — Niveles de acceso**
Los documentos del repositorio se clasifican en dos niveles: PÚBLICO (visible sin autenticación) e INTERNO (requiere cualquier rol autenticado con JWT válido). El filtro se aplica automáticamente en todas las búsquedas y descargas. La información de oficio no tiene este control — siempre es pública una vez publicada.
- Implementación: Enum `NivelAcceso` (`PUBLICO`, `INTERNO`) · `DocumentoSpecifications`

**RN-05 — Metadatos obligatorios**
Todo documento registrado debe contar con los metadatos obligatorios: título, categoría, fecha de emisión, unidad de origen y nivel de acceso. La ausencia de cualquiera impide el registro.
- Implementación: Validación Jakarta Bean Validation en DTOs · Zod en frontend

**RN-06 — Códigos correlativos**
Los documentos se identifican con DOC-YYYY-NNNN y las solicitudes con SOL-YYYY-NNNN. El contador se reinicia anualmente. Se garantiza unicidad bajo concurrencia mediante bloqueo pesimista sobre `secuencias_codigo`.
- Implementación: `DocumentoService.generarCodigoDocumento()` · `SolicitudService.generarCodigoExpediente()` · tabla `secuencias_codigo`

**RN-07 — Auditoría APPEND-ONLY**
El sistema registra los eventos de autenticación, usuarios, documentos, solicitudes, información de oficio y exportación de reportes en `registro_auditoria` de forma inmutable. Ningún proceso puede ejecutar UPDATE o DELETE sobre esta tabla. Solo el rol ADMINISTRADOR tiene acceso de lectura al módulo de auditoría. Toda escritura corre en transacción `REQUIRES_NEW`. Única excepción intencional: las descargas públicas anónimas (documentos del repositorio e información de oficio) no se auditan, por no existir un usuario autenticado al cual atribuir el evento — ver CU 0.
- Implementación: `REVOKE UPDATE, DELETE ON TABLE registro_auditoria FROM sgdp_app` (Flyway **V9**) · `@Transactional(propagation=REQUIRES_NEW)` en AuditoriaService · en oficio, la llamada se hace desde `OficioAdminController` en vez de `OficioAdminService`

**RN-08 — Seguridad de contraseñas**
Las contraseñas se almacenan con hash BCrypt. El sistema mantiene historial de las últimas 3 contraseñas para prevenir reutilización. Tras 3 intentos fallidos consecutivos, la cuenta queda bloqueada 15 minutos. El tiempo se calcula y compara en UTC explícito, independiente de la zona horaria del servidor. El Administrador puede desbloquear manualmente antes de que expire el tiempo.
- Implementación: `BCryptPasswordEncoder` · tabla `historial_contrasenas` · campos `intentos_fallidos` y `bloqueado_hasta` · `LocalDateTime.now(ZoneOffset.UTC)` · `UsuarioService.registrarIntentoFallido()` / `desbloquearCuenta()` en `REQUIRES_NEW`

**RN-09 — Cambio forzado de contraseña en primer login**
Todo usuario nuevo, o con contraseña restablecida por el Administrador, debe cambiar su contraseña temporal antes de acceder a cualquier funcionalidad. El frontend redirige obligatoriamente a `/admin/cambiar-contrasena` mientras el flag `requiere_cambio_contrasena` sea verdadero.
- Implementación: Campo `requiere_cambio_contrasena` en tabla `usuarios` · redirección condicional en frontend

**RN-10 — Integridad documental SHA-256**
El hash SHA-256 de cada archivo PDF se calcula en el backend al momento de la carga, nunca en el frontend. En cada descarga autenticada del repositorio, el sistema recalcula el hash desde Cloudflare R2 y lo compara con el hash almacenado. Si no coinciden, la descarga se aborta y se registra `INTEGRITY_FAIL` en auditoría.
- Implementación: `HashService.sha256()` · `DocumentoService.descargarConVerificacion()` · `TipoAccion.INTEGRITY_FAIL`

**RN-11 — Permisos en gestión de solicitudes**
El Administrador únicamente puede visualizar el listado de solicitudes y asignar un Oficial responsable; no puede responder, prorrogar ni denegar. Solo el Oficial asignado a una solicitud específica puede ejecutar esas acciones sobre ella. Un Oficial solo puede autoasignarse solicitudes sin asignación previa; solo el Administrador puede asignar a cualquier otro oficial.
- Implementación: `puedeActuar(s) = !isAdmin && esOficialAsignado(s)` · `AsignarModal` con `soloAutoAsignar` · validación replicada en backend

**RN-12 — VENCIDA no es estado terminal**
Una solicitud con estado VENCIDA conserva exactamente las mismas acciones disponibles que una solicitud activa: asignar (si no tiene Oficial), y responder, prorrogar o denegar (el Oficial asignado). Solo cambia la etiqueta de estado visible en la interfaz.
- Implementación: Estado `VENCIDA` incluido como origen válido en `asignarOficial()`, `responder()`, `prorrogar()` y `denegar()` de `SolicitudService`

### 4. Postcondiciones
- 4.1. Todas las reglas listadas son de cumplimiento obligatorio para los módulos donde aplican; las excepciones verificadas (oficio sin auditoría) quedan documentadas explícitamente, no ocultas.
- 4.2. Cada caso de uso referencia las reglas aplicables mediante su identificador (RN-XX).
- 4.3. La modificación de cualquier regla debe actualizarse en este caso de uso y verificarse contra el código fuente antes de darse por vigente, para mantener la consistencia de toda la documentación.

---

*Nota. Elaboración propia (2026). Sistema de Gestión Documental Pública — Municipalidad de San Raymundo. Marco legal: Decreto 57-2008 (LAIP) · ISO 15489-1:2016 · ISO 30300:2020. Documento verificado línea por línea contra `sgdp-backend/` y `sgdp-frontend/` — no es una fotografía de la intención de diseño original, es el sistema tal como quedó implementado.*
