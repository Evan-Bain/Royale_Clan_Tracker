package com.example.backend.user;

import com.example.backend.adapter.GameAdapter;
import com.example.backend.adapter.clash_royale.ClashRoyaleAdapter;
import com.example.backend.adapter.clash_royale.dto.ClashCurrentRiverRaceResponse;
import com.example.backend.auth.AuthenticatedUser;
import com.example.backend.auth.FirebaseAuthService;
import com.example.backend.model.dto.GroupDto;
import com.example.backend.model.dto.MemberDto;
import com.example.backend.model.dto.MembersDto;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.FieldValue;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.SetOptions;
import com.google.cloud.firestore.WriteBatch;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class UserClanService {
    private static final String DEFAULT_GAME_ID = "clash-royale";

    private final Map<String, GameAdapter> adapters;
    private final FirebaseAuthService firebaseAuthService;
    private final ObjectProvider<Firestore> firestoreProvider;

    public UserClanService(
            Map<String, GameAdapter> adapters,
            FirebaseAuthService firebaseAuthService,
            ObjectProvider<Firestore> firestoreProvider
    ) {
        this.adapters = adapters;
        this.firebaseAuthService = firebaseAuthService;
        this.firestoreProvider = firestoreProvider;
    }

    public ClaimedClanResponse getClaimedClan(String authorizationHeader) {
        AuthenticatedUser user = firebaseAuthService.verify(authorizationHeader);
        Firestore firestore = getFirestore();

        try {
            DocumentSnapshot snapshot = claimedClanReference(firestore, user.uid(), DEFAULT_GAME_ID)
                    .get()
                    .get();

            if (!snapshot.exists()) {
                return ClaimedClanResponse.empty();
            }

            return toClaimedClanResponse(snapshot);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw storageException(exception);
        } catch (ExecutionException exception) {
            throw storageException(exception);
        }
    }

    public ClaimedClanResponse claimClan(String authorizationHeader, ClaimClanRequest request) {
        AuthenticatedUser user = firebaseAuthService.verify(authorizationHeader);
        Firestore firestore = getFirestore();
        String gameId = normalizeGameId(request.gameId());
        String clanTag = normalizeClanTag(request.clanTag());
        GameAdapter adapter = adapters.get(gameId);

        if (adapter == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported game.");
        }

        GroupDto clan = adapter.getGroup(clanTag);
        MembersDto members = adapter.getMembers(clanTag);
        ClashCurrentRiverRaceResponse riverRace = getRiverRace(adapter, clanTag);
        long now = Instant.now().toEpochMilli();
        String trackedClanId = trackedClanDocumentId(gameId, clanTag);
        Map<String, Object> snapshot = buildSnapshot(gameId, clanTag, clan, members, riverRace, now);

        Map<String, Object> userDocument = new HashMap<>();
        userDocument.put("uid", user.uid());
        userDocument.put("email", user.email());
        userDocument.put("displayName", user.displayName());
        userDocument.put("updatedAt", FieldValue.serverTimestamp());
        userDocument.put("updatedAtMillis", now);

        Map<String, Object> claimDocument = new HashMap<>();
        claimDocument.put("gameId", gameId);
        claimDocument.put("clanTag", clanTag);
        claimDocument.put("clanName", clan.name());
        claimDocument.put("trackedClanId", trackedClanId);
        claimDocument.put("claimedAt", FieldValue.serverTimestamp());
        claimDocument.put("claimedAtMillis", now);
        claimDocument.put("updatedAt", FieldValue.serverTimestamp());
        claimDocument.put("updatedAtMillis", now);
        claimDocument.put("lastSnapshotAt", FieldValue.serverTimestamp());
        claimDocument.put("lastSnapshotAtMillis", now);

        Map<String, Object> trackedClanDocument = new HashMap<>();
        trackedClanDocument.put("gameId", gameId);
        trackedClanDocument.put("clanTag", clanTag);
        trackedClanDocument.put("clanName", clan.name());
        trackedClanDocument.put("lastSnapshotAt", FieldValue.serverTimestamp());
        trackedClanDocument.put("lastSnapshotAtMillis", now);
        trackedClanDocument.put("updatedAt", FieldValue.serverTimestamp());
        trackedClanDocument.put("updatedAtMillis", now);

        try {
            WriteBatch batch = firestore.batch();
            DocumentReference userReference = firestore.collection("users").document(user.uid());
            DocumentReference claimReference = userReference.collection("claimedClans").document(gameId);
            DocumentReference trackedClanReference = firestore.collection("trackedClans").document(trackedClanId);
            DocumentReference snapshotReference = trackedClanReference
                    .collection("snapshots")
                    .document(String.valueOf(now));

            batch.set(userReference, userDocument, SetOptions.merge());
            batch.set(claimReference, claimDocument, SetOptions.merge());
            batch.set(trackedClanReference, trackedClanDocument, SetOptions.merge());
            batch.set(snapshotReference, snapshot);
            batch.commit().get();

            return new ClaimedClanResponse(gameId, clanTag, clan.name(), now, now, now);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw storageException(exception);
        } catch (ExecutionException exception) {
            throw storageException(exception);
        }
    }

    public List<ClanSnapshotResponse> getClaimedClanSnapshots(String authorizationHeader, int limit) {
        AuthenticatedUser user = firebaseAuthService.verify(authorizationHeader);
        Firestore firestore = getFirestore();
        int safeLimit = Math.max(1, Math.min(limit, 90));

        try {
            DocumentSnapshot claimSnapshot = claimedClanReference(firestore, user.uid(), DEFAULT_GAME_ID)
                    .get()
                    .get();

            if (!claimSnapshot.exists()) {
                return List.of();
            }

            String trackedClanId = claimSnapshot.getString("trackedClanId");
            if (trackedClanId == null || trackedClanId.isBlank()) {
                return List.of();
            }

            List<QueryDocumentSnapshot> documents = firestore
                    .collection("trackedClans")
                    .document(trackedClanId)
                    .collection("snapshots")
                    .orderBy("capturedAtMillis", Query.Direction.DESCENDING)
                    .limit(safeLimit)
                    .get()
                    .get()
                    .getDocuments();

            return documents.stream()
                    .map(this::toClanSnapshotResponse)
                    .toList();
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw storageException(exception);
        } catch (ExecutionException exception) {
            throw storageException(exception);
        }
    }

    public ClanSnapshotResponse saveClaimedClanSnapshot(String authorizationHeader) {
        AuthenticatedUser user = firebaseAuthService.verify(authorizationHeader);
        Firestore firestore = getFirestore();

        try {
            DocumentSnapshot claimSnapshot = claimedClanReference(firestore, user.uid(), DEFAULT_GAME_ID)
                    .get()
                    .get();

            if (!claimSnapshot.exists()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Claim a clan first.");
            }

            String gameId = claimSnapshot.getString("gameId");
            String clanTag = claimSnapshot.getString("clanTag");
            String trackedClanId = claimSnapshot.getString("trackedClanId");

            if (gameId == null || clanTag == null || trackedClanId == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Claimed clan is incomplete.");
            }

            GameAdapter adapter = adapters.get(gameId);
            if (adapter == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported game.");
            }

            GroupDto clan = adapter.getGroup(clanTag);
            MembersDto members = adapter.getMembers(clanTag);
            ClashCurrentRiverRaceResponse riverRace = getRiverRace(adapter, clanTag);
            long now = Instant.now().toEpochMilli();
            Map<String, Object> snapshot = buildSnapshot(gameId, clanTag, clan, members, riverRace, now);
            DocumentReference trackedClanReference = firestore.collection("trackedClans").document(trackedClanId);
            DocumentReference snapshotReference = trackedClanReference
                    .collection("snapshots")
                    .document(String.valueOf(now));

            Map<String, Object> snapshotUpdates = new HashMap<>();
            snapshotUpdates.put("clanName", clan.name());
            snapshotUpdates.put("lastSnapshotAt", FieldValue.serverTimestamp());
            snapshotUpdates.put("lastSnapshotAtMillis", now);
            snapshotUpdates.put("updatedAt", FieldValue.serverTimestamp());
            snapshotUpdates.put("updatedAtMillis", now);

            WriteBatch batch = firestore.batch();
            batch.set(snapshotReference, snapshot);
            batch.set(trackedClanReference, snapshotUpdates, SetOptions.merge());
            batch.set(claimSnapshot.getReference(), snapshotUpdates, SetOptions.merge());
            batch.commit().get();

            return toClanSnapshotResponse(snapshotReference.getId(), snapshot);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw storageException(exception);
        } catch (ExecutionException exception) {
            throw storageException(exception);
        }
    }

    private Firestore getFirestore() {
        Firestore firestore = firestoreProvider.getIfAvailable();

        if (firestore == null) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Firestore is not configured."
            );
        }

        return firestore;
    }

    private DocumentReference claimedClanReference(Firestore firestore, String uid, String gameId) {
        return firestore
                .collection("users")
                .document(uid)
                .collection("claimedClans")
                .document(gameId);
    }

    private ClaimedClanResponse toClaimedClanResponse(DocumentSnapshot snapshot) {
        return new ClaimedClanResponse(
                snapshot.getString("gameId"),
                snapshot.getString("clanTag"),
                snapshot.getString("clanName"),
                snapshot.getLong("claimedAtMillis"),
                snapshot.getLong("updatedAtMillis"),
                snapshot.getLong("lastSnapshotAtMillis")
        );
    }

    private ClanSnapshotResponse toClanSnapshotResponse(QueryDocumentSnapshot snapshot) {
        return new ClanSnapshotResponse(
                snapshot.getId(),
                snapshot.getLong("capturedAtMillis"),
                snapshot.getString("gameId"),
                snapshot.getString("clanTag"),
                snapshot.getString("clanName"),
                asInteger(snapshot.getLong("clanScore")),
                asInteger(snapshot.getLong("clanWarTrophies")),
                asInteger(snapshot.getLong("memberCount")),
                asInteger(snapshot.getLong("totalDonations")),
                asInteger(snapshot.getLong("totalDonationsReceived")),
                asInteger(snapshot.getLong("healthScore"))
        );
    }

    private ClanSnapshotResponse toClanSnapshotResponse(String id, Map<String, Object> snapshot) {
        return new ClanSnapshotResponse(
                id,
                asLong(snapshot.get("capturedAtMillis")),
                (String) snapshot.get("gameId"),
                (String) snapshot.get("clanTag"),
                (String) snapshot.get("clanName"),
                asInteger(snapshot.get("clanScore")),
                asInteger(snapshot.get("clanWarTrophies")),
                asInteger(snapshot.get("memberCount")),
                asInteger(snapshot.get("totalDonations")),
                asInteger(snapshot.get("totalDonationsReceived")),
                asInteger(snapshot.get("healthScore"))
        );
    }

    private Map<String, Object> buildSnapshot(
            String gameId,
            String clanTag,
            GroupDto clan,
            MembersDto members,
            ClashCurrentRiverRaceResponse riverRace,
            long now
    ) {
        List<Map<String, Object>> memberSnapshots = buildMemberSnapshots(members.members(), riverRace);
        int totalDonations = memberSnapshots.stream().mapToInt((member) -> intValue(member, "donations")).sum();
        int totalDonationsReceived = memberSnapshots.stream()
                .mapToInt((member) -> intValue(member, "donationsReceived"))
                .sum();
        int healthScore = calculateHealthScore(memberSnapshots, riverRace != null);

        Map<String, Object> snapshot = new HashMap<>();
        snapshot.put("capturedAt", FieldValue.serverTimestamp());
        snapshot.put("capturedAtMillis", now);
        snapshot.put("gameId", gameId);
        snapshot.put("clanTag", clanTag);
        snapshot.put("clanName", clan.name());
        snapshot.put("clanScore", clan.clanScore());
        snapshot.put("clanWarTrophies", clan.clanWarTrophies());
        snapshot.put("requiredTrophies", clan.requiredTrophies());
        snapshot.put("donationsPerWeek", clan.donationsPerWeek());
        snapshot.put("memberCount", clan.members());
        snapshot.put("totalDonations", totalDonations);
        snapshot.put("totalDonationsReceived", totalDonationsReceived);
        snapshot.put("healthScore", healthScore);
        snapshot.put("hasRiverRaceData", riverRace != null);
        snapshot.put("members", memberSnapshots);

        return snapshot;
    }

    private List<Map<String, Object>> buildMemberSnapshots(
            List<MemberDto> members,
            ClashCurrentRiverRaceResponse riverRace
    ) {
        Map<String, ClashCurrentRiverRaceResponse.RiverRaceParticipant> participantsByTag =
                riverRace == null || riverRace.clan() == null || riverRace.clan().participants() == null
                        ? Map.of()
                        : riverRace.clan().participants().stream()
                                .collect(Collectors.toMap(
                                        (participant) -> normalizeClanTag(participant.tag()),
                                        Function.identity(),
                                        (first, ignored) -> first
                                ));

        List<Map<String, Object>> memberSnapshots = new ArrayList<>();

        for (MemberDto member : members) {
            ClashCurrentRiverRaceResponse.RiverRaceParticipant participant =
                    participantsByTag.get(normalizeClanTag(member.tag()));
            int fame = participant == null ? 0 : participant.fame();
            int repairPoints = participant == null ? 0 : participant.repairPoints();
            int boatAttacks = participant == null ? 0 : participant.boatAttacks();
            int decksUsed = participant == null ? 0 : participant.decksUsed();
            int participationScore =
                    member.donations()
                            + member.donationsReceived()
                            + fame
                            + repairPoints
                            + boatAttacks * 100
                            + decksUsed * 50;

            Map<String, Object> memberSnapshot = new HashMap<>();
            memberSnapshot.put("tag", member.tag());
            memberSnapshot.put("name", member.name());
            memberSnapshot.put("role", member.role());
            memberSnapshot.put("trophies", member.trophies());
            memberSnapshot.put("clanRank", member.clanRank());
            memberSnapshot.put("donations", member.donations());
            memberSnapshot.put("donationsReceived", member.donationsReceived());
            memberSnapshot.put("fame", fame);
            memberSnapshot.put("repairPoints", repairPoints);
            memberSnapshot.put("boatAttacks", boatAttacks);
            memberSnapshot.put("decksUsed", decksUsed);
            memberSnapshot.put("participationScore", participationScore);
            memberSnapshots.add(memberSnapshot);
        }

        return memberSnapshots;
    }

    private int calculateHealthScore(List<Map<String, Object>> memberSnapshots, boolean hasRiverRaceData) {
        if (memberSnapshots.isEmpty()) {
            return 0;
        }

        double totalMembers = memberSnapshots.size();
        double activeMembersPercent = memberSnapshots.stream()
                .filter((member) -> intValue(member, "participationScore") > 0)
                .count() / totalMembers * 100;
        double donationParticipationPercent = memberSnapshots.stream()
                .filter((member) ->
                        intValue(member, "donations") > 0 || intValue(member, "donationsReceived") > 0)
                .count() / totalMembers * 100;
        double warParticipationPercent = hasRiverRaceData
                ? memberSnapshots.stream()
                        .filter((member) ->
                                intValue(member, "fame") > 0
                                        || intValue(member, "repairPoints") > 0
                                        || intValue(member, "boatAttacks") > 0
                                        || intValue(member, "decksUsed") > 0)
                        .count() / totalMembers * 100
                : 0;

        double availableWeight = hasRiverRaceData ? 1 : 0.7;
        double rawScore =
                activeMembersPercent * 0.4
                        + donationParticipationPercent * 0.3
                        + warParticipationPercent * 0.3;

        return (int) Math.round(rawScore / availableWeight);
    }

    private ClashCurrentRiverRaceResponse getRiverRace(GameAdapter adapter, String clanTag) {
        if (!(adapter instanceof ClashRoyaleAdapter clashRoyaleAdapter)) {
            return null;
        }

        try {
            return clashRoyaleAdapter.getCurrentRiverRace(clanTag);
        } catch (RuntimeException exception) {
            return null;
        }
    }

    private String normalizeGameId(String gameId) {
        if (gameId == null || gameId.isBlank()) {
            return DEFAULT_GAME_ID;
        }

        return gameId.trim().toLowerCase(Locale.US);
    }

    private String normalizeClanTag(String clanTag) {
        if (clanTag == null || clanTag.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Clan tag is required.");
        }

        return clanTag.replace("#", "").trim().toUpperCase(Locale.US);
    }

    private String trackedClanDocumentId(String gameId, String clanTag) {
        return gameId + "_" + clanTag;
    }

    private Integer asInteger(Long value) {
        return value == null ? null : value.intValue();
    }

    private Integer asInteger(Object value) {
        return value instanceof Number number ? number.intValue() : null;
    }

    private Long asLong(Object value) {
        return value instanceof Number number ? number.longValue() : null;
    }

    private int intValue(Map<String, Object> map, String key) {
        Object value = map.get(key);
        return value instanceof Number number ? number.intValue() : 0;
    }

    private ResponseStatusException storageException(Exception exception) {
        Throwable rootCause = rootCause(exception);
        String detail = rootCause.getMessage();

        return new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                detail == null || detail.isBlank()
                        ? "Could not read or write saved clan data."
                        : "Could not read or write saved clan data: " + detail,
                exception
        );
    }

    private Throwable rootCause(Throwable throwable) {
        Throwable current = throwable;

        while (current.getCause() != null) {
            current = current.getCause();
        }

        return current;
    }
}
