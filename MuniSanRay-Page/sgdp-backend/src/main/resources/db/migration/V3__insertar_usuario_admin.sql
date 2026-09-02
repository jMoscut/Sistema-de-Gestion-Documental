-- ============================================================
-- V3: Insertar usuario administrador inicial
-- ============================================================
-- Contraseña: Admin@2026!
-- BCrypt factor 12
-- IMPORTANTE: El usuario debe cambiar la contraseña en el primer inicio de sesión
-- El hash BCrypt puede variar entre implementaciones; si no funciona,
-- el DataInitializer de Spring Boot lo regenerará correctamente en el arranque.
-- ============================================================

INSERT INTO usuarios (
    nombre_completo,
    correo_electronico,
    contrasena_hash,
    rol,
    unidad_municipal,
    requiere_cambio_contrasena,
    activo
) VALUES (
    'Administrador del Sistema',
    'admin@sanraymundo.gob.gt',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMiuiSn9GEeZbCJ9t9T8y3o9J6',
    'ADMINISTRADOR',
    'Informática',
    TRUE,
    TRUE
) ON CONFLICT (correo_electronico) DO NOTHING;

-- Registrar en historial de contraseñas
INSERT INTO historial_contrasenas (usuario_id, contrasena_hash, created_at)
SELECT id, contrasena_hash, created_at
FROM usuarios
WHERE correo_electronico = 'admin@sanraymundo.gob.gt'
ON CONFLICT DO NOTHING;
