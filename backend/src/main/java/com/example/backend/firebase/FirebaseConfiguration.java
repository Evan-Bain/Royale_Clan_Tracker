package com.example.backend.firebase;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

@Configuration
@ConditionalOnProperty(name = "firebase.enabled", havingValue = "true")
public class FirebaseConfiguration {

    @Bean
    public FirebaseApp firebaseApp(
            @Value("${firebase.project-id:}") String projectId,
            @Value("${firebase.credentials.path:}") String credentialsPath
    ) throws IOException {
        if (!FirebaseApp.getApps().isEmpty()) {
            return FirebaseApp.getInstance();
        }

        FirebaseOptions.Builder optionsBuilder = FirebaseOptions.builder()
                .setCredentials(loadCredentials(credentialsPath));

        if (projectId != null && !projectId.isBlank()) {
            optionsBuilder.setProjectId(projectId);
        }

        return FirebaseApp.initializeApp(optionsBuilder.build());
    }

    private GoogleCredentials loadCredentials(String credentialsPath) throws IOException {
        if (credentialsPath == null || credentialsPath.isBlank()) {
            return GoogleCredentials.getApplicationDefault();
        }

        try (InputStream credentialsStream = new FileInputStream(credentialsPath.trim())) {
            return GoogleCredentials.fromStream(credentialsStream);
        }
    }

    @Bean
    public FirebaseAuth firebaseAuth(FirebaseApp firebaseApp) {
        return FirebaseAuth.getInstance(firebaseApp);
    }

    @Bean
    public Firestore firestore(FirebaseApp firebaseApp) {
        return FirestoreClient.getFirestore(firebaseApp);
    }
}
