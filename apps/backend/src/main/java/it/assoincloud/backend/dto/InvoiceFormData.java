package it.assoincloud.backend.dto;

import java.math.BigDecimal;

/**
 * Payload for creating / updating an invoice.
 */
public record InvoiceFormData(
    String documentType,
    String invoiceNumber,
    String date,               // ISO date string (yyyy-MM-dd) or ISO datetime
    String supplierName,
    String supplierVatNumber,
    BigDecimal taxableAmount,
    BigDecimal taxAmount,
    String sdiNumber,
    boolean viewed
) {}
