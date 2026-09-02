-- ============================================================
-- V2: Insertar categorías de documentos
-- 10 categorías obligatorias LAIP Art. 10 + 5 internas
-- ============================================================

-- ============================================================
-- CATEGORÍAS OBLIGATORIAS - LEY DE ACCESO A LA INFORMACIÓN PÚBLICA
-- Decreto 57-2008, Artículo 10
-- ============================================================
INSERT INTO categorias_documento (nombre, descripcion, es_laip, activa) VALUES
(
    'Estructura Orgánica y Funciones',
    'Estructura organizativa de la municipalidad, funciones de cada unidad, directorio de funcionarios y empleados con sus respectivos cargos. Art. 10 numeral 1 LAIP.',
    TRUE, TRUE
),
(
    'Presupuesto General de Ingresos y Egresos',
    'Presupuesto aprobado y sus modificaciones, ejecución presupuestaria, informes de ingresos y egresos. Art. 10 numeral 2 LAIP.',
    TRUE, TRUE
),
(
    'Auditorías e Informes de la CGC',
    'Informes de auditoría interna y externa, informes de la Contraloría General de Cuentas, observaciones y seguimiento. Art. 10 numeral 3 LAIP.',
    TRUE, TRUE
),
(
    'Contrataciones y Licitaciones',
    'Bases de licitación, contratos suscritos, concursos de cotización, compras directas, kardex de proveedores. Art. 10 numeral 4 LAIP.',
    TRUE, TRUE
),
(
    'Permisos, Licencias y Autorizaciones',
    'Permisos de construcción, licencias municipales, autorizaciones diversas otorgadas por la municipalidad. Art. 10 numeral 5 LAIP.',
    TRUE, TRUE
),
(
    'Nómina de Personal',
    'Planilla de empleados, sueldos, salarios, dietas, viáticos y otros beneficios. Art. 10 numeral 6 LAIP.',
    TRUE, TRUE
),
(
    'Marco Normativo Institucional',
    'Reglamentos internos, ordenanzas municipales, acuerdos del Concejo Municipal y demás normas emitidas. Art. 10 numeral 7 LAIP.',
    TRUE, TRUE
),
(
    'Políticas Públicas y Planes de Gobierno',
    'Plan de gobierno municipal, políticas públicas adoptadas, planes operativos anuales (POA), planes de desarrollo. Art. 10 numeral 8 LAIP.',
    TRUE, TRUE
),
(
    'Mecanismos de Participación Ciudadana',
    'Convocatorias a consultas comunitarias, cabildos abiertos, resultados de consultas, mecanismos de participación. Art. 10 numeral 9 LAIP.',
    TRUE, TRUE
),
(
    'Índice de Información Reservada',
    'Listado de información clasificada como reservada o confidencial con indicación de causales y plazos. Art. 10 numeral 10 LAIP.',
    TRUE, TRUE
);

-- ============================================================
-- CATEGORÍAS INTERNAS ADICIONALES (no LAIP)
-- ============================================================
INSERT INTO categorias_documento (nombre, descripcion, es_laip, activa) VALUES
(
    'Actas y Resoluciones del Concejo',
    'Actas de sesiones del Concejo Municipal, resoluciones, puntos de acta y acuerdos internos.',
    FALSE, TRUE
),
(
    'Correspondencia Oficial',
    'Oficios, memorandos, notas internas y comunicaciones oficiales entre unidades municipales.',
    FALSE, TRUE
),
(
    'Obras y Proyectos de Infraestructura',
    'Expedientes de obras municipales, planos, memorias de cálculo, informes de avance y supervisión.',
    FALSE, TRUE
),
(
    'Servicios Municipales',
    'Documentos relacionados con servicios de agua potable, drenajes, rastro, mercado, cementerio y otros servicios.',
    FALSE, TRUE
),
(
    'Gestión Ambiental y Recursos Naturales',
    'Licencias ambientales, estudios de impacto ambiental, planes de manejo de recursos naturales del municipio.',
    FALSE, TRUE
);
