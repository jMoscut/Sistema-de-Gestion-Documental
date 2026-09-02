-- V7: Secciones adicionales de transparencia municipal

ALTER TABLE categoria_oficio ADD COLUMN seccion VARCHAR(50) NOT NULL DEFAULT 'LAIP';
UPDATE categoria_oficio SET seccion = 'LAIP';
ALTER TABLE categoria_oficio DROP CONSTRAINT IF EXISTS categoria_oficio_numero_key;
ALTER TABLE categoria_oficio ADD CONSTRAINT uq_categoria_oficio_seccion_numero UNIQUE (seccion, numero);
CREATE INDEX idx_categoria_oficio_seccion ON categoria_oficio(seccion);

-- Información del COMUDE
INSERT INTO categoria_oficio (seccion, numero, nombre) VALUES
('COMUDE', 1, '01A Estructura Orgánica'),
('COMUDE', 2, '01B Funciones'),
('COMUDE', 3, '01C Marco Normativo'),
('COMUDE', 4, '02A Dirección y Teléfonos'),
('COMUDE', 5, '03A Directorio de Empleados'),
('COMUDE', 6, '05A Misión y Objetivos');

-- Decreto 101-97 Art. 17 Ter
INSERT INTO categoria_oficio (seccion, numero, nombre) VALUES
('DECRETO_101_97', 1, 'A. Asesorías Contratadas'),
('DECRETO_101_97', 2, 'B. Jornales'),
('DECRETO_101_97', 3, 'C. Beneficios Salariales'),
('DECRETO_101_97', 4, 'D. Arrendamiento de Edificios'),
('DECRETO_101_97', 5, 'E. Convenios'),
('DECRETO_101_97', 6, 'F. Aportes Sector Privado'),
('DECRETO_101_97', 7, 'G. Proyectos por Cooperación Internacional'),
('DECRETO_101_97', 8, 'H. Liquidación Presupuestaria');

-- Transparencia Presupuestaria
INSERT INTO categoria_oficio (seccion, numero, nombre) VALUES
('PRESUPUESTARIA', 1, 'Presupuesto Aprobado'),
('PRESUPUESTARIA', 2, 'Modificaciones Presupuestarias'),
('PRESUPUESTARIA', 3, 'Ejecución Presupuestaria'),
('PRESUPUESTARIA', 4, 'Liquidación Presupuestaria');

-- Control Interno Gubernamental (SINACIG)
INSERT INTO categoria_oficio (seccion, numero, nombre) VALUES
('SINACIG', 1, 'Aprobación de Normativa'),
('SINACIG', 2, 'Planes de Control Interno'),
('SINACIG', 3, 'Informes de Seguimiento'),
('SINACIG', 4, 'Evaluaciones de Control Interno');

-- Rendición de Cuentas
INSERT INTO categoria_oficio (seccion, numero, nombre) VALUES
('RENDICION_CUENTAS', 1, 'Memoria de Labores'),
('RENDICION_CUENTAS', 2, 'Informes LAIP-PDH'),
('RENDICION_CUENTAS', 3, 'Informes de Gestión'),
('RENDICION_CUENTAS', 4, 'Planes Operativos Anuales');

-- Decreto 36-2024
INSERT INTO categoria_oficio (seccion, numero, nombre) VALUES
('DECRETO_36_2024', 1, 'Declaraciones Patrimoniales'),
('DECRETO_36_2024', 2, 'Registros de Bienes'),
('DECRETO_36_2024', 3, 'Informes de Cumplimiento');
