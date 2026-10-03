package com.safeway.entity;

import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "alerts")
@Getter @Setter @NoArgsConstructor
public class Alert {
    public enum Level { CONTACT_ALERT, DURESS_ALERT }
    public enum Status { SENT, FAILED }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long journeyId;
    private Long contactId;
    @Enumerated(EnumType.STRING)
    private Level level;
    private String channel;
    @Enumerated(EnumType.STRING)
    private Status status;
    private int attempts;
    private String lastError;
    private Instant createdAt = Instant.now();
}
