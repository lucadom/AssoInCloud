package it.assoincloud.backend.dto;

import java.math.BigDecimal;

/**
 * DTO for price list entries: one row per (description, unitPrice, discountPercentage) combination,
 * with the last purchase date, total ordered quantity, and the effective unit price after discount.
 */
public record PriceListItemDto(
    String description,
    String unitOfMeasure,
    BigDecimal unitPrice,
    String lastPurchaseDate,
    BigDecimal totalQuantity,
    BigDecimal discountPercentage,
    BigDecimal effectiveUnitPrice
) {}
