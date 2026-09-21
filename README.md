# SGDP — Sistema de Gestión Documental Pública

Plataforma de gestión documental para la Municipalidad de San Raymundo: administración de documentos institucionales, atención de solicitudes de acceso a la información (Decreto 57-2008, LAIP) y publicación proactiva de información de oficio conforme al Artículo 10.

Proyecto de tesis — Licenciatura en Ciencias y Sistemas, Universidad Mariano Gálvez de Guatemala.

## Stack

**Backend** — `sgdp-backend/`
- Java 17 · Spring Boot 3.3.4
- PostgreSQL (Neon) · Flyway (migraciones)
- Spring Security · JWT (`jjwt` 0.12.6)
- Cloudflare R2 (almacenamiento de archivos, S3-compatible)
- Brevo (envío de correo transaccional)
- JaCoCo (cobertura de pruebas)

**Frontend** — `sgdp-frontend/`
- React 18 · TypeScript · Vite 5
- TanStack Query · React Hook Form + Zod
- Tailwind CSS
- Jest + Testing Library

**Infraestructura**
- Backend desplegado en Railway
- Frontend desplegado en Cloudflare
- CI/CD con GitHub Actions
- Escaneo de seguridad OWASP ZAP (baseline scan)

## Estructura del repositorio

```
sgdp-backend/     API REST (Spring Boot)
sgdp-frontend/    Aplicación web (React + Vite)
```

## Módulos principales

| Módulo | Descripción |
|---|---|
| Documentos | Registro, versionado y control de acceso de documentos institucionales |
| Solicitudes LAIP | Ciclo completo de solicitudes de información pública: asignación, respuesta, prórroga, denegación |
| Información de Oficio | Publicación proactiva organizada en las 29 categorías del Art. 10 LAIP, COMUDE, Presupuestaria, SINACIG, Rendición de Cuentas, Decreto 101-97 y Decreto 36-2024 |
| Usuarios | Gestión de cuentas y roles (Administrador, Oficial, Funcionario) |
| Auditoría | Registro inmutable de acciones del sistema |
| Reportes | Exportación CSV/PDF para cumplimiento LAIP |
| Portal Ciudadano | Búsqueda pública de documentos, presentación y seguimiento de solicitudes, consulta de información de oficio — sin autenticación |

## Requisitos previos

- Java 17
- Node.js 18+
- PostgreSQL 16 (o cuenta en [Neon](https://neon.tech))
- Cuenta S3-compatible para archivos (Cloudflare R2, o [MinIO](https://min.io) en local)
- Cuenta [Brevo](https://www.brevo.com) para correo (opcional en desarrollo)

## Cómo correr el proyecto en local

### Backend

```bash
cd sgdp-backend
cp .env.example application-local.properties   # o exportar las variables de entorno directamente
mvn spring-boot:run
```

La API queda disponible en `http://localhost:8080`. Flyway ejecuta las migraciones automáticamente al iniciar.

### Frontend

```bash
cd sgdp-frontend
npm install
cp .env.example .env.local
npm run dev
```

La aplicación queda disponible en `http://localhost:5173`.

## Pruebas

```bash
# Backend
cd sgdp-backend
mvn test

# Frontend
cd sgdp-frontend
npm run test:coverage
```

## Variables de entorno

Ver `sgdp-backend/.env.example` y `sgdp-frontend/.env.example` para el detalle completo. Ningún archivo con credenciales reales (`.env`, `application-local.properties`) se versiona — están excluidos vía `.gitignore`.

## Licencia

[MIT con cláusula de restricción comercial](LICENSE) — uso, copia y modificación libres y gratuitas; la venta o comercialización del software queda reservada exclusivamente a la autora original.
