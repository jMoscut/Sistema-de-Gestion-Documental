package gt.gob.sanraymundo.sgdp.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;

import java.net.URI;

@Configuration
public class R2Config {

    @Value("${r2.access-key}")
    private String accessKey;

    @Value("${r2.secret-key}")
    private String secretKey;

    @Value("${r2.endpoint}")
    private String endpoint;

    /**
     * S3Client compatible con Cloudflare R2 (en producción) y MinIO (en local).
     * Usa path-style access y la región us-east-1 como requerido por R2.
     */
    @Bean
    public S3Client s3Client() {
        AwsBasicCredentials credentials = AwsBasicCredentials.create(accessKey, secretKey);

        return S3Client.builder()
                .region(Region.US_EAST_1)
                .credentialsProvider(StaticCredentialsProvider.create(credentials))
                .endpointOverride(URI.create(endpoint))
                .serviceConfiguration(S3Configuration.builder()
                        .pathStyleAccessEnabled(true)
                        .build())
                .build();
    }
}
