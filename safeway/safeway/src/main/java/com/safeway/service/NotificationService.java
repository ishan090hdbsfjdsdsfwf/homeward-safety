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

    /**
     * Sends an alert to all trusted contacts.
     *
     * If at least one notification is successfully delivered
     * to every contact, the method completes normally.
     *
     * If a contact has no successful notification channel,
     * an exception is thrown so the journey remains ACTIVE
     * and the scheduler can retry later.
     */
    public void notifyContacts(
            Journey j,
            Alert.Level level) {

        String name = j.getUser().getName();

        String link = baseUrl + "/track/" + j.getTrackingToken();

        String msg;

        if (level == Alert.Level.DURESS_ALERT) {

            msg = "URGENT: "
                    + name
                    + " may be in danger. "
                    + "Contact them carefully or call emergency services (112). "
                    + "Live location: "
                    + link;

        } else {

            msg = name
                    + " has not checked in from their journey to "
                    + j.getDestination()
                    + ". Please try calling them. "
                    + "Live location: "
                    + link;
        }

        List<TrustedContact> trustedContacts = contacts.findByUserIdOrderByPriorityAsc(
                j.getUser().getId());

        if (trustedContacts.isEmpty()) {

            throw new IllegalStateException(
                    "No trusted contacts found for journey "
                            + j.getId());
        }

        boolean allContactsNotified = true;

        for (TrustedContact c : trustedContacts) {

            boolean delivered = deliver(
                    j,
                    c,
                    level,
                    msg);

            if (!delivered) {

                allContactsNotified = false;

                log.error(
                        "Unable to notify contact {} for journey {}",
                        c.getId(),
                        j.getId());
            }
        }

        /*
         * Important:
         *
         * If any contact could not be notified,
         * throw an exception.
         *
         * JourneyService will then keep the journey ACTIVE,
         * allowing the scheduler to retry on the next run.
         */
        if (!allContactsNotified) {

            throw new IllegalStateException(
                    "One or more trusted contacts could not be notified "
                            + "for journey "
                            + j.getId());
        }
    }

    /**
     * Attempts to deliver a notification.
     *
     * Each available channel gets up to 3 attempts.
     *
     * Example:
     *
     * EMAIL
     * attempt 1 -> failed
     * attempt 2 -> failed
     * attempt 3 -> failed
     *
     * Then the next available channel is tried.
     *
     * Returns true when a notification is successfully delivered.
     */
    private boolean deliver(
            Journey j,
            TrustedContact c,
            Alert.Level level,
            String msg) {

        boolean anyReachableChannel = false;

        for (NotificationChannel ch : channels) {

            if (!ch.canReach(c)) {
                continue;
            }

            anyReachableChannel = true;

            String lastError = null;

            for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {

                try {

                    log.info(
                            "Sending {} notification to contact {}. Attempt {}/{}",
                            ch.name(),
                            c.getId(),
                            attempt,
                            MAX_ATTEMPTS);

                    ch.send(c, msg);

                    record(
                            j,
                            c,
                            level,
                            ch.name(),
                            Alert.Status.SENT,
                            attempt,
                            null);

                    log.info(
                            "{} notification successfully sent to contact {} for journey {}",
                            ch.name(),
                            c.getId(),
                            j.getId());

                    return true;

                } catch (Exception e) {

                    lastError = e.getMessage();

                    if (lastError == null || lastError.isBlank()) {
                        lastError = e.getClass().getSimpleName();
                    }

                    log.warn(
                            "{} attempt {} failed for contact {}: {}",
                            ch.name(),
                            attempt,
                            c.getId(),
                            lastError);

                    sleep(attempt * 500L);
                }
            }

            /*
             * All attempts for this channel failed.
             * Record the failure and try the next channel.
             */
            record(
                    j,
                    c,
                    level,
                    ch.name(),
                    Alert.Status.FAILED,
                    MAX_ATTEMPTS,
                    lastError);

            log.warn(
                    "{} failed after {} attempts for contact {}. Trying next channel.",
                    ch.name(),
                    MAX_ATTEMPTS,
                    c.getId());
        }

        /*
         * No channel could reach this contact.
         */
        if (!anyReachableChannel) {

            record(
                    j,
                    c,
                    level,
                    "NONE",
                    Alert.Status.FAILED,
                    0,
                    "no reachable channel for contact");

            log.error(
                    "No reachable notification channel for contact {}",
                    c.getId());
        }

        return false;
    }

    /**
     * Saves notification delivery result.
     */
    private void record(
            Journey j,
            TrustedContact c,
            Alert.Level level,
            String channel,
            Alert.Status status,
            int attempts,
            String error) {

        Alert a = new Alert();

        a.setJourneyId(j.getId());
        a.setContactId(c.getId());
        a.setLevel(level);
        a.setChannel(channel);
        a.setStatus(status);
        a.setAttempts(attempts);

        if (error == null || error.isBlank()) {

            a.setLastError(null);

        } else {

            a.setLastError(
                    error.substring(
                            0,
                            Math.min(error.length(), 250)));
        }

        alerts.save(a);
    }

    /**
     * Small delay between notification retries.
     */
    private static void sleep(long ms) {

        try {

            Thread.sleep(ms);

        } catch (InterruptedException e) {

            Thread.currentThread().interrupt();
        }
    }
}