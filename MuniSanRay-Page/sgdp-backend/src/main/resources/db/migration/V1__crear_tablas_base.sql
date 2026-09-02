-- ============================================================
-- V1: Crear tablas base del SGDP
-- Municipalidad de San Raymundo, Guatemala
-- ============================================================

-- Extensión para funciones criptográficas (gen_random_uuid, etc.)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- TABLA: categorias_documento
-- ============================================================
CREATE TABLE categorias_documento (
    id          BIGSERIAL PRIMARY KEY,
    nombre      VARCHAR(150) NOT NULL UNIQUE,
    descripcion TEXT,
    es_laip     BOOLEAN NOT NULL DEFAULT FALSE,
    activa      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE categorias_documento IS 'Categorías para clasificar documentos, incluyendo las obligatorias LAIP Art. 10';

-- ============================================================
-- TABLA: usuarios
-- ============================================================
CREATE TABLE usuarios (
    id                          BIGSERIAL PRIMARY KEY,
    nombre_completo             VARCHAR(200) NOT NULL,
    dpi                         VARCHAR(15) UNIQUE,
    correo_electronico          VARCHAR(200) NOT NULL UNIQUE,
    contrasena_hash             VARCHAR(255) NOT NULL,
    rol                         VARCHAR(30) NOT NULL CHECK (rol IN ('ADMINISTRADOR', 'OFICIAL', 'FUNCIONARIO')),
    unidad_municipal            VARCHAR(150),
    activo                      BOOLEAN NOT NULL DEFAULT TRUE,
    requiere_cambio_contrasena  BOOLEAN NOT NULL DEFAULT FALSE,
    intentos_fallidos           INTEGER NOT NULL DEFAULT 0,
    bloqueado_hasta             TIMESTAMP,
    ultimo_acceso               TIMESTAMP,
    created_at                  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE usuarios IS 'Usuarios del sistema con control de acceso por roles';
COMMENT ON COLUMN usuarios.rol IS 'ADMINISTRADOR: acceso total; OFICIAL: gestión LAIP; FUNCIONARIO: registro y consulta';
COMMENT ON COLUMN usuarios.bloqueado_hasta IS 'Si NOT NULL y en el futuro, la cuenta está temporalmente bloqueada';

-- ============================================================
-- TABLA: historial_contrasenas
-- ============================================================
CREATE TABLE historial_contrasenas (
    id              BIGSERIAL PRIMARY KEY,
    usuario_id      BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    contrasena_hash VARCHAR(255) NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE historial_contrasenas IS 'Historial de contraseñas para evitar reutilización (últimas 3)';

-- ============================================================
-- TABLA: documentos
-- ============================================================
CREATE TABLE documentos (
    id                              BIGSERIAL PRIMARY KEY,
    codigo                          VARCHAR(50) NOT NULL UNIQUE,
    titulo                          VARCHAR(500) NOT NULL,
    descripcion                     TEXT,
    categoria_id                    BIGINT NOT NULL REFERENCES categorias_documento(id),
    unidad_origen                   VARCHAR(150) NOT NULL,
    fecha_emision                   DATE NOT NULL,
    nivel_acceso                    VARCHAR(20) NOT NULL DEFAULT 'INTERNO'
                                        CHECK (nivel_acceso IN ('PUBLICO', 'INTERNO', 'RESERVADO', 'CONFIDENCIAL')),
    r2_key                          VARCHAR(500) NOT NULL,
    nombre_archivo                  VARCHAR(300) NOT NULL,
    tamano_bytes                    BIGINT NOT NULL,
    hash_sha256                     VARCHAR(64) NOT NULL,
    version_actual                  INTEGER NOT NULL DEFAULT 1,
    estado                          VARCHAR(30) NOT NULL DEFAULT 'VIGENTE'
                                        CHECK (estado IN ('VIGENTE', 'OBSOLETO', 'BORRADOR')),
    clasificacion_reservada_causal  TEXT,
    clasificacion_reservada_hasta   DATE,
    registrado_por                  BIGINT NOT NULL REFERENCES usuarios(id),
    search_vector                   TSVECTOR GENERATED ALWAYS AS (
                                        to_tsvector('spanish',
                                            coalesce(titulo, '') || ' ' ||
                                            coalesce(descripcion, '') || ' ' ||
                                            coalesce(codigo, '') || ' ' ||
                                            coalesce(unidad_origen, '')
                                        )
                                    ) STORED,
    created_at                      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at                      TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE documentos IS 'Repositorio central de documentos municipales';
COMMENT ON COLUMN documentos.codigo IS 'Código único del documento, generado por secuencia';
COMMENT ON COLUMN documentos.r2_key IS 'Ruta del archivo en Cloudflare R2 / MinIO';
COMMENT ON COLUMN documentos.hash_sha256 IS 'Hash SHA-256 del archivo para verificación de integridad';
COMMENT ON COLUMN documentos.search_vector IS 'Vector de búsqueda full-text generado automáticamente';

-- Índice GIN para búsqueda full-text
CREATE INDEX idx_documentos_search_vector ON documentos USING GIN(search_vector);
-- Índice para filtrado por nivel de acceso
CREATE INDEX idx_documentos_nivel_acceso ON documentos(nivel_acceso);
-- Índice para filtrado por categoría
CREATE INDEX idx_documentos_categoria ON documentos(categoria_id);
-- Índice para filtrado por estado
CREATE INDEX idx_documentos_estado ON documentos(estado);
-- Índice para filtrado por fecha de emisión
CREATE INDEX idx_documentos_fecha_emision ON documentos(fecha_emision DESC);

-- ============================================================
-- TABLA: versiones_documento
-- ============================================================
CREATE TABLE versiones_documento (
    id              BIGSERIAL PRIMARY KEY,
    documento_id    BIGINT NOT NULL REFERENCES documentos(id) ON DELETE CASCADE,
    numero_version  INTEGER NOT NULL,
    r2_key          VARCHAR(500) NOT NULL,
    hash_sha256     VARCHAR(64) NOT NULL,
    tamano_bytes    BIGINT NOT NULL,
    motivo_cambio   TEXT,
    creado_por      BIGINT NOT NULL REFERENCES usuarios(id),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (documento_id, numero_version)
);

COMMENT ON TABLE versiones_documento IS 'Historial de versiones de cada documento';

-- ============================================================
-- TABLA: solicitudes_informacion
-- ============================================================
CREATE TABLE solicitudes_informacion (
    id                      BIGSERIAL PRIMARY KEY,
    codigo_expediente       VARCHAR(50) NOT NULL UNIQUE,
    nombre_solicitante      VARCHAR(200) NOT NULL,
    dpi_solicitante         VARCHAR(15),
    correo_solicitante      VARCHAR(200),
    telefono_solicitante    VARCHAR(20),
    descripcion_solicitud   TEXT NOT NULL,
    fecha_recepcion         DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_limite            DATE NOT NULL,
    estado                  VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'
                                CHECK (estado IN ('PENDIENTE', 'EN_PROCESO', 'PRORROGADA', 'RESPONDIDA', 'DENEGADA', 'VENCIDA')),
    oficial_asignado        BIGINT REFERENCES usuarios(id),
    fecha_prorroga          DATE,
    motivo_prorroga         TEXT,
    respuesta               TEXT,
    fecha_respuesta         TIMESTAMP,
    causal_denegacion       TEXT,
    documento_respuesta_id  BIGINT REFERENCES documentos(id),
    created_at              TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE solicitudes_informacion IS 'Solicitudes de información pública LAIP - plazo máximo 10 días hábiles';
COMMENT ON COLUMN solicitudes_informacion.fecha_limite IS 'Calculada automáticamente: 10 días hábiles desde recepción';

CREATE INDEX idx_solicitudes_estado ON solicitudes_informacion(estado);
CREATE INDEX idx_solicitudes_fecha_limite ON solicitudes_informacion(fecha_limite);
CREATE INDEX idx_solicitudes_oficial ON solicitudes_informacion(oficial_asignado);

-- ============================================================
-- TABLA: informacion_oficio
-- Información de oficio pública (Art. 10 LAIP)
-- ============================================================
CREATE TABLE informacion_oficio (
    id                  BIGSERIAL PRIMARY KEY,
    categoria_laip      VARCHAR(200) NOT NULL,
    titulo              VARCHAR(500) NOT NULL,
    contenido           TEXT NOT NULL,
    periodo             VARCHAR(50),
    es_version_actual   BOOLEAN NOT NULL DEFAULT TRUE,
    publicado_por       BIGINT NOT NULL REFERENCES usuarios(id),
    published_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE informacion_oficio IS 'Información publicada de oficio según Art. 10 Ley de Acceso a la Información Pública';

CREATE INDEX idx_oficio_categoria ON informacion_oficio(categoria_laip);
CREATE INDEX idx_oficio_version_actual ON informacion_oficio(es_version_actual) WHERE es_version_actual = TRUE;

-- ============================================================
-- TABLA: registro_auditoria (APPEND-ONLY)
-- NO se deben permitir UPDATE ni DELETE en esta tabla
-- ============================================================
CREATE TABLE registro_auditoria (
    id              BIGSERIAL PRIMARY KEY,
    timestamp_utc   TIMESTAMP NOT NULL DEFAULT NOW(),
    usuario_id      BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
    usuario_desc    VARCHAR(300),
    ip_origen       VARCHAR(45),
    accion          VARCHAR(50) NOT NULL,
    objeto_tipo     VARCHAR(100),
    objeto_id       VARCHAR(100),
    objeto_desc     VARCHAR(500),
    resultado       VARCHAR(20) NOT NULL DEFAULT 'EXITO' CHECK (resultado IN ('EXITO', 'FALLO', 'DENEGADO')),
    detalle         JSONB
);

COMMENT ON TABLE registro_auditoria IS 'Registro de auditoría append-only. NO modificar registros existentes.';
COMMENT ON COLUMN registro_auditoria.detalle IS 'Datos adicionales del evento en formato JSON';

CREATE INDEX idx_auditoria_timestamp ON registro_auditoria(timestamp_utc DESC);
CREATE INDEX idx_auditoria_usuario ON registro_auditoria(usuario_id);
CREATE INDEX idx_auditoria_accion ON registro_auditoria(accion);
CREATE INDEX idx_auditoria_objeto ON registro_auditoria(objeto_tipo, objeto_id);

-- ============================================================
-- TABLA: secuencias_codigo
-- Para generar códigos correlativdos por tipo de documento/solicitud
-- ============================================================
CREATE TABLE secuencias_codigo (
    tipo        VARCHAR(50) PRIMARY KEY,
    prefijo     VARCHAR(10) NOT NULL,
    ultimo_num  INTEGER NOT NULL DEFAULT 0,
    anio        INTEGER NOT NULL
);

COMMENT ON TABLE secuencias_codigo IS 'Control de secuencias para generación de códigos únicos';

-- Insertar secuencias iniciales para el año actual
INSERT INTO secuencias_codigo (tipo, prefijo, ultimo_num, anio) VALUES
    ('DOCUMENTO',   'DOC',  0, EXTRACT(YEAR FROM NOW())::INTEGER),
    ('SOLICITUD',   'SOL',  0, EXTRACT(YEAR FROM NOW())::INTEGER),
    ('OFICIO',      'OFI',  0, EXTRACT(YEAR FROM NOW())::INTEGER);
