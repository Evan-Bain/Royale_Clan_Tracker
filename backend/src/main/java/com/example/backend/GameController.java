package com.example.backend;

import com.example.backend.adapter.GameAdapter;
import com.example.backend.adapter.clash_royale.dto.ClashClanMembersResponse;
import com.example.backend.model.dto.GroupDto;
import com.example.backend.model.dto.MembersDto;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;

import java.util.Map;

@RestController
@RequestMapping("/api/games/{gameId}")
public class GameController {
    private final Map<String, GameAdapter> adapters;
    private final RestClient restClient;

    public GameController(Map<String, GameAdapter> adapters, RestClient restClient) {
        this.adapters = adapters;
        this.restClient = restClient; //for testing DELETE LATER
    }

    @RequestMapping("/group")
    public GroupDto getGroup(
            @PathVariable String gameId,
            @RequestParam String groupId
    ) {
        return adapters.get(gameId).getGroup(groupId);
    }

    @RequestMapping("/group/members")
    public MembersDto getMembers(
            @PathVariable String gameId,
            @RequestParam String groupId
    ) {
        return adapters.get(gameId).getMembers(groupId);
    }

    @GetMapping("/testing")
    /* For direct access to testing new functions in adapters */
    public String testing() {
        return restClient
                .get().uri("/clans/{tag}/members", "#R2L0YPGL")
                .retrieve()
                .body(ClashClanMembersResponse.class)
                .toString();
    }
}
