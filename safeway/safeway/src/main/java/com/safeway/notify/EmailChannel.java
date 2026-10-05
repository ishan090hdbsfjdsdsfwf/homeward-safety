package com.safeway.notify;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.safeway.entity.TrustedContact;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class EmailChannel implements NotificationChannel {

    private static final String RESEND_URL = "https://api.resend.com/emails";

    private final ObjectMapper objectMapper;

    @Value("${app.mail-from}")
    private String from;

    @Value("${app.resend-api-key}")
    private String apiKey;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Override
    public String name() {
        return "EMAIL";
    }

    @Override
    public boolean canReach(TrustedContact c) {
        return apiKey != null
                && !apiKey.isBlank()
                && c.getEmail() != null
                && !c.getEmail().isBlank();
    }

    @Override
    public void send(TrustedContact c, String message) throws Exception {

        Map<String, Object> body = Map.of(
                "from", from,
                "to", List.of(c.getEmail().trim()),
                "subject", "Homeward Safety Alert",
                "text", message);

        String json = objectMapper.writeValueAsString(body);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(RESEND_URL))
                .timeout(Duration.ofSeconds(15))
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException(
                    "Resend API failed: HTTP "
                            + response.statusCode()
                            + " - "
                            + response.body());
        }
    }
}