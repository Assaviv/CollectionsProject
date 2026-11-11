package com.aviv.saveapp.filter;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

@Component
public class ProfileHeaderFilter implements GlobalFilter, Ordered {
    private static final String PROFILE_HEADER = "X-Profile";

    private final ObjectMapper objectMapper;

    public ProfileHeaderFilter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        return exchange.getPrincipal()
                .ofType(JwtAuthenticationToken.class)
                .map(authentication -> withProfileHeader(exchange, authentication))
                .defaultIfEmpty(withoutProfileHeader(exchange))
                .flatMap(chain::filter);
    }

    private ServerWebExchange withProfileHeader(
            ServerWebExchange exchange, JwtAuthenticationToken authentication) {
        var jwt = authentication.getToken();
        String id = jwt.getSubject();
        String name = jwt.getClaimAsString("name");

        if (name == null || name.isBlank()) {
            name = jwt.getClaimAsString("preferred_username");
        }

        String profile;
        try {
            profile = objectMapper.writeValueAsString(new UserProfile(id, name));
        } catch (JacksonException e) {
            throw new IllegalStateException("Could not serialize authenticated user profile", e);
        }

        return exchange.mutate()
                .request(request -> request.headers(headers -> {
                    headers.remove(PROFILE_HEADER);
                    headers.set(PROFILE_HEADER, profile);
                }))
                .build();
    }

    private ServerWebExchange withoutProfileHeader(ServerWebExchange exchange) {
        return exchange.mutate()
                .request(request -> request.headers(headers -> headers.remove(PROFILE_HEADER)))
                .build();
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }

    private record UserProfile(String id, String name) {}
}
