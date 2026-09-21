# 4.4 Metodología de Desarrollo de Software

## Sistema de Gestión Documental Pública (SGDP) · Municipalidad de San Raymundo

| | |
|---|---|
| Autora | Jackeline Nikole Sanchez Moscut |
| Universidad | Universidad Mariano Gálvez de Guatemala |
| Versión | 1.0 |
| Fecha | Septiembre 2026 |

> Este capítulo aplica al **proyecto real SGDP** — verificado contra `SGDP_DERCAS_Completo.md`, `SGDP_Casos_de_Uso.md`, `SGDP_Manual_Tecnico.md` y el código fuente (`sgdp-backend/`, `sgdp-frontend/`). Los conteos de requerimientos, disciplinas, artefactos y tecnologías citados aquí coinciden con esos documentos; no se inventan cifras nuevas.

---

## Índice de la sección

- [4.4.1 Ciclo de Vida del Desarrollo de Software (SDLC)](#441-ciclo-de-vida-del-desarrollo-de-software-sdlc)
- [4.4.2 Metodología de Desarrollo: Rational Unified Process (RUP)](#442-metodología-de-desarrollo-rational-unified-process-rup)
- [4.4.3 Características de RUP](#443-características-de-rup)
- [4.4.4 Fases RUP aplicadas al SGDP](#444-fases-rup-aplicadas-al-sgdp)
- [4.4.5 Tabla de hitos RUP](#445-tabla-de-hitos-rup)
- [4.4.6 Calendario de disciplinas y artefactos](#446-calendario-de-disciplinas-y-artefactos)
- [4.4.7 Justificación de la Metodología Seleccionada](#447-justificación-de-la-metodología-seleccionada)
- [4.4.8 Distribución de Esfuerzo por Fase RUP](#448-distribución-de-esfuerzo-por-fase-rup)
- [4.4.9 Matriz de Disciplinas RUP por Fase](#449-matriz-de-disciplinas-rup-por-fase)
- [4.4.10 Artefactos Producidos por Fase RUP](#4410-artefactos-producidos-por-fase-rup)
- [4.4.11 Iteraciones de la Fase de Construcción](#4411-iteraciones-de-la-fase-de-construcción)
- [4.4.12 Técnicas FAST para Levantamiento de Requisitos](#4412-técnicas-fast-para-levantamiento-de-requisitos)
- [4.4.13 Trazabilidad: Fase RUP → Disciplina → Artefacto → Requerimiento](#4413-trazabilidad-fase-rup--disciplina--artefacto--requerimiento)
- [4.4.14 Requerimientos Funcionales y No Funcionales](#4414-requerimientos-funcionales-y-no-funcionales)
- [4.4.15 Metodología de Análisis: FAST](#4415-metodología-de-análisis-fast)
- [4.4.16 Técnicas de Levantamiento de Requisitos: DERCAS](#4416-técnicas-de-levantamiento-de-requisitos-dercas)

---

## 4.4.1 Ciclo de Vida del Desarrollo de Software (SDLC)

El desarrollo del SGDP siguió un ciclo de vida iterativo e incremental, en contraste con un modelo en cascada puro. Las cinco etapas genéricas del SDLC se mapean al proyecto de la siguiente forma:

| Etapa SDLC | Aplicación en SGDP |
|---|---|
| Planificación | Definición del alcance (7 secciones de transparencia LAIP, módulos de Documentos/Solicitudes/Oficio/Usuarios/Auditoría/Reportes), identificación de actores (Ciudadano, Administrador, Oficial, Funcionario) |
| Análisis | Levantamiento de requisitos vía técnica FAST (ver 4.4.12) contra el Decreto 57-2008 y necesidades reales de la Municipalidad; documentado en `SGDP_DERCAS_Completo.md` (18 RF, 7 RNF, 12 RN) |
| Diseño | Arquitectura de 3 capas (React/Spring Boot/PostgreSQL), diagramas de clases y estados (`SGDP_Diagramas_Mermaid.md`), diccionario de datos (13 entidades JPA) |
| Implementación | Backend Java 17 + Spring Boot 3.3.4 (`sgdp-backend/`), frontend React 18 + TypeScript + Vite (`sgdp-frontend/`) |
| Pruebas y despliegue | 155 pruebas backend (JUnit 5 + Mockito) y 164 pruebas frontend (Jest + RTL) en CI/CD con GitHub Actions; despliegue continuo a Railway |

Se eligió un ciclo **iterativo e incremental** — no cascada — porque el sistema creció por incrementos funcionales verificables: primero el repositorio documental y el portal público, luego las solicitudes LAIP, luego la información de oficio, y finalmente el módulo de notificaciones internas y los endurecimientos de seguridad (bloqueo de cuenta, auditoría transaccional) que surgieron de pruebas reales sobre el sistema ya desplegado.

---

## 4.4.2 Metodología de Desarrollo: Rational Unified Process (RUP)

RUP es un marco de proceso iterativo, centrado en la arquitectura, dirigido por casos de uso y basado en la gestión de riesgos, propuesto originalmente por Rational Software (hoy IBM). Organiza el desarrollo en **cuatro fases secuenciales** (Inicio, Elaboración, Construcción, Transición) y **nueve disciplinas** que se ejecutan con distinta intensidad en cada fase.

Para el SGDP se adoptó RUP en su variante simplificada para proyecto de tesis individual: se conservan las cuatro fases y se enfatizan las cinco disciplinas con evidencia directa en el repositorio — Requisitos, Análisis y Diseño, Implementación, Pruebas y Despliegue — sin el aparato completo de roles múltiples que asume RUP en un equipo grande.

---

## 4.4.3 Características de RUP

| Característica | Cómo se manifiesta en el SGDP |
|---|---|
| Iterativo e incremental | Cada iteración de Construcción entregó un módulo funcional completo y probado (ver 4.4.11), no una capa horizontal aislada |
| Dirigido por casos de uso | Los 9 casos de uso documentados en `SGDP_Casos_de_Uso.md` (CU 0–CU 8) guiaron el diseño de las entidades, los endpoints REST y las pantallas |
| Centrado en la arquitectura | La arquitectura de 3 capas se definió en la fase de Elaboración y se mantuvo estable durante toda la Construcción; los cambios posteriores (ej. sistema de notificaciones internas) se integraron sin romperla |
| Basado en gestión de riesgos | Los riesgos técnicos de mayor incertidumbre (cálculo de días hábiles con feriados guatemaltecos y Semana Santa, integridad SHA-256, autenticación JWT) se atacaron primero, en iteraciones tempranas de Construcción |
| Control de cambios | Historial de control de versiones vía Git/GitHub, con mensajes de commit descriptivos por corrección o funcionalidad (ej. *"fix: corrige bloqueo de cuenta tras intentos fallidos"*, *"feat: notificaciones in-app y permitir gestión de solicitudes vencidas"*) |

---

## 4.4.4 Fases RUP aplicadas al SGDP

| Fase | Objetivo | Alcance real logrado en el SGDP |
|---|---|---|
| **Inicio** (Inception) | Definir el alcance, el caso de negocio y los riesgos principales | Identificación de los 3 roles internos y el actor ciudadano; alcance de las 7 secciones de transparencia; primer borrador de RF/RN contra el Decreto 57-2008 |
| **Elaboración** (Elaboration) | Establecer la arquitectura base y mitigar los riesgos técnicos críticos | Arquitectura de 3 capas definida; modelo de datos inicial (V1–V3 de Flyway); prueba de concepto de JWT stateless y BCrypt |
| **Construcción** (Construction) | Desarrollar el sistema en iteraciones incrementales hasta la funcionalidad completa | Los 8 módulos funcionales (Documentos, Solicitudes LAIP, Información de Oficio, Usuarios, Auditoría, Reportes, Dashboard, Portal Ciudadano) implementados y probados; 11 migraciones Flyway (V1–V11) |
| **Transición** (Transition) | Llevar el sistema a producción y estabilizarlo con usuarios reales | Despliegue en Railway; escaneo de seguridad OWASP ZAP (0 alertas High/Medium/Low); corrección de defectos post-despliegue (bloqueo de cuenta, timestamps de auditoría, responsive del portal público) detectados en uso real |

---

## 4.4.5 Tabla de hitos RUP

| Hito | Fase | Criterio de cumplimiento verificado |
|---|---|---|
| Objetivos del ciclo de vida (LCO) | Fin de Inicio | Alcance y actores definidos; RF/RN iniciales redactados |
| Arquitectura del ciclo de vida (LCA) | Fin de Elaboración | Arquitectura de 3 capas estable; esquema de base de datos base (V1–V3) validado |
| Capacidad operacional inicial (IOC) | Fin de Construcción | Los 8 módulos funcionales completos; 155 pruebas backend y 164 frontend pasando; pipeline CI/CD (`ci.yml`) bloqueando merges con cobertura insuficiente |
| Release del producto (PR) | Fin de Transición | Sistema en producción (Railway); escaneo OWASP ZAP limpio; manual de usuario y manual técnico publicados |

---

## 4.4.6 Calendario de disciplinas y artefactos

| Período aproximado | Fase RUP | Disciplinas dominantes | Artefactos entregados |
|---|---|---|---|
| Inicio del proyecto | Inicio | Requisitos, Gestión de Proyecto | Alcance preliminar, lista de actores, borrador de RF |
| Semanas siguientes | Elaboración | Análisis y Diseño, Requisitos | `SGDP_DERCAS_Completo.md` (versión base), diagrama de arquitectura, migraciones V1–V4 |
| Núcleo del desarrollo | Construcción | Implementación, Pruebas | Módulos backend/frontend, `SGDP_Casos_de_Uso.md`, `SGDP_Diagramas_Mermaid.md`, suites de pruebas JUnit/Jest, migraciones V5–V11 |
| Cierre del proyecto | Transición | Despliegue, Pruebas | Despliegue a Railway, escaneo OWASP ZAP, `Manual_Usuario_SGDP_v1.0.md`, `SGDP_Manual_Tecnico.md`, corrección de defectos post-producción |

> Las fechas exactas de commit están disponibles en el historial de Git del repositorio (`git log`); esta tabla resume el orden real de entrega por disciplina, no fechas calendario específicas, dado que el desarrollo fue individual y continuo.

---

## 4.4.7 Justificación de la Metodología Seleccionada

Se seleccionó RUP sobre otras alternativas (cascada, Scrum puro) por las siguientes razones, específicas a las condiciones reales de este proyecto:

1. **Desarrollador único, sin equipo Scrum que justifique ceremonias de sprint formales** — RUP permite iteraciones flexibles sin roles de Scrum Master/Product Owner separados, mientras conserva disciplina de fases y control de riesgo.
2. **Requisitos legales fijos desde el inicio** (Decreto 57-2008, Art. 10 — 29 categorías obligatorias) — RUP, al ser dirigido por casos de uso y centrado en arquitectura, encaja mejor que Scrum cuando una porción significativa del alcance es normativa y no negociable con un Product Owner.
3. **Alto riesgo técnico concentrado en pocos componentes** (cálculo de días hábiles con feriados guatemaltecos, JWT stateless, integridad SHA-256, transacciones concurrentes para auditoría) — el énfasis de RUP en mitigar riesgo temprano (fase de Elaboración) resultó directamente aplicable.
4. **Necesidad de documentación formal para fines de tesis** — RUP produce naturalmente los artefactos exigidos académicamente (DERCAS, casos de uso, diagramas, plan de pruebas), a diferencia de metodologías ágiles ligeras que minimizan documentación.
5. **Cascada pura se descartó** porque el proyecto sí requirió iteración real: varias reglas de negocio (ej. reactivación de solicitudes VENCIDA, sistema de notificaciones internas, endurecimiento del bloqueo de cuentas) surgieron y se refinaron **después** de tener el sistema en uso, no se conocían por completo en la fase de requisitos inicial.

---

## 4.4.8 Distribución de Esfuerzo por Fase RUP

| Fase | Esfuerzo relativo aproximado | Justificación |
|---|---|---|
| Inicio | 5% | Alcance acotado por normativa preexistente (LAIP), reduce tiempo de descubrimiento |
| Elaboración | 15% | Arquitectura de 3 capas es estándar (React + Spring Boot + PostgreSQL), sin riesgos arquitectónicos mayores fuera de lo ya resuelto por el ecosistema |
| Construcción | 65% | Concentra la implementación de los 8 módulos funcionales, las 11 migraciones de base de datos y las 319 pruebas automatizadas totales (155 backend + 164 frontend) |
| Transición | 15% | Despliegue, escaneo de seguridad, corrección de defectos detectados en producción real (bloqueo de cuentas, timestamps, responsive) y documentación final |

Esta distribución sigue el patrón típico de RUP (curva de esfuerzo concentrada en Construcción), consistente con que la mayoría de los commits del repositorio corresponden a implementación y corrección de módulos funcionales.

---

## 4.4.9 Matriz de Disciplinas RUP por Fase

| Disciplina | Inicio | Elaboración | Construcción | Transición |
|---|:---:|:---:|:---:|:---:|
| Modelado de negocio | ●●● | ● | — | — |
| Requisitos | ●●● | ●● | ● | — |
| Análisis y Diseño | ● | ●●● | ●● | — |
| Implementación | — | ● | ●●● | ● |
| Pruebas | — | ● | ●●● | ●● |
| Despliegue | — | — | ● | ●●● |
| Gestión de Configuración y Cambios | ● | ● | ●● | ●● |
| Gestión de Proyecto | ●● | ●● | ●● | ●● |
| Entorno | ●● | ● | — | — |

`●●●` = actividad principal · `●●` = actividad moderada · `●` = actividad menor · `—` = sin actividad significativa

---

## 4.4.10 Artefactos Producidos por Fase RUP

| Fase | Artefactos reales del proyecto |
|---|---|
| Inicio | Alcance y actores (documento preliminar), lista inicial de RF contra Decreto 57-2008 |
| Elaboración | `SGDP_DERCAS_Completo.md` (arquitectura, RF/RNF/RN, diccionario de datos base), migraciones Flyway V1–V4 |
| Construcción | Código fuente completo (`sgdp-backend/`, `sgdp-frontend/`), `SGDP_Casos_de_Uso.md`, `SGDP_Diagramas_Mermaid.md`, migraciones V5–V11, suites de prueba (155 backend + 164 frontend) |
| Transición | Despliegue en Railway, reporte de escaneo OWASP ZAP, `Manual_Usuario_SGDP_v1.0.md`, `SGDP_Manual_Tecnico.md`, `README.md`, `LICENSE` |

---

## 4.4.11 Iteraciones de la Fase de Construcción

La Construcción se ejecutó en iteraciones por módulo funcional, cada una cerrando con el módulo desplegable y probado antes de iniciar la siguiente:

| Iteración | Módulo entregado | Evidencia |
|---|---|---|
| 1 | Repositorio de Documentos + autenticación base | Entidades `Documento`, `CategoriaDocumento`, `Usuario`; JWT; migraciones V1–V4 |
| 2 | Portal Ciudadano público (búsqueda de documentos) | `PublicoController`, páginas `HomePage`/`BuscadorPublicoPage` |
| 3 | Solicitudes de Información Pública (LAIP) | `SolicitudService`, cálculo de días hábiles, presentación y seguimiento público |
| 4 | Información de Oficio (Art. 10 LAIP) | Jerarquía Sección→Categoría→Carpeta→Documento, 29 categorías LAIP (migración V6) |
| 5 | Usuarios, Auditoría y Reportes | RBAC de 3 roles, log APPEND-ONLY, exportación CSV/PDF |
| 6 | Endurecimiento e integridad | Ciclo de vida documental, hash SHA-256, simplificación de niveles de acceso (V9–V10) |
| 7 | Notificaciones internas y reglas de permisos refinadas | `NotificacionService` (campanita), reactivación de solicitudes VENCIDA, permisos Administrador-solo-asigna / Oficial-asignado-actúa |
| 8 | Endurecimiento post-producción | Corrección de bloqueo de cuenta (transacciones `REQUIRES_NEW`), timestamps de auditoría en UTC real, desbloqueo manual de cuentas, responsive del portal público |

Cada iteración siguió el mismo micro-ciclo: requisitos del módulo → diseño de entidades/endpoints → implementación → pruebas automatizadas → despliegue a Railway → verificación manual antes de continuar con la siguiente iteración.

---

## 4.4.12 Técnicas FAST para Levantamiento de Requisitos

**FAST** (Facilitated Application Specification Techniques) es una técnica de levantamiento de requisitos basada en sesiones conjuntas y facilitadas entre desarrollador y usuarios/interesados clave, orientada a llegar rápido a una especificación consensuada sin la carga de reuniones formales extensas.

Aplicación real en el SGDP:

- **Interesado clave**: rol de Oficial de Información LAIP de la Municipalidad de San Raymundo, como fuente de la necesidad real de digitalizar el proceso de atención de solicitudes.
- **Sesiones facilitadas**: en lugar de reuniones presenciales grupales (no aplicable a un equipo de un solo desarrollador), las "sesiones" tomaron la forma de iteraciones de revisión dirigida: se presentaba una funcionalidad implementada, se contrastaba contra el flujo real de trabajo municipal, y se ajustaba de inmediato (ejemplo documentado: el ajuste de permisos de "Asignar/Responder/Prorrogar/Denegar" en solicitudes surgió de una revisión directa de cómo se dividía el trabajo entre Administrador y Oficial en la práctica).
- **Documento base**: el Decreto 57-2008 (Ley de Acceso a la Información Pública) actuó como el documento normativo de referencia obligatoria, reduciendo la ambigüedad típica que FAST intenta resolver con discusión — buena parte del alcance (plazo de 10 días hábiles, prórroga de 10 días adicionales, las 29 categorías del Art. 10) no se negoció, se tradujo directamente de la ley.
- **Resultado**: especificación consolidada en `SGDP_DERCAS_Completo.md`, iterada varias veces conforme se detectaban discrepancias entre lo documentado y el comportamiento real verificado en el código (ver 4.4.16).

---

## 4.4.13 Trazabilidad: Fase RUP → Disciplina → Artefacto → Requerimiento

| Fase RUP | Disciplina | Artefacto | Requerimientos cubiertos (ejemplos) |
|---|---|---|---|
| Inicio | Requisitos | Alcance preliminar | RF-01 (Portal Público), RF-10 (RBAC 3 roles) |
| Elaboración | Análisis y Diseño | DERCAS — arquitectura y diccionario de datos | RNF-07 (API REST stateless), RN-04 (niveles de acceso) |
| Construcción | Implementación | `SolicitudService.java`, `DocumentoService.java`, `OficioAdminService.java` | RF-02, RF-03, RF-05, RF-06, RF-07, RF-13 |
| Construcción | Pruebas | `SolicitudServiceTest`, `AuthServiceTest`, `DocumentoServiceTest` | RN-01, RN-08, RN-10, RN-11, RN-12 |
| Construcción | Implementación | `NotificacionService.java`, `NotificationBell.tsx` | RF-03 (notificación interna), RF-14 (oficio desactualizado) |
| Transición | Despliegue | Workflow `security-scan.yml`, `ci.yml` | RNF-03 (seguridad en tránsito), RNF-06 (cobertura de pruebas) |
| Transición | Pruebas | Reporte OWASP ZAP, corrección HSTS | RNF-03 |

Esta tabla es un resumen ilustrativo; la trazabilidad completa RF↔CU está en la sección "Trazabilidad Requerimientos — Casos de Uso" al final de `SGDP_Casos_de_Uso.md`.

---

## 4.4.14 Requerimientos Funcionales y No Funcionales

El detalle completo de cada requerimiento (descripción, entrada, proceso, salida, criterio de aceptación y estado) vive en `SGDP_DERCAS_Completo.md`, secciones 3 y 4. Resumen cuantitativo:

| Categoría | Cantidad | Rango de ID |
|---|---|---|
| Requerimientos Funcionales (RF) | 18 | RF-01 – RF-18 |
| Requerimientos No Funcionales (RNF) | 7 | RNF-01 – RNF-07 |
| Reglas de Negocio (RN) | 12 | RN-01 – RN-12 |

Los 18 RF cubren: portal público (RF-01), ciclo de solicitudes LAIP (RF-02 a RF-04), gestión documental e integridad (RF-05 a RF-09), control de acceso y seguridad de cuentas (RF-10 a RF-12), información de oficio (RF-13, RF-14), auditoría (RF-15, RF-16) y reportería/dashboard (RF-17, RF-18). Todos los 18 están en estado **Implementado** — no quedan requerimientos parciales o pendientes al cierre del proyecto.

---

## 4.4.15 Metodología de Análisis: FAST

Más allá de la técnica puntual de levantamiento (4.4.12), FAST se usó como **metodología de análisis** general del proyecto, en el sentido de que el análisis de requisitos no siguió un modelo de documento único congelado al inicio, sino ciclos cortos de especificación-validación-ajuste repetidos durante toda la vida del proyecto, incluyendo después del primer despliegue a producción.

Evidencia de esta naturaleza iterativa del análisis:

- El requerimiento de notificaciones (RF-03/RF-14) cambió de concepto durante el desarrollo: se descartó explícitamente un enfoque basado en correo electrónico automático hacia el personal interno, en favor de un centro de notificaciones dentro de la misma plataforma — decisión tomada directamente por el interesado clave durante una sesión de revisión, no en el documento de requisitos original.
- La regla de que una solicitud vencida deja de ser un callejón sin salida (RN-12) se formalizó **después** de observar el comportamiento real del sistema en producción, no durante el análisis inicial.
- Correcciones de seguridad (bloqueo de cuenta, timestamps de auditoría) surgieron de pruebas de caja negra sobre el sistema ya desplegado, no de un análisis previo — consistente con el espíritu de FAST de priorizar la validación rápida contra el uso real sobre la especificación exhaustiva anticipada.

---

## 4.4.16 Técnicas de Levantamiento de Requisitos: DERCAS

`SGDP_DERCAS_Completo.md` (Documento de Especificación de Requerimientos, Casos de Uso y Arquitectura del Sistema) es el artefacto central donde se consolidan los resultados del levantamiento de requisitos. Las técnicas concretas empleadas para producirlo y mantenerlo actualizado fueron:

| Técnica | Aplicación en el SGDP |
|---|---|
| Análisis documental normativo | Lectura directa del Decreto 57-2008 (Art. 10, Art. 26, Art. 42) para derivar RF-01, RF-02, RF-03, RF-13 sin ambigüedad de interpretación |
| Entrevista con el interesado clave | Sesiones con el rol de Oficial de Información para validar el flujo real de asignación/respuesta/denegación/prórroga de solicitudes |
| Observación del comportamiento en producción | Verificación de RF/RN contra el sistema real ya desplegado (ej. confirmación de que las 29 categorías LAIP existen realmente en la migración V6, no solo en el documento) |
| Verificación cruzada código-documento | Cada versión de DERCAS se contrastó línea por línea contra las entidades JPA, servicios y controladores reales antes de darse por vigente — método usado explícitamente para corregir discrepancias como códigos de expediente (`EXP-` documentado vs. `SOL-` real), niveles de acceso (3 documentados vs. 2 reales) y mecanismos de notificación (email documentado vs. notificación interna real) |

Esta última técnica — verificación cruzada contra el código fuente — es la que mantiene a DERCAS, Casos de Uso y este documento de metodología mutuamente consistentes entre sí y fieles al sistema final, en vez de ser una fotografía desactualizada de una intención de diseño temprana.

---

*Sección 4.4 — Metodología de Desarrollo de Software — SGDP — Universidad Mariano Gálvez de Guatemala — Versión 1.0 — Septiembre 2026*
