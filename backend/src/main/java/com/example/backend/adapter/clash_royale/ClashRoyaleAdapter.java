package com.example.backend.adapter.clash_royale;

import com.example.backend.adapter.clash_royale.dto.ClashClanMembersResponse;
import com.example.backend.adapter.clash_royale.dto.ClashClanResponse;
import com.example.backend.model.dto.GroupDto;
import com.example.backend.model.dto.MembersDto;
import com.example.backend.adapter.GameAdapter;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service("clash-royale")
public class ClashRoyaleAdapter implements GameAdapter {
    private final RestClient restClient;

    ClashRoyaleAdapter(RestClient restClient) {
        this.restClient = restClient;
    }

    @Override
    public GroupDto getGroup(String groupId) {
        return restClient
                .get().uri("/clans/{tag}", "#" + groupId)
                .retrieve()
                .body(ClashClanResponse.class);
    }

    @Override
    public MembersDto getMembers(String groupId) {
        return restClient
                .get().uri("/clans/{tag}/members", "#" + groupId)
                .retrieve()
                .body(ClashClanMembersResponse.class);
    }
}
