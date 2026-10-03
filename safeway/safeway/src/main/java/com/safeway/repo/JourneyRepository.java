package com.safeway.repo;

import com.safeway.entity.Journey;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JourneyRepository extends JpaRepository<Journey, Long> {
    Optional<Journey> findByTrackingToken(String token);
    List<Journey> findByStatusAndEtaBefore(Journey.Status status, Instant time);
    boolean existsByUserIdAndStatus(Long userId, Journey.Status status);
}
