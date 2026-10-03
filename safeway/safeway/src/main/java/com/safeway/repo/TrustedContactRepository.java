package com.safeway.repo;

import com.safeway.entity.TrustedContact;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TrustedContactRepository extends JpaRepository<TrustedContact, Long> {
    List<TrustedContact> findByUserIdOrderByPriorityAsc(Long userId);
    long countByUserId(Long userId);
}
