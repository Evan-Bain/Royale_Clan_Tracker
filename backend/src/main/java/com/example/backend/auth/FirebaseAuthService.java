package com.example.backend.auth;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class FirebaseAuthService {
    private final ObjectProvider<FirebaseAuth> firebaseAuthProvider;

    public FirebaseAuthService(ObjectProvider<FirebaseAuth> firebaseAuthProvider) {
        this.firebaseAuthProvider = firebaseAuthProvider;
    }

    public AuthenticatedUser verify(String authorizationHeader) {
        FirebaseAuth firebaseAuth = firebaseAuthProvider.getIfAvailable();

        if (firebaseAuth == null) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Firebase is not configured."
            );
        }

        String idToken = getBearerToken(authorizationHeader);

        try {
            FirebaseToken decodedToken = firebaseAuth.verifyIdToken(idToken);
            return new AuthenticatedUser(
                    decodedToken.getUid(),
                    decodedToken.getEmail(),
                    decodedToken.getName()
            );
        } catch (FirebaseAuthException exception) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid Firebase token.");
        }
    }

    private String getBearerToken(String authorizationHeader) {
        if (authorizationHeader == null || authorizationHeader.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Missing " + HttpHeaders.AUTHORIZATION + " header."
            );
        }

        String prefix = "Bearer ";
        if (!authorizationHeader.startsWith(prefix)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Expected Bearer token."
            );
        }

        return authorizationHeader.substring(prefix.length()).trim();
    }
}
