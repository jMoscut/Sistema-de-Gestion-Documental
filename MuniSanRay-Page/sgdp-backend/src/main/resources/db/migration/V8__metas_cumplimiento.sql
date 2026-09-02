-- V8: Metas dinámicas de cumplimiento por módulo

CREATE TABLE metas_cumplimiento (
    id           SERIAL PRIMARY KEY,
    modulo       VARCHAR(60)  NOT NULL UNIQUE,
    etiqueta     VARCHAR(120) NOT NULL,
    tipo_metrica VARCHAR(40)  NOT NULL,
    seccion      VARCHAR(50),
    meta_valor   INTEGER      NOT NULL DEFAULT 100,
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Módulos LAIP (información de oficio, Art. 10) — meta = total categorías existentes
INSERT INTO metas_cumplimiento (modulo, etiqueta, tipo_metrica, seccion, meta_valor) VALUES
  ('LAIP',              'Información de Oficio (Art. 10 LAIP)',  'CATEGORIAS_CON_CONTENIDO', 'LAIP',             29),
  ('COMUDE',            'Transparencia COMUDE',                  'CATEGORIAS_CON_CONTENIDO', 'COMUDE',            6),
  ('DECRETO_101_97',    'Decreto 101-97 (Transparencia Fiscal)', 'CATEGORIAS_CON_CONTENIDO', 'DECRETO_101_97',    8),
  ('PRESUPUESTARIA',    'Transparencia Presupuestaria',          'CATEGORIAS_CON_CONTENIDO', 'PRESUPUESTARIA',    4),
  ('SINACIG',           'Control Interno (SINACIG)',             'CATEGORIAS_CON_CONTENIDO', 'SINACIG',           4),
  ('RENDICION_CUENTAS', 'Rendición de Cuentas',                  'CATEGORIAS_CON_CONTENIDO', 'RENDICION_CUENTAS', 4),
  ('DECRETO_36_2024',   'Decreto 36-2024 (Declaraciones)',       'CATEGORIAS_CON_CONTENIDO', 'DECRETO_36_2024',   3),
-- Módulos basados en conteos generales
  ('DOCUMENTOS_TOTAL',  'Repositorio Documental',               'TOTAL_DOCUMENTOS',         NULL,              100),
  ('SOLICITUDES_RESP',  'Solicitudes Respondidas LAIP',         'SOLICITUDES_RESPONDIDAS',  NULL,               50);
