package com.safeway.controller;

import com.safeway.dto.Dtos.*;
import com.safeway.entity.Journey;
import com.safeway.service.JourneyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/journeys")
@RequiredArgsConstructor
public class JourneyController {
    private final JourneyService service;

    @Value("${app.base-url}")
    private String baseUrl;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public JourneyView start(Authentication auth, @Valid @RequestBody StartJourneyRequest r) {
        return view(service.start(auth.getName(), r.destination(), r.etaMinutes(), r.graceMinutes()));
    }

    @PostMapping("/{id}/ping")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void ping(Authentication auth, @PathVariable Long id, @Valid @RequestBody PingRequest r) {
        service.ping(auth.getName(), id, r.latitude(), r.longitude(), r.batteryPct());
    }

    @PostMapping("/{id}/arrive")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void arrive(Authentication auth, @PathVariable Long id, @RequestBody(required = false) ArriveRequest r) {
        service.arrive(auth.getName(), id, r == null ? null : r.pin());
    }

    @PatchMapping("/{id}/extend")
    public JourneyView extend(Authentication auth, @PathVariable Long id, @Valid @RequestBody ExtendRequest r) {
        return view(service.extend(auth.getName(), id, r.minutes()));
    }

    private JourneyView view(Journey j) {
        return new JourneyView(j.getId(), j.getDestination(), j.getEta(), j.getStatus().name(),
                j.getTrackingToken(), baseUrl + "/track/" + j.getTrackingToken());
    }
}
