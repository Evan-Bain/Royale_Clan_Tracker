package com.example.backend.adapter;

import com.example.backend.model.dto.GroupDto;
import com.example.backend.model.dto.MembersDto;

public interface GameAdapter {
    GroupDto getGroup(String request);
    MembersDto getMembers(String request);
}
