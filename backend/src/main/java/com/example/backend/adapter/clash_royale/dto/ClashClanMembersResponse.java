package com.example.backend.adapter.clash_royale.dto;

import com.example.backend.model.dto.MemberDto;
import com.example.backend.model.dto.MembersDto;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import tools.jackson.databind.annotation.JsonDeserialize;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ClashClanMembersResponse(
        @JsonProperty("items")
        @JsonDeserialize(contentAs = ClashClanMember.class)
        List<MemberDto> members
) implements MembersDto { }


