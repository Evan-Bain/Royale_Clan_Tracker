package com.example.backend.user;

public record ClaimedClanResponse(
        String gameId,
        String clanTag,
        String clanName,
        Long claimedAtMillis,
        Long updatedAtMillis,
        Long lastSnapshotAtMillis
) {
    public static ClaimedClanResponse empty() {
        return new ClaimedClanResponse(null, null, null, null, null, null);
    }
}
