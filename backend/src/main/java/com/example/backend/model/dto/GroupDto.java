package com.example.backend.model.dto;


public interface GroupDto {
    String id();
    String name();
    String type();
    int clanScore();
    int clanWarTrophies();
    int requiredTrophies();
    int donationsPerWeek();
    int members();
}
