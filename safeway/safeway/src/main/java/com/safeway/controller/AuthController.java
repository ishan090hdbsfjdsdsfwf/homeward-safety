package com.safeway.controller;

import com.safeway.dto.Dtos.*;
import com.safeway.entity.User;
import com.safeway.repo.UserRepository;
import com.safeway.security.JwtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest r) {

        String email = r.email().trim().toLowerCase();

        if (users.existsByEmail(email)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Email already registered");
        }

        User u = new User();

        u.setName(r.name().trim());
        u.setEmail(email);
        u.setPhone(r.phone());
        u.setPasswordHash(encoder.encode(r.password()));

        if (r.cancelPin() != null && !r.cancelPin().isBlank()) {
            u.setCancelPinHash(
                    encoder.encode(r.cancelPin()));
        }

        if (r.duressPin() != null && !r.duressPin().isBlank()) {
            u.setDuressPinHash(
                    encoder.encode(r.duressPin()));
        }

        users.save(u);

        return new AuthResponse(
                jwt.generate(email));
    }

    @PostMapping("/login")
    public AuthResponse login(
            @Valid @RequestBody LoginRequest r) {

        User u = users.findByEmail(
                r.email().trim().toLowerCase())
                .filter(x -> encoder.matches(
                        r.password(),
                        x.getPasswordHash()))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Invalid credentials"));

        return new AuthResponse(
                jwt.generate(u.getEmail()));
    }

    /**
     * Update the authenticated user's security PINs.
     *
     * Both fields are optional:
     * - Send cancelPin to change only the cancel PIN.
     * - Send duressPin to change only the duress PIN.
     */
    @PutMapping("/security-pins")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updateSecurityPins(
            Authentication auth,
            @Valid @RequestBody SecurityPinRequest request) {

        User user = users.findByEmail(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "User not found"));

        if (request.cancelPin() != null
                && !request.cancelPin().isBlank()) {

            user.setCancelPinHash(
                    encoder.encode(request.cancelPin()));
        }

        if (request.duressPin() != null
                && !request.duressPin().isBlank()) {

            user.setDuressPinHash(
                    encoder.encode(request.duressPin()));
        }

        users.save(user);
    }
}