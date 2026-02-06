package com.example.backend;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;
import org.springframework.http.HttpHeaders;

@Configuration
public class RestClientConfig {

    @Bean
    public RestClient clashRoyaleRestClient(
            @Value("${clash.api.key}") String apiKey
    ) {
        return RestClient.builder()
                .baseUrl("https://api.clashroyale.com/v1")
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .build();
    }
}
