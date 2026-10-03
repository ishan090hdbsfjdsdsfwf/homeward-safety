package com.safeway.dto;

import jakarta.validation.constraints.*;
import java.time.Instant;

public class Dtos {

        public record RegisterRequest(
                        @NotBlank @Size(max = 100, message = "name must be at most 100 characters") String name,

                        @NotBlank @Email @Size(max = 254, message = "email must be at most 254 characters") String email,

                        @NotBlank @Size(min = 8, max = 128, message = "password must be between 8 and 128 characters") String password,

                        @Size(max = 20, message = "phone must be at most 20 characters") String phone,

                        @Pattern(regexp = "^\\d{4,6}$", message = "cancelPin must be 4-6 digits") String cancelPin,

                        @Pattern(regexp = "^\\d{4,6}$", message = "duressPin must be 4-6 digits") String duressPin) {
        }

        public record LoginRequest(
                        @NotBlank @Email @Size(max = 254, message = "email must be at most 254 characters") String email,

                        @NotBlank @Size(max = 128, message = "password must be at most 128 characters") String password) {
        }

        public record AuthResponse(
                        String token) {
        }

        /*
         * Used to change the authenticated user's
         * Cancel PIN and/or Duress PIN.
         */
        public record SecurityPinRequest(

                        @Pattern(regexp = "^\\d{4,6}$", message = "cancelPin must be 4-6 digits") String cancelPin,

                        @Pattern(regexp = "^\\d{4,6}$", message = "duressPin must be 4-6 digits") String duressPin) {
        }

        public record ContactRequest(
                        @NotBlank @Size(max = 100, message = "name must be at most 100 characters") String name,

                        @Email @Size(max = 254, message = "email must be at most 254 characters") String email,

                        @Size(max = 20, message = "phone must be at most 20 characters") String phone,

                        @Size(max = 100, message = "telegramChatId must be at most 100 characters") String telegramChatId) {
        }

        public record ContactView(
                        Long id,
                        String name,
                        String email,
                        String phone,
                        String telegramChatId) {
        }

        public record StartJourneyRequest(
                        @NotBlank @Size(max = 500, message = "destination must be at most 500 characters") String destination,

                        @Min(1) @Max(720) int etaMinutes,

                        @Min(1) @Max(60) Integer graceMinutes) {
        }

        public record PingRequest(
                        @NotNull @DecimalMin("-90") @DecimalMax("90") Double latitude,

                        @NotNull @DecimalMin("-180") @DecimalMax("180") Double longitude,

                        @Min(0) @Max(100) Integer batteryPct) {
        }

        public record ArriveRequest(
                        @Size(max = 10, message = "pin must be at most 10 characters") String pin) {
        }

        public record ExtendRequest(
                        @Min(1) @Max(240) int minutes) {
        }

        public record JourneyView(
                        Long id,
                        String destination,
                        Instant eta,
                        String status,
                        String trackingToken,
                        String trackingUrl) {
        }
}