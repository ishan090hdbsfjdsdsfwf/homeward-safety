package com.safeway.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "trusted_contacts")
@Getter @Setter @NoArgsConstructor
public class TrustedContact {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    private User user;
    @Column(nullable = false)
    private String name;
    private String email;
    private String phone;
    private String telegramChatId;
    private int priority = 1;
}
