package com.safeway;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.safeway.security.JwtService;
import org.junit.jupiter.api.Test;

class SafewayApplicationTests {
    @Test
    void jwtRoundTrip() {
        JwtService jwt = new JwtService("a-test-secret-that-is-at-least-32-characters-long", 1);
        assertEquals("a@b.com", jwt.extractEmail(jwt.generate("a@b.com")));
    }
}
