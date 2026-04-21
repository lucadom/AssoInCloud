package it.assoincloud.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import it.assoincloud.backend.entity.MembershipYear;

public interface MembershipYearRepository extends JpaRepository<MembershipYear, String> {
    /**
     * Find a membership year entry for a specific member and year.
     */
    Optional<MembershipYear> findByMemberIdAndYear(String memberId, Integer year);
    
    /**
     * Check if a member already has a membership year entry for a specific year.
     */
    boolean existsByMemberIdAndYear(String memberId, Integer year);
    
    /**
     * Delete a membership year entry for a specific member and year.
     */
    void deleteByMemberIdAndYear(String memberId, Integer year);
}
