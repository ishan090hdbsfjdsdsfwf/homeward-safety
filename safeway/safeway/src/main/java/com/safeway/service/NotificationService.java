package com.safeway.service;

import com.safeway.entity.Alert;
import com.safeway.entity.Journey;
import com.safeway.entity.TrustedContact;
import com.safeway.notify.NotificationChannel;
import com.safeway.repo.AlertRepository;
import com.safeway.repo.TrustedContactRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {
    private static final int MAX_ATTEMPTS = 3;

    private final List<NotificationChannel> channels;
    private final TrustedContactRepository contacts;
    private final AlertRepository alerts;

    @Value("${app.base-url}")
    private String baseUrl;

    public void notifyContacts(Journey j, Alert.Level level) {
        String name = j.getUser().getName();
        String link = baseUrl + "/track/" + j.getTrackingToken();
        String msg = level == Alert.Level.DURESS_ALERT
                ? "URGENT: " + name + " may be in danger. Contact them carefully or call emergency services (112). Live location: " + link
                : name + " has not checked in from their journey to " + j.getDestination()
                  + ". Please try calling them. Live location: " + link;

        for (TrustedContact c : contacts.findByUserIdOrderByPriorityAsc(j.getUser().getId())) {
            deliver(j, c, level, msg);
        }
    }

    /** Tries each channel in order (with retries); falls back to the next channel if one fails. */
    private void deliver(Journey j, TrustedContact c, Alert.Level level, String msg) {
        boolean any = false;
        for (NotificationChannel ch : channels) {
            if (!ch.canReach(c)) continue;
            any = true;
            String lastError = null;
            for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
                try {
                    ch.send(c, msg);
                    record(j, c, level, ch.name(), Alert.Status.SENT, attempt, null);
                    return; // delivered on this channel: no need for fallback
                } catch (Exception e) {
                    lastError = e.getMessage();
                    log.warn("{} attempt {} failed for contact {}: {}", ch.name(), attempt, c.getId(), lastError);
                    sleep(attempt * 500L);
                }
            }
            record(j, c, level, ch.name(), Alert.Status.FAILED, MAX_ATTEMPTS, lastError);
        }
        if (!any) {
            record(j, c, level, "NONE", Alert.Status.FAILED, 0, "no reachable channel for contact");
        }
    }

    private void record(Journey j, TrustedContact c, Alert.Level level, String channel,
                        Alert.Status status, int attempts, String error) {
        Alert a = new Alert();
        a.setJourneyId(j.getId());
        a.setContactId(c.getId());
        a.setLevel(level);
        a.setChannel(channel);
        a.setStatus(status);
        a.setAttempts(attempts);
        a.setLastError(error == null ? null : error.substring(0, Math.min(error.length(), 250)));
        alerts.save(a);
    }

    private static void sleep(long ms) {
        try { Thread.sleep(ms); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }
}
