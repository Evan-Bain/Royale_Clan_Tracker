package com.example.backend.adapter.clash_royale.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ClashCurrentRiverRaceResponse(
        RiverRaceClan clan
) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record RiverRaceClan(
            String tag,
            String name,
            int clanScore,
            int fame,
            int repairPoints,
            List<RiverRaceParticipant> participants
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record RiverRaceParticipant(
            String tag,
            String name,
            int fame,
            int repairPoints,
            int boatAttacks,
            int decksUsed,
            int decksUsedToday
    ) {}
}
