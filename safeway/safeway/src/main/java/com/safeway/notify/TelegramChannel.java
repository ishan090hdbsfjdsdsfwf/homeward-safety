package com.safeway.notify;

import com.safeway.entity.TrustedContact;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class TelegramChannel implements NotificationChannel {
    private final HttpClient client = HttpClient.newHttpClient();

    @Value("${app.telegram.bot-token:}")
    private String botToken;

    @Override public String name() { return "TELEGRAM"; }

    @Override
    public boolean canReach(TrustedContact c) {
        return !botToken.isBlank() && c.getTelegramChatId() != null && !c.getTelegramChatId().isBlank();
    }

    @Override
    public void send(TrustedContact c, String message) throws Exception {
        String body = "chat_id=" + enc(c.getTelegramChatId()) + "&text=" + enc(message);
        HttpRequest req = HttpRequest.newBuilder(URI.create("https://api.telegram.org/bot" + botToken + "/sendMessage"))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();
        HttpResponse<String> res = client.send(req, HttpResponse.BodyHandlers.ofString());
        if (res.statusCode() / 100 != 2) {
            throw new IllegalStateException("Telegram HTTP " + res.statusCode());
        }
    }

    private static String enc(String s) {
        return URLEncoder.encode(s, StandardCharsets.UTF_8);
    }
}
