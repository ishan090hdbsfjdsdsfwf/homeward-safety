package com.safeway.service;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class JourneyScheduler {
    private final JourneyService service;

    // State lives in the DB, so overdue journeys are still caught after a server restart.
    @Scheduled(fixedDelay = 30_000)
    public void checkOverdue() {
        service.alertOverdueJourneys();
    }

    @Scheduled(cron = "0 0 * * * *")
    public void purgeLocations() {
        service.purgeOldLocations();
    }
}
