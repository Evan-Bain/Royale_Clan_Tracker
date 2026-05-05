package com.example.backend.model.dto;

public interface MemberDto {
    String tag();
    String name();
    String role();
    int expLevel();
    int trophies();
    int clanRank();
    int previousClanRank();
    int donations();
    int donationsReceived();
}
