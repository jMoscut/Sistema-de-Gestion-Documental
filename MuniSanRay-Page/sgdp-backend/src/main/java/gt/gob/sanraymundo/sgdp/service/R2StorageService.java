package gt.gob.sanraymundo.sgdp.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Slf4j
@Service
@RequiredArgsConstructor
public class R2StorageService {

    private final S3Client s3Client;

    @Value("${r2.bucket-name}")
    private String bucketName;

    /**
     * Sube un objeto al bucket R2/S3.
     *
     * @param key         clave del objeto en el bucket (ruta completa)
     * @param data        contenido del archivo como bytes
     * @param contentType tipo MIME del archivo
     */
    public void upload(String key, byte[] data, String contentType) {
        try {
            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .contentType(contentType)
                    .contentLength((long) data.length)
                    .build();

            s3Client.putObject(request, RequestBody.fromBytes(data));
            log.debug("Archivo subido a R2: {}", key);
        } catch (Exception e) {
            log.error("Error al subir archivo a R2 [key={}]: {}", key, e.getMessage());
            throw new RuntimeException("Error R2: " + e.getMessage());
        }
    }

    /**
     * Descarga un objeto del bucket R2/S3.
     *
     * @param key clave del objeto en el bucket
     * @return stream de respuesta con el contenido del archivo
     */
    public ResponseInputStream<GetObjectResponse> download(String key) {
        try {
            GetObjectRequest request = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();

            return s3Client.getObject(request);
        } catch (Exception e) {
            log.error("Error al descargar archivo de R2 [key={}]: {}", key, e.getMessage());
            throw new RuntimeException("Error R2: " + e.getMessage());
        }
    }

    /**
     * Descarga un objeto completo a memoria como byte[]. Usado para verificación SHA-256.
     */
    public byte[] downloadBytes(String key) {
        try {
            GetObjectRequest request = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();
            try (ResponseInputStream<GetObjectResponse> stream = s3Client.getObject(request)) {
                return stream.readAllBytes();
            }
        } catch (Exception e) {
            log.error("Error al descargar bytes de R2 [key={}]: {}", key, e.getMessage());
            throw new RuntimeException("Error R2: " + e.getMessage());
        }
    }

    /**
     * Elimina un objeto del bucket R2/S3.
     *
     * @param key clave del objeto en el bucket
     */
    public void delete(String key) {
        try {
            DeleteObjectRequest request = DeleteObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .build();

            s3Client.deleteObject(request);
            log.debug("Archivo eliminado de R2: {}", key);
        } catch (Exception e) {
            log.error("Error al eliminar archivo de R2 [key={}]: {}", key, e.getMessage());
            throw new RuntimeException("Error R2: " + e.getMessage());
        }
    }
}
