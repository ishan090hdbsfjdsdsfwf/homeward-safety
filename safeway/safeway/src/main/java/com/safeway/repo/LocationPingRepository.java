package com.safeway.repo;

import com.safeway.entity.LocationPing;
import java.time.Instant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LocationPingRepository extends JpaRepository<LocationPing, Long> {
    Optional<LocationPing> findFirstByJourneyIdOrderByRecordedAtDesc(Long journeyId);

    @Modifying
    @Query("delete from LocationPing p where p.journeyId in (select j.id from Journey j where j.endedAt < :cutoff)")
    int deleteForJourneysEndedBefore(@Param("cutoff") Instant cutoff);
}
