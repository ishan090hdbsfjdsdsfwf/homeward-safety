package com.safeway.service;

import com.safeway.entity.*;
import com.safeway.repo.*;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Slf4j
public class JourneyService {
    private static final Set<Journey.Status> OPEN =
            EnumSet.of(Journey.Status.ACTIVE, Journey.Status.ALERTED, Journey.Status.DURESS);

    private final JourneyRepository journeys;
    private final UserRepository users;
    private final TrustedContactRepository contacts;
    private final LocationPingRepository pings;
    private final NotificationService notifications;
    private final PasswordEncoder encoder;
    private final SecureRandom random = new SecureRandom();

    @Transactional
    public Journey start(String email, String destination, int etaMinutes, Integer grace) {
        User user = users.findByEmail(email).orElseThrow();
        if (contacts.countByUserId(user.getId()) == 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Add at least one trusted contact first");
        }
        if (journeys.existsByUserIdAndStatus(user.getId(), Journey.Status.ACTIVE)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You already have an active journey");
        }
        Journey j = new Journey();
        j.setUser(user);
        j.setDestination(destination == null || destination.isBlank() ? "unknown destination" : destination);
        j.setEta(Instant.now().plus(Duration.ofMinutes(etaMinutes)));
        if (grace != null) j.setGraceMinutes(grace);
        j.setTrackingToken(newToken());
        j.setTokenExpiresAt(j.getEta().plus(Duration.ofMinutes(j.getGraceMinutes())).plus(Duration.ofHours(6)));
        return journeys.save(j);
    }

    @Transactional
    public void ping(String email, Long id, double lat, double lon, Integer battery) {
        Journey j = owned(email, id);
        if (!OPEN.contains(j.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Journey is not active");
        }
        LocationPing p = new LocationPing();
        p.setJourneyId(j.getId());
        p.setLatitude(lat);
        p.setLongitude(lon);
        p.setBatteryPct(battery);
        pings.save(p);
    }

    /** Same response for a normal check-in and a duress PIN, so an onlooker cannot tell the difference. */
    @Transactional
    public void arrive(String email, Long id, String pin) {
        Journey j = owned(email, id);
        if (!OPEN.contains(j.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Journey already ended");
        }
        User u = j.getUser();
        if (pin != null && u.getDuressPinHash() != null && encoder.matches(pin, u.getDuressPinHash())) {
            j.setStatus(Journey.Status.DURESS);   // keep tracking; do NOT set endedAt
            notifications.notifyContacts(j, Alert.Level.DURESS_ALERT);
            return;
        }
        if (u.getCancelPinHash() != null && (pin == null || !encoder.matches(pin, u.getCancelPinHash()))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Incorrect PIN");
        }
        j.setStatus(Journey.Status.ARRIVED);
        j.setEndedAt(Instant.now());
    }

    @Transactional
    public Journey extend(String email, Long id, int minutes) {
        Journey j = owned(email, id);
        if (j.getStatus() != Journey.Status.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only active journeys can be extended");
        }
        j.setEta(j.getEta().plus(Duration.ofMinutes(minutes)));
        j.setTokenExpiresAt(j.getTokenExpiresAt().plus(Duration.ofMinutes(minutes)));
        return j;
    }

    /** Called by the scheduler: alert contacts for journeys that passed ETA + grace. */
    @Transactional
    public void alertOverdueJourneys() {
        Instant now = Instant.now();
        List<Journey> due = journeys.findByStatusAndEtaBefore(Journey.Status.ACTIVE, now);
        for (Journey j : due) {
            if (j.getEta().plus(Duration.ofMinutes(j.getGraceMinutes())).isBefore(now)) {
                j.setStatus(Journey.Status.ALERTED);
                log.info("Journey {} overdue, alerting contacts", j.getId());
                notifications.notifyContacts(j, Alert.Level.CONTACT_ALERT);
            }
        }
    }

    /** Privacy: delete location history 24h after a journey ended. */
    @Transactional
    public void purgeOldLocations() {
        int n = pings.deleteForJourneysEndedBefore(Instant.now().minus(Duration.ofHours(24)));
        if (n > 0) log.info("Purged {} old location pings", n);
    }

    private Journey owned(String email, Long id) {
        Journey j = journeys.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Journey not found"));
        if (!j.getUser().getEmail().equals(email)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Journey not found");
        }
        return j;
    }

    private String newToken() {
        byte[] b = new byte[24];
        random.nextBytes(b);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(b);
    }
}
