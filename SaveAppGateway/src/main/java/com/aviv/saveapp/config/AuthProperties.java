package com.aviv.saveapp.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

import java.util.List;

@ConfigurationProperties("app.security")
public record AuthProperties(
        @DefaultValue("true") boolean enabled,
        String issuerUri,
        String jwkSetUri,
        String trustBundle,
        List<String> allowedIssuers) {}
