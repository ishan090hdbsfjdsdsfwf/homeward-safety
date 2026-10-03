package com.safeway.security;

import java.util.Arrays;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtFilter;

    @Value("${app.cors-origins}")
    private String corsOrigins;

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        http.csrf(c -> c.disable())

                .cors(Customizer.withDefaults())

                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                .authorizeHttpRequests(a -> a
                        .requestMatchers(
                                "/api/auth/**",
                                "/api/track/**",
                                "/actuator/health")
                        .permitAll()
                        .anyRequest().authenticated())

                .exceptionHandling(e -> e.authenticationEntryPoint(
                        new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))

                .addFilterBefore(
                        jwtFilter,
                        UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration cfg = new CorsConfiguration();

        cfg.setAllowedOrigins(
                Arrays.asList(corsOrigins.split(",")));

        cfg.setAllowedMethods(
                Arrays.asList(
                        "GET",
                        "POST",
                        "PATCH",
                        "DELETE",
                        "OPTIONS"));

        cfg.setAllowedHeaders(
                Arrays.asList(
                        "Authorization",
                        "Content-Type"));

        UrlBasedCorsConfigurationSource src = new UrlBasedCorsConfigurationSource();

        src.registerCorsConfiguration("/api/**", cfg);

        return src;
    }
}