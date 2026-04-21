package it.assoincloud.backend.dto;

import java.util.List;

import it.assoincloud.backend.entity.Member;

public record MemberDto(
    String id,
    String lastName,
    String firstName,
    String birthDate,
    String birthPlace,
    String fiscalCode,
    String address,
    String city,
    String phone,
    String membershipDate,
    List<Integer> membershipYears,
    boolean active
) {
    public static MemberDto from(Member member) {
        List<Integer> years = member.getMembershipYears().stream()
            .map(my -> my.getYear())
            .sorted()
            .toList();
        
        return new MemberDto(
            member.getId(),
            member.getLastName(),
            member.getFirstName(),
            member.getBirthDate() != null ? member.getBirthDate().toString() : null,
            member.getBirthPlace(),
            member.getFiscalCode(),
            member.getAddress(),
            member.getCity(),
            member.getPhone(),
            member.getMembershipDate() != null ? member.getMembershipDate().toString() : null,
            years,
            member.isActive()
        );
    }
}
