package com.safeway.entity;

import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "location_pings", indexes = @Index(name = "idx_journey_time", columnList = "journeyId, recordedAt"))
@Getter @Setter @NoArgsConstructor
public class LocationPing {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private Long journeyId;
    @Column(nullable = false)
    private double latitude;
    @Column(nullable = false)
    private double longitude;
    private Integer batteryPct;
    private Instant recordedAt = Instant.now();
}
