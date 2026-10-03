package com.safeway.controller;

import com.safeway.entity.Journey;
import com.safeway.repo.JourneyRepository;
import com.safeway.repo.LocationPingRepository;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

/** Public endpoint used by trusted contacts. Access is controlled only by the unguessable, expiring token. */
@RestController
@RequestMapping("/api/track")
@RequiredArgsConstructor
public class TrackController {
    private final JourneyRepository journeys;
    private final LocationPingRepository pings;

    @GetMapping("/{token}")
    @Transactional(readOnly = true)
    public Map<String, Object> track(@PathVariable String token) {
        Journey j = journeys.findByTrackingToken(token)
                .filter(x -> x.getTokenExpiresAt().isAfter(Instant.now()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Link not found or expired"));

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("name", j.getUser().getName());
        out.put("destination", j.getDestination());
        out.put("eta", j.getEta());
        // hide DURESS from anyone who might be looking over the shoulder
        out.put("status", j.getStatus() == Journey.Status.DURESS ? "ACTIVE" : j.getStatus().name());
        pings.findFirstByJourneyIdOrderByRecordedAtDesc(j.getId()).ifPresent(p -> {
            out.put("latitude", p.getLatitude());
            out.put("longitude", p.getLongitude());
            out.put("batteryPct", p.getBatteryPct());
            out.put("lastSeen", p.getRecordedAt());
        });
        return out;
    }
}
