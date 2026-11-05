package it.assoincloud.backend.dto;

import java.math.BigDecimal;

public record InvoiceMonthlySummaryDto(int year, int month, BigDecimal totalAmount) {}
