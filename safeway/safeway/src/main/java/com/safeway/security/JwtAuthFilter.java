package com.safeway.security;

import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwt;

    @Override
    protected void doFilterInternal(
            HttpServletRequest req,
            HttpServletResponse res,
            FilterChain chain)
            throws ServletException, IOException {

        String header = req.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {

            String token = header.substring(7).trim();

            if (!token.isEmpty()
                    && SecurityContextHolder.getContext().getAuthentication() == null) {

                try {
                    String email = jwt.extractEmail(token);

                    if (email != null && !email.isBlank()) {

                        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                                email,
                                null,
                                List.of());

                        SecurityContextHolder.getContext()
                                .setAuthentication(authentication);

                        log.info("JWT authentication successful for request {}", req.getRequestURI());
                    }

                } catch (JwtException | IllegalArgumentException e) {

                    // Never log the JWT itself.
                    log.warn(
                            "JWT validation failed for request {}: {}",
                            req.getRequestURI(),
                            e.getClass().getSimpleName());

                    SecurityContextHolder.clearContext();
                }
            }
        }

        chain.doFilter(req, res);
    }
}