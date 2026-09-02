-- V10: Simplifica nivel_acceso a solo PUBLICO/INTERNO
-- Municipalidad de San Raymundo, Guatemala

-- ============================================================
-- 1. Reclasificar RESERVADO/CONFIDENCIAL como INTERNO
-- ============================================================
UPDATE documentos SET nivel_acceso = 'INTERNO' WHERE nivel_acceso IN ('RESERVADO', 'CONFIDENCIAL');

-- ============================================================
-- 2. Reemplazar CHECK de nivel_acceso
-- ============================================================
DO $$
DECLARE
  cname TEXT;
BEGIN
  SELECT conname INTO cname
  FROM pg_constraint
  WHERE conrelid = 'documentos'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%nivel_acceso%';
  IF cname IS NOT NULL THEN
    EXECUTE 'ALTER TABLE documentos DROP CONSTRAINT ' || quote_ident(cname);
  END IF;
END $$;

ALTER TABLE documentos
  ADD CONSTRAINT documentos_nivel_acceso_check
    CHECK (nivel_acceso IN ('PUBLICO', 'INTERNO'));

-- ============================================================
-- 3. Eliminar columnas de clasificación reservada (ya no aplica)
-- ============================================================
ALTER TABLE documentos DROP COLUMN IF EXISTS clasificacion_reservada_causal;
ALTER TABLE documentos DROP COLUMN IF EXISTS clasificacion_reservada_hasta;
