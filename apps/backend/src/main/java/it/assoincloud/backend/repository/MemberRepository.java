package it.assoincloud.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import it.assoincloud.backend.entity.Member;

public interface MemberRepository extends JpaRepository<Member, String> {
    Optional<Member> findByFiscalCode(String fiscalCode);
    boolean existsByFiscalCode(String fiscalCode);
    
    /**
     * Find all members who are active for the current calendar year.
     * A member is active if they have the current year in their membership years.
     */
    @Query("""
        SELECT DISTINCT m FROM Member m
        JOIN m.membershipYears my
        WHERE my.year = CAST(FUNCTION('strftime', '%Y', 'now') AS integer)
        ORDER BY m.lastName, m.firstName
    """)
    List<Member> findAllActive();
}
