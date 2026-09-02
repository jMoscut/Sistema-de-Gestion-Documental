-- V6: Estructura jerárquica para Información de Oficio
-- Decreto 57-2008 Art. 10 — 29 categorías obligatorias

CREATE TABLE categoria_oficio (
    id      SERIAL PRIMARY KEY,
    numero  SMALLINT NOT NULL UNIQUE,
    nombre  VARCHAR(200) NOT NULL
);

INSERT INTO categoria_oficio (numero, nombre) VALUES
(1,  'Estructura Orgánica'),
(2,  'Dirección y Teléfonos'),
(3,  'Directorio de Empleados'),
(4,  'Remuneraciones'),
(5,  'Misión y Objetivos'),
(6,  'Manuales'),
(7,  'Presupuesto'),
(8,  'Ejecución Presupuestaria'),
(9,  'Depósitos'),
(10, 'Cotizaciones y Licitaciones'),
(11, 'Contratos Bienes y Servicios'),
(12, 'Viajes'),
(13, 'Inventario'),
(14, 'Contratos Mantenimiento'),
(15, 'Subsidios'),
(16, 'Usufructo'),
(17, 'Empresas Precalificadas'),
(18, 'Listado de Obras'),
(19, 'Contratos Arrendamiento'),
(20, 'Contrataciones'),
(21, 'Fideicomisos'),
(22, 'Compras Directas'),
(23, 'Auditorías'),
(24, 'Entidades Internacionales'),
(25, 'Entidades Privadas'),
(26, 'Archivo'),
(27, 'Información Clasificada'),
(28, 'Pertenencia Sociolingüística'),
(29, 'Información Adicional');

CREATE TABLE carpeta_oficio (
    id           BIGSERIAL PRIMARY KEY,
    categoria_id INT NOT NULL REFERENCES categoria_oficio(id),
    nombre       VARCHAR(200) NOT NULL,
    descripcion  TEXT,
    creado_por   BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE documento_oficio (
    id               BIGSERIAL PRIMARY KEY,
    carpeta_id       BIGINT NOT NULL REFERENCES carpeta_oficio(id) ON DELETE CASCADE,
    titulo           VARCHAR(300) NOT NULL,
    descripcion      TEXT,
    archivo_r2_key   VARCHAR(500) NOT NULL,
    archivo_nombre   VARCHAR(300) NOT NULL,
    tamano_bytes     BIGINT,
    subido_por       BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_carpeta_oficio_categoria ON carpeta_oficio(categoria_id);
CREATE INDEX idx_documento_oficio_carpeta ON documento_oficio(carpeta_id);
