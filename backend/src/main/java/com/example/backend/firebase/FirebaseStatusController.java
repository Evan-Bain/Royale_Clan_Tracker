package com.example.backend.firebase;

import com.google.cloud.firestore.Firestore;
import com.google.firebase.FirebaseApp;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

@RestController
@RequestMapping("/api/firebase")
@CrossOrigin(origins = "http://localhost:5173")
public class FirebaseStatusController {
    private final ObjectProvider<FirebaseApp> firebaseAppProvider;
    private final ObjectProvider<Firestore> firestoreProvider;
    private final String credentialsPath;
    private final String projectId;

    public FirebaseStatusController(
            ObjectProvider<FirebaseApp> firebaseAppProvider,
            ObjectProvider<Firestore> firestoreProvider,
            @Value("${firebase.credentials.path:}") String credentialsPath,
            @Value("${firebase.project-id:}") String projectId
    ) {
        this.firebaseAppProvider = firebaseAppProvider;
        this.firestoreProvider = firestoreProvider;
        this.credentialsPath = credentialsPath;
        this.projectId = projectId;
    }

    @GetMapping("/status")
    public FirebaseStatus status() {
        FirebaseApp firebaseApp = firebaseAppProvider.getIfAvailable();
        Firestore firestore = firestoreProvider.getIfAvailable();

        return new FirebaseStatus(
                firebaseApp != null,
                firestore != null,
                projectId,
                credentialsPath == null || credentialsPath.isBlank() ? "missing" : "set",
                credentialsPath != null && !credentialsPath.isBlank() && Files.exists(Path.of(credentialsPath)),
                readClientEmail(credentialsPath)
        );
    }

    private String readClientEmail(String path) {
        if (path == null || path.isBlank()) {
            return "";
        }

        try {
            String json = Files.readString(Path.of(path));
            String marker = "\"client_email\":";
            int markerIndex = json.indexOf(marker);
            if (markerIndex < 0) {
                return "";
            }

            int firstQuote = json.indexOf('"', markerIndex + marker.length());
            int secondQuote = json.indexOf('"', firstQuote + 1);
            return firstQuote < 0 || secondQuote < 0 ? "" : json.substring(firstQuote + 1, secondQuote);
        } catch (IOException exception) {
            return "";
        }
    }

    public record FirebaseStatus(
            boolean firebaseAppLoaded,
            boolean firestoreLoaded,
            String projectId,
            String credentialsPath,
            boolean credentialsFileFound,
            String serviceAccountEmail
    ) {}
}
