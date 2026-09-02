-- V5: Agregar soporte de archivos PDF a publicaciones de oficio
ALTER TABLE informacion_oficio
    ADD COLUMN archivo_r2_key  VARCHAR(500),
    ADD COLUMN archivo_nombre  VARCHAR(300);
