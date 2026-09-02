-- V9: Ciclo de vida documental, SHA-256 oficio, seguridad auditoria
-- Municipalidad de San Raymundo, Guatemala

-- ============================================================
-- 1. Ampliar CHECK de estado en documentos para ARCHIVADO
-- ============================================================
DO $$
DECLARE
  cname TEXT;
BEGIN
  SELECT conname INTO cname
  FROM pg_constraint
  WHERE conrelid = 'documentos'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%estado%';
  IF cname IS NOT NULL THEN
    EXECUTE 'ALTER TABLE documentos DROP CONSTRAINT ' || quote_ident(cname);
  END IF;
END $$;

ALTER TABLE documentos
  ADD CONSTRAINT documentos_estado_check
    CHECK (estado IN ('VIGENTE', 'OBSOLETO', 'BORRADOR', 'ARCHIVADO'));

-- ============================================================
-- 2. Hash SHA-256 para documentos de oficio (RN-10)
--    Nullable: archivos existentes no tienen hash calculado
-- ============================================================
ALTER TABLE documento_oficio
  ADD COLUMN IF NOT EXISTS hash_sha256 VARCHAR(64);

COMMENT ON COLUMN documento_oficio.hash_sha256
  IS 'Hash SHA-256 del PDF para verificación de integridad (RN-10). NULL en registros anteriores a V9.';

-- ============================================================
-- 3. Seguridad: auditoria APPEND-ONLY
--    El usuario de aplicación no puede modificar ni borrar registros de auditoria
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'sgdp_app') THEN
    REVOKE UPDATE, DELETE ON TABLE registro_auditoria FROM sgdp_app;
  END IF;
END $$;
