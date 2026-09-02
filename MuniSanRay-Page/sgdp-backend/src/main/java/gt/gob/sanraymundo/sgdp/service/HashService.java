package gt.gob.sanraymundo.sgdp.service;

import org.springframework.stereotype.Service;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

@Service
public class HashService {

    /**
     * Calcula el hash SHA-256 de un arreglo de bytes y lo retorna como cadena hexadecimal.
     *
     * @param data bytes a hashear
     * @return hash SHA-256 en formato hexadecimal (64 caracteres)
     */
    public String sha256(byte[] data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data);
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 no está disponible en esta JVM", e);
        }
    }

}
