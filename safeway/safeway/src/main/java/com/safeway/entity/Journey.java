package com.safeway.entity;

import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "journeys", indexes = @Index(name = "idx_status_eta", columnList = "status, eta"))
@Getter @Setter @NoArgsConstructor
public class Journey {
    public enum Status { ACTIVE, ARRIVED, CANCELLED, ALERTED, DURESS }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private User user;
    private String destination;
    private Instant startedAt = Instant.now();
    @Column(nullable = false)
    private Instant eta;
    private int graceMinutes = 10;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.ACTIVE;
    @Column(nullable = false, unique = true)
    private String trackingToken;
    @Column(nullable = false)
    private Instant tokenExpiresAt;
    private Instant endedAt;
}
