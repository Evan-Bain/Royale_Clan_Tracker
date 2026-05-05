package com.example.backend.auth;

public record AuthenticatedUser(
        String uid,
        String email,
        String displayName
) {}
