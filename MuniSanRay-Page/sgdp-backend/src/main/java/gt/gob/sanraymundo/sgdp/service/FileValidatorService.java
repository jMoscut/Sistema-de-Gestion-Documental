package gt.gob.sanraymundo.sgdp.service;

import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfReader;
import gt.gob.sanraymundo.sgdp.exception.NegocioException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.util.Set;

@Slf4j
@Service
public class FileValidatorService {

    private static final byte[] MAGIC_PDF  = {0x25, 0x50, 0x44, 0x46};             // %PDF
    private static final byte[] MAGIC_ZIP  = {0x50, 0x4B, 0x03, 0x04};             // PK (ZIP — DOCX/XLSX)
    private static final byte[] MAGIC_OLE2 = {(byte)0xD0, (byte)0xCF, 0x11, (byte)0xE0}; // OLE2 (DOC/XLS)

    private static final long MAX_BYTES = 25L * 1024 * 1024;

    private static final Set<String> TIPOS_DOC = Set.of(
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    /** Valida archivos del repositorio de documentos (PDF, DOC, DOCX, XLS, XLSX). */
    public void validarDocumento(byte[] bytes, String contentType) {
        checkNotEmpty(bytes);
        checkSize(bytes);
        checkTipoPermitido(contentType, TIPOS_DOC, "PDF, DOC, DOCX, XLS o XLSX");
        checkMagicBytes(bytes, contentType);
        checkNotEncrypted(bytes, contentType);
    }

    /** Valida archivos de oficios LAIP (solo PDF). */
    public void validarOficioPdf(byte[] bytes, String contentType) {
        checkNotEmpty(bytes);
        checkSize(bytes);
        if (!"application/pdf".equals(contentType)) {
            throw new NegocioException("Solo se permiten archivos PDF.");
        }
        checkMagicBytes(bytes, contentType);
        checkNotEncrypted(bytes, contentType);
    }

    // ── Checks internos ───────────────────────────────────────────────────────

    private void checkNotEmpty(byte[] bytes) {
        if (bytes == null || bytes.length == 0) {
            throw new NegocioException("El archivo está vacío.");
        }
    }

    private void checkSize(byte[] bytes) {
        if (bytes.length > MAX_BYTES) {
            throw new NegocioException("El archivo supera el tamaño máximo de 25 MB.");
        }
    }

    private void checkTipoPermitido(String contentType, Set<String> permitidos, String etiqueta) {
        if (contentType == null || !permitidos.contains(contentType)) {
            throw new NegocioException(
                "Tipo de archivo no permitido: " + contentType + ". Use " + etiqueta + ".");
        }
    }

    private void checkMagicBytes(byte[] bytes, String contentType) {
        if (bytes.length < 4) {
            throw new NegocioException("El archivo es demasiado pequeño para ser válido.");
        }
        switch (contentType) {
            case "application/pdf" -> {
                if (!startsWith(bytes, MAGIC_PDF))
                    throw new NegocioException("El contenido del archivo no corresponde a un PDF válido.");
            }
            case "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                 "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" -> {
                if (!startsWith(bytes, MAGIC_ZIP) && !startsWith(bytes, MAGIC_OLE2))
                    throw new NegocioException("El contenido del archivo no corresponde a un documento Office válido.");
            }
            case "application/msword",
                 "application/vnd.ms-excel" -> {
                if (!startsWith(bytes, MAGIC_OLE2))
                    throw new NegocioException("El contenido del archivo no corresponde a un documento Office válido.");
            }
            default -> throw new NegocioException("Tipo de archivo no reconocido: " + contentType);
        }
    }

    private void checkNotEncrypted(byte[] bytes, String contentType) {
        switch (contentType) {
            case "application/pdf" -> checkPdfNotEncrypted(bytes);
            case "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                 "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" -> {
                // DOCX/XLSX cifrados se envuelven en contenedor OLE2
                if (startsWith(bytes, MAGIC_OLE2)) {
                    throw new NegocioException(
                        "El archivo está cifrado o protegido con contraseña. " +
                        "Elimine la protección antes de subirlo.");
                }
            }
            // DOC/XLS: siempre OLE2, detectar cifrado requiere parsear estructura interna — omitido
        }
    }

    private void checkPdfNotEncrypted(byte[] bytes) {
        try (PdfReader reader = new PdfReader(new ByteArrayInputStream(bytes))) {
            reader.setUnethicalReading(true);
            try (PdfDocument pdf = new PdfDocument(reader)) {
                if (reader.isEncrypted()) {
                    throw new NegocioException(
                        "El PDF está cifrado o protegido con contraseña. " +
                        "Elimine la protección antes de subirlo.");
                }
                if (pdf.getNumberOfPages() == 0) {
                    throw new NegocioException("El PDF no contiene páginas.");
                }
            }
        } catch (NegocioException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Error al verificar PDF: {}", e.getMessage());
            throw new NegocioException(
                "El PDF no pudo ser leído. Verifique que no esté dañado o protegido con contraseña.");
        }
    }

    private static boolean startsWith(byte[] bytes, byte[] magic) {
        if (bytes.length < magic.length) return false;
        for (int i = 0; i < magic.length; i++) {
            if (bytes[i] != magic[i]) return false;
        }
        return true;
    }
}
