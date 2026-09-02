-- ============================================================
-- V4: Índices adicionales para rendimiento
-- ============================================================

-- Índices en usuarios
CREATE INDEX IF NOT EXISTS idx_usuarios_correo ON usuarios(correo_electronico);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);
CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON usuarios(activo) WHERE activo = TRUE;

-- Índices en versiones_documento
CREATE INDEX IF NOT EXISTS idx_versiones_doc ON versiones_documento(documento_id, numero_version);
CREATE INDEX IF NOT EXISTS idx_versiones_creado_por ON versiones_documento(creado_por);

-- Índices en historial_contrasenas
CREATE INDEX IF NOT EXISTS idx_historial_usuario ON historial_contrasenas(usuario_id, created_at DESC);

-- Índices en solicitudes_informacion
CREATE INDEX IF NOT EXISTS idx_solicitudes_codigo ON solicitudes_informacion(codigo_expediente);
CREATE INDEX IF NOT EXISTS idx_solicitudes_dpi ON solicitudes_informacion(dpi_solicitante);
CREATE INDEX IF NOT EXISTS idx_solicitudes_fecha_recepcion ON solicitudes_informacion(fecha_recepcion DESC);

-- Índices en informacion_oficio
CREATE INDEX IF NOT EXISTS idx_oficio_published ON informacion_oficio(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_oficio_publicado_por ON informacion_oficio(publicado_por);

-- Índices en registro_auditoria (adicionales)
CREATE INDEX IF NOT EXISTS idx_auditoria_resultado ON registro_auditoria(resultado);
CREATE INDEX IF NOT EXISTS idx_auditoria_ip ON registro_auditoria(ip_origen);
