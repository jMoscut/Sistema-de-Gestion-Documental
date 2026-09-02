-- V11: Login por nombre_usuario en vez de correo_electronico
-- Municipalidad de San Raymundo, Guatemala
-- correo_electronico pasa a ser opcional (solo información de contacto)

ALTER TABLE usuarios ADD COLUMN nombre_usuario VARCHAR(50);

-- Backfill: parte local del correo, saneada; si no cumple el patrón mínimo, usuario<id>
UPDATE usuarios
SET nombre_usuario = regexp_replace(split_part(correo_electronico, '@', 1), '[^A-Za-z0-9_.\-]', '', 'g')
WHERE nombre_usuario IS NULL;

UPDATE usuarios
SET nombre_usuario = 'usuario' || id
WHERE nombre_usuario IS NULL
   OR nombre_usuario !~ '^[A-Za-z][A-Za-z0-9_.\-]{3,49}$';

-- Resolver colisiones de unicidad tras el saneo, agregando sufijo del id
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT id, nombre_usuario,
           ROW_NUMBER() OVER (PARTITION BY nombre_usuario ORDER BY id) AS rn
    FROM usuarios
  LOOP
    IF r.rn > 1 THEN
      UPDATE usuarios SET nombre_usuario = nombre_usuario || r.id WHERE id = r.id;
    END IF;
  END LOOP;
END $$;

ALTER TABLE usuarios ALTER COLUMN nombre_usuario SET NOT NULL;
ALTER TABLE usuarios ADD CONSTRAINT usuarios_nombre_usuario_key UNIQUE (nombre_usuario);
ALTER TABLE usuarios ADD CONSTRAINT usuarios_nombre_usuario_check
    CHECK (nombre_usuario ~ '^[A-Za-z][A-Za-z0-9_.\-]{3,49}$');

ALTER TABLE usuarios ALTER COLUMN correo_electronico DROP NOT NULL;

CREATE INDEX idx_usuarios_nombre_usuario ON usuarios(nombre_usuario);
