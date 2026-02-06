package com.example.backend.adapter.clash_royale.dto;

import com.example.backend.model.dto.GroupDto;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ClashClanResponse (
        @JsonProperty("tag") String id,
        String name,
        int members
) implements GroupDto {}
