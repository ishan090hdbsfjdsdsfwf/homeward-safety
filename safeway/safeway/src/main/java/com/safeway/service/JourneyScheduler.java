package com.safeway.service;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class JourneyScheduler {

    private final JourneyService service;

    /**
     * Checks every 30 seconds for journeys that have passed
     * ETA + grace period.
     *
     * State is stored in the database, so overdue journeys
     * can still be detected after a server restart.
     */
    @Scheduled(fixedDelay = 30_000)
    public void checkOverdue() {
        service.alertOverdueJourneys();
    }

    /**
     * Removes location history older than 24 hours
     * after a journey has ended.
     */
    @Scheduled(cron = "0 0 * * * *")
    public void purgeLocations() {
        service.purgeOldLocations();
    }
}