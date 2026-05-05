package com.example.backend.user;

public record ClanSnapshotResponse(
        String id,
        Long capturedAtMillis,
        String gameId,
        String clanTag,
        String clanName,
        Integer clanScore,
        Integer clanWarTrophies,
        Integer memberCount,
        Integer totalDonations,
        Integer totalDonationsReceived,
        Integer healthScore
) {}
