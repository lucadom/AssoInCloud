package it.assoincloud.backend.dto;

public record PecMessageSummaryDto(long uid, String folder, String from, String subject, String date, boolean read) {
}
