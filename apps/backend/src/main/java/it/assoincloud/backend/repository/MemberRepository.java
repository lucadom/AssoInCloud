package it.assoincloud.backend.repository;

import it.assoincloud.backend.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MemberRepository extends JpaRepository<Member, String> {
    Optional<Member> findByFiscalCode(String fiscalCode);
    boolean existsByFiscalCode(String fiscalCode);
}
