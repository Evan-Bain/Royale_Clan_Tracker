package com.example.backend.adapter.clash_royale.dto;

import com.example.backend.model.dto.MemberDto;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ClashClanMember(
        @JsonProperty("tag") String tag,
        String name
) implements MemberDto {}
