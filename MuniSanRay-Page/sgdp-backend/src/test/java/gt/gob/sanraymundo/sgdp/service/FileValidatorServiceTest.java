package gt.gob.sanraymundo.sgdp.service;

import gt.gob.sanraymundo.sgdp.exception.NegocioException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@ExtendWith(MockitoExtension.class)
class FileValidatorServiceTest {

    @InjectMocks
    private FileValidatorService fileValidatorService;

    private static final byte[] PDF_MAGIC  = {0x25, 0x50, 0x44, 0x46};
    private static final byte[] ZIP_MAGIC  = {0x50, 0x4B, 0x03, 0x04};
    private static final byte[] OLE2_MAGIC = {(byte)0xD0, (byte)0xCF, 0x11, (byte)0xE0};

    private byte[] bytesConMagic(byte[] magic) {
        byte[] b = new byte[64];
        System.arraycopy(magic, 0, b, 0, magic.length);
        return b;
    }

    // ── validarOficioPdf ─────────────────────────────────────────────────────

    @Test
    void validarOficioPdf_archivoVacio_lanzaExcepcion() {
        assertThatThrownBy(() -> fileValidatorService.validarOficioPdf(new byte[0], "application/pdf"))
                .isInstanceOf(NegocioException.class)
                .hasMessageContaining("vacío");
    }

    @Test
    void validarOficioPdf_tipoNoEsPdf_lanzaExcepcion() {
        assertThatThrownBy(() -> fileValidatorService.validarOficioPdf(
                bytesConMagic(OLE2_MAGIC), "application/msword"))
                .isInstanceOf(NegocioException.class)
                .hasMessageContaining("PDF");
    }

    @Test
    void validarOficioPdf_magicBytesIncorrectos_lanzaExcepcion() {
        byte[] bytes = new byte[64]; // todos ceros, no %PDF
        assertThatThrownBy(() -> fileValidatorService.validarOficioPdf(bytes, "application/pdf"))
                .isInstanceOf(NegocioException.class)
                .hasMessageContaining("PDF válido");
    }

    @Test
    void validarOficioPdf_archivoDemasiado_pequenio_lanzaExcepcion() {
        byte[] bytes = {0x25, 0x50}; // solo 2 bytes
        assertThatThrownBy(() -> fileValidatorService.validarOficioPdf(bytes, "application/pdf"))
                .isInstanceOf(NegocioException.class);
    }

    @Test
    void validarOficioPdf_pdfConMagicCorrectoPeroDaniado_lanzaExcepcionLectura() {
        // Magic %PDF correcto pero no es un PDF real → iText falla → NegocioException
        byte[] bytes = bytesConMagic(PDF_MAGIC);
        assertThatThrownBy(() -> fileValidatorService.validarOficioPdf(bytes, "application/pdf"))
                .isInstanceOf(NegocioException.class);
    }

    // ── validarDocumento ─────────────────────────────────────────────────────

    @Test
    void validarDocumento_archivoVacio_lanzaExcepcion() {
        assertThatThrownBy(() -> fileValidatorService.validarDocumento(new byte[0], "application/pdf"))
                .isInstanceOf(NegocioException.class)
                .hasMessageContaining("vacío");
    }

    @Test
    void validarDocumento_tipoNoPermitido_lanzaExcepcion() {
        assertThatThrownBy(() -> fileValidatorService.validarDocumento(
                bytesConMagic(PDF_MAGIC), "image/jpeg"))
                .isInstanceOf(NegocioException.class)
                .hasMessageContaining("no permitido");
    }

    @Test
    void validarDocumento_pdfConMagicIncorrecto_lanzaExcepcion() {
        // content-type PDF pero magic bytes OLE2 → falla validación de magic
        assertThatThrownBy(() -> fileValidatorService.validarDocumento(
                bytesConMagic(OLE2_MAGIC), "application/pdf"))
                .isInstanceOf(NegocioException.class)
                .hasMessageContaining("PDF válido");
    }

    @Test
    void validarDocumento_docxConMagicOLE2_lanzaExcepcionCifrado() {
        assertThatThrownBy(() -> fileValidatorService.validarDocumento(
                bytesConMagic(OLE2_MAGIC),
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"))
                .isInstanceOf(NegocioException.class)
                .hasMessageContaining("cifrado");
    }

    @Test
    void validarDocumento_xlsxConMagicOLE2_lanzaExcepcionCifrado() {
        assertThatThrownBy(() -> fileValidatorService.validarDocumento(
                bytesConMagic(OLE2_MAGIC),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .isInstanceOf(NegocioException.class)
                .hasMessageContaining("cifrado");
    }

    @Test
    void validarDocumento_docConMagicOLE2_pasaValidacion() {
        // DOC siempre es OLE2; no hay detección de cifrado para DOC/XLS
        assertThatCode(() -> fileValidatorService.validarDocumento(
                bytesConMagic(OLE2_MAGIC), "application/msword"))
                .doesNotThrowAnyException();
    }

    @Test
    void validarDocumento_xlsConMagicOLE2_pasaValidacion() {
        assertThatCode(() -> fileValidatorService.validarDocumento(
                bytesConMagic(OLE2_MAGIC), "application/vnd.ms-excel"))
                .doesNotThrowAnyException();
    }

    @Test
    void validarDocumento_docxConMagicZIP_pasaMagicYEncryptionCheck() {
        // DOCX con ZIP magic = no cifrado → pasa magic + encryption; iText no corre para DOCX
        assertThatCode(() -> fileValidatorService.validarDocumento(
                bytesConMagic(ZIP_MAGIC),
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"))
                .doesNotThrowAnyException();
    }

    @Test
    void validarDocumento_xlsxConMagicZIP_pasaMagicYEncryptionCheck() {
        assertThatCode(() -> fileValidatorService.validarDocumento(
                bytesConMagic(ZIP_MAGIC),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .doesNotThrowAnyException();
    }

    @Test
    void validarDocumento_archivoDemasiado_pequenio_lanzaExcepcion() {
        byte[] bytes = {0x50, 0x4B}; // 2 bytes
        assertThatThrownBy(() -> fileValidatorService.validarDocumento(bytes,
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"))
                .isInstanceOf(NegocioException.class);
    }

    @Test
    void validarDocumento_docxConMagicIncorrecto_lanzaExcepcion() {
        byte[] bytes = new byte[64]; // todos ceros, ni ZIP ni OLE2
        assertThatThrownBy(() -> fileValidatorService.validarDocumento(bytes,
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"))
                .isInstanceOf(NegocioException.class)
                .hasMessageContaining("Office válido");
    }
}
