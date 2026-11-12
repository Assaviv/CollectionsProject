package com.aviv.saveapp.config;

import io.netty.handler.ssl.SslContextBuilder;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.ssl.SslBundle;
import org.springframework.boot.ssl.SslBundles;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.http.HttpMethod;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusReactiveJwtDecoder;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoder;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.util.Assert;
import org.springframework.util.StringUtils;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsConfigurationSource;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import javax.net.ssl.SSLException;
import java.time.Duration;
import java.util.List;

@Configuration
@EnableWebFluxSecurity
@EnableConfigurationProperties({AuthProperties.class, SecurityConfig.CorsProperties.class})
public class SecurityConfig {

    @Bean
    @ConditionalOnProperty(name = "app.security.enabled", havingValue = "true", matchIfMissing = true)
    SecurityWebFilterChain secured(ServerHttpSecurity http, ReactiveJwtDecoder decoder) {
        return http
                .cors(Customizer.withDefaults())
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .authorizeExchange(x -> x
                        .pathMatchers(HttpMethod.OPTIONS).permitAll()
                        .pathMatchers("/actuator/health/**").permitAll()
                        .anyExchange().authenticated())
                .oauth2ResourceServer(o -> o.jwt(j -> j.jwtDecoder(decoder)))
                .build();
    }

    @Bean
    @ConditionalOnProperty(name = "app.security.enabled", havingValue = "true", matchIfMissing = true)
    ReactiveJwtDecoder jwtDecoder(AuthProperties props, SslBundles bundles) {
        Assert.hasText(props.issuerUri(), "KEYCLOAK_ISSUER_URI must be set when security is enabled");

        HttpClient httpClient = HttpClient.create().responseTimeout(Duration.ofSeconds(5));
        if (StringUtils.hasText(props.trustBundle())) {
            SslBundle bundle = bundles.getBundle(props.trustBundle());
            httpClient = httpClient.secure(spec -> {
                try {
                    spec.sslContext(SslContextBuilder.forClient()
                            .trustManager(bundle.getManagers().getTrustManagerFactory())
                            .build());
                } catch (SSLException e) {
                    throw new IllegalStateException("Cannot build SSL context from bundle", e);
                }
            });
        }
        WebClient webClient = WebClient.builder()
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .build();

        String issuer = props.issuerUri().replaceAll("/+$", "");
        String jwks = StringUtils.hasText(props.jwkSetUri())
                ? props.jwkSetUri()
                : issuer + "/protocol/openid-connect/certs";

        NimbusReactiveJwtDecoder decoder = NimbusReactiveJwtDecoder
                .withJwkSetUri(jwks).webClient(webClient).build();
//        decoder.setJwtValidator(JwtValidators.createDefaultWithIssuer(issuer));

        OAuth2TokenValidator<Jwt> issuerValidator = getIssuerValidator(props, issuer);
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(JwtValidators.createDefault(), issuerValidator));
        return decoder;
    }

    private static OAuth2TokenValidator<Jwt> getIssuerValidator(AuthProperties props, String issuer) {
        List<String> allowed = (props.allowedIssuers() == null || props.allowedIssuers().isEmpty())
                ? List.of(issuer)
                : props.allowedIssuers();

        return jwt -> {
            String iss = jwt.getClaimAsString("iss");
            return iss != null && allowed.contains(iss)
                    ? OAuth2TokenValidatorResult.success()
                    : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", "Untrusted issuer", null));
        };
    }

    @Bean
    @ConditionalOnProperty(name = "app.security.enabled", havingValue = "false")
    SecurityWebFilterChain open(ServerHttpSecurity http, Environment env) {
        if (env.acceptsProfiles(Profiles.of("prod", "production", "staging"))) {
            throw new IllegalStateException("Refusing to start with security disabled in a deployed profile");
        }
        LoggerFactory.getLogger(SecurityConfig.class)
                .warn("*** app.security.enabled=false: gateway authentication is OFF (local development only) ***");
        return http.csrf(ServerHttpSecurity.CsrfSpec::disable)
                .authorizeExchange(x -> x.anyExchange().permitAll())
                .build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(CorsProperties props) {
        var config = new CorsConfiguration();
        config.setAllowedOrigins(props.allowedOrigins());
        config.setAllowedMethods(List.of("*"));
        config.setAllowedHeaders(List.of("*"));
        config.setMaxAge(3600L);
        var source = new UrlBasedCorsConfigurationSource();   // org.springframework.web.cors.reactive
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @ConfigurationProperties("app.cors")
    public record CorsProperties(List<String> allowedOrigins) {
        public CorsProperties {
            allowedOrigins = allowedOrigins == null ? List.of() : List.copyOf(allowedOrigins);
        }
    }
}
