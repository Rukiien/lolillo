package com.example.demo;


import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class RiotConfig {

    @Value("${riot.api.key}")
    private String apiKey;

    public String getApiKey() {
        return apiKey;
    }
}