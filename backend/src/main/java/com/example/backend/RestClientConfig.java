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
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException(
                    "CLASH_API_KEY is missing. Set it to a valid Clash Royale API token without the Bearer prefix."
            );
        }

        return RestClient.builder()
                .baseUrl("https://api.clashroyale.com/v1")
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey.trim())
                .build();
    }
}
