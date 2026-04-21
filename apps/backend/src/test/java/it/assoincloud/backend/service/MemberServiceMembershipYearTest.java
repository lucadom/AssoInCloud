package it.assoincloud.backend.service;

import java.time.LocalDate;
import java.time.Year;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import it.assoincloud.backend.entity.Member;
import it.assoincloud.backend.entity.MembershipYear;
import it.assoincloud.backend.repository.MemberRepository;
import it.assoincloud.backend.repository.MembershipYearRepository;

/**
 * Integration tests for MemberService membership year and renewal operations.
 */
@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:sqlite::memory:",
    "spring.jpa.hibernate.ddl-auto=none"
})
@Transactional
class MemberServiceMembershipYearTest {

    @Autowired
    private MemberService memberService;

    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private MembershipYearRepository membershipYearRepository;

    private Member testMember;
    private int currentYear;

    @BeforeEach
    void setUp() {
        testMember = new Member("Rossi", "Mario", "RSSMRA80A01H501U");
        testMember.setBirthDate(LocalDate.parse("1980-01-01"));
        testMember.setMembershipDate(LocalDate.parse("2025-01-15"));
        testMember = memberRepository.save(testMember);
        
        currentYear = Year.now().getValue();
    }

    @Test
    void testMemberWithoutCurrentYearIsInactive() {
        assertFalse(testMember.isActive());
    }

    @Test
    void testMemberWithCurrentYearIsActive() {
        MembershipYear year = new MembershipYear(testMember, currentYear);
        membershipYearRepository.save(year);
        testMember.getMembershipYears().add(year);
        
        assertTrue(testMember.isActive());
    }

    @Test
    void testRenewalAddsCurrentYear() {
        assertFalse(testMember.isActive());
        
        Member renewed = memberService.renewMembership(testMember.getId());
        
        assertTrue(renewed.isActive());
        assertTrue(membershipYearRepository.existsByMemberIdAndYear(testMember.getId(), currentYear));
    }

    @Test
    void testRenewalIsIdempotent() {
        // First renewal
        Member renewed = memberService.renewMembership(testMember.getId());
        assertTrue(renewed.isActive());
        
        // Second renewal should not fail
        Member renewed2 = memberService.renewMembership(testMember.getId());
        assertTrue(renewed2.isActive());
        
        // Should only have one current year entry
        long count = membershipYearRepository.findAll().stream()
            .filter(my -> my.getYear() == currentYear && my.getMember().getId().equals(testMember.getId()))
            .count();
        assertEquals(1, count);
    }

    @Test
    void testRenewalAfterGapYears() {
        // Member had membership in 2020, but not since then
        MembershipYear year2020 = new MembershipYear(testMember, 2020);
        membershipYearRepository.save(year2020);
        testMember.getMembershipYears().add(year2020);
        memberRepository.save(testMember);
        
        assertFalse(testMember.isActive());
        
        // Renewal should work without backfilling gap years
        Member renewed = memberService.renewMembership(testMember.getId());
        assertTrue(renewed.isActive());
        
        // Should have 2020 and current year, but not 2021-2025
        assertEquals(2, renewed.getMembershipYears().size());
        assertTrue(renewed.getMembershipYears().stream()
            .map(MembershipYear::getYear)
            .anyMatch(y -> y == 2020));
        assertTrue(renewed.getMembershipYears().stream()
            .map(MembershipYear::getYear)
            .anyMatch(y -> y == currentYear));
    }

    @Test
    void testRenewalInvalidMemberThrows() {
        assertThrows(IllegalArgumentException.class, () -> {
            memberService.renewMembership("invalid-id");
        });
    }

    @Test
    void testFindAllActiveFiltersCorrectly() {
        // Add current year to testMember
        memberService.renewMembership(testMember.getId());
        
        // Create another member without current year
        Member inactive = new Member("Bianchi", "Anna", "BNNCNA90A01H501U");
        inactive.setMembershipDate(LocalDate.parse("2024-01-01"));
        memberRepository.save(inactive);
        
        var active = memberService.findAllActive();
        
        assertEquals(1, active.size());
        assertEquals(testMember.getId(), active.get(0).getId());
    }

    @Test
    void testMultipleYearsPreserveGaps() {
        // Add several non-contiguous years
        membershipYearRepository.save(new MembershipYear(testMember, 2020));
        membershipYearRepository.save(new MembershipYear(testMember, 2022));
        membershipYearRepository.save(new MembershipYear(testMember, currentYear));
        
        // Verify all years are persisted in the repository
        var allYears = membershipYearRepository.findAll();
        var memberYears = allYears.stream()
            .filter(my -> my.getMember().getId().equals(testMember.getId()))
            .map(MembershipYear::getYear)
            .sorted()
            .toList();
        
        assertEquals(3, memberYears.size());
        assertEquals(java.util.List.of(2020, 2022, currentYear), memberYears);
    }
}
