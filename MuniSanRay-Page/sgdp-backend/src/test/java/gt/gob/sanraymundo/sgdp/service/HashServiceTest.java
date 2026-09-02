package gt.gob.sanraymundo.sgdp.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

@ExtendWith(MockitoExtension.class)
class HashServiceTest {

    @InjectMocks
    private HashService hashService;

    @Test
    void sha256_mismoContenido_retornaMismoHash() {
        byte[] contenido = "documento-de-prueba".getBytes(StandardCharsets.UTF_8);
        assertThat(hashService.sha256(contenido)).isEqualTo(hashService.sha256(contenido));
    }

    @Test
    void sha256_contenidoDiferente_retornaHashDistinto() {
        byte[] a = "doc-original".getBytes(StandardCharsets.UTF_8);
        byte[] b = "doc-modificado".getBytes(StandardCharsets.UTF_8);
        assertThat(hashService.sha256(a)).isNotEqualTo(hashService.sha256(b));
    }

    @Test
    void sha256_retorna64HexChars() {
        String hash = hashService.sha256("test".getBytes(StandardCharsets.UTF_8));
        assertThat(hash).hasSize(64).matches("[a-f0-9]+");
    }

    @Test
    void sha256_arrayVacio_noLanzaExcepcion() {
        assertThatCode(() -> hashService.sha256(new byte[0])).doesNotThrowAnyException();
    }

    @Test
    void sha256_bytesUTF8_determinista() {
        String texto = "municipalidad-san-raymundo";
        byte[] bytes = texto.getBytes(StandardCharsets.UTF_8);
        assertThat(hashService.sha256(bytes)).hasSize(64).matches("[a-f0-9]+");
    }

    @Test
    void sha256_mismoInput_siempreRetornaMismoValor() {
        byte[] abc = "abc".getBytes(StandardCharsets.UTF_8);
        String hash1 = hashService.sha256(abc);
        String hash2 = hashService.sha256(abc);
        assertThat(hash1).isEqualTo(hash2).hasSize(64).matches("[a-f0-9]+");
    }
}
