package it.assoincloud.backend.dto;

import it.assoincloud.backend.entity.MembershipYear;

public record MembershipYearDto(
    String id,
    Integer year
) {
    public static MembershipYearDto from(MembershipYear membershipYear) {
        return new MembershipYearDto(
            membershipYear.getId(),
            membershipYear.getYear()
        );
    }
}
