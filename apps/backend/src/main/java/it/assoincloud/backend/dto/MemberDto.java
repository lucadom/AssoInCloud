package it.assoincloud.backend.dto;

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
    String membershipDate
) {
    public static MemberDto from(Member member) {
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
            member.getMembershipDate() != null ? member.getMembershipDate().toString() : null
        );
    }
}
