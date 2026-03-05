package it.assoincloud.backend.dto;

import java.util.List;

public record PecMessageDto(
        long uid,
        String folder,
        String from,
        String subject,
        String date,
        boolean read,
        String bodyHtml,
        String bodyText,
        List<PecAttachmentDto> attachments) {
}
