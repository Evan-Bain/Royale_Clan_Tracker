package com.example.backend.user;

import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/me")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "https://clash-royal-db.web.app",
        "https://clash-royal-db.firebaseapp.com"
})
public class UserClanController {
    private final UserClanService userClanService;

    public UserClanController(UserClanService userClanService) {
        this.userClanService = userClanService;
    }

    @GetMapping("/claimed-clan")
    public ClaimedClanResponse getClaimedClan(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader
    ) {
        return userClanService.getClaimedClan(authorizationHeader);
    }

    @PutMapping("/claimed-clan")
    public ClaimedClanResponse claimClan(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader,
            @RequestBody ClaimClanRequest request
    ) {
        return userClanService.claimClan(authorizationHeader, request);
    }

    @GetMapping("/claimed-clan/snapshots")
    public List<ClanSnapshotResponse> getClaimedClanSnapshots(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader,
            @RequestParam(defaultValue = "30") int limit
    ) {
        return userClanService.getClaimedClanSnapshots(authorizationHeader, limit);
    }

    @PostMapping("/claimed-clan/snapshots")
    public ClanSnapshotResponse saveClaimedClanSnapshot(
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorizationHeader
    ) {
        return userClanService.saveClaimedClanSnapshot(authorizationHeader);
    }
}
