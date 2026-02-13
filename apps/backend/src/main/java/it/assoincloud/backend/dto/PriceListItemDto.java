package it.assoincloud.backend.dto;

import java.math.BigDecimal;

/**
 * DTO for price list entries: one row per (description, unitPrice) combination,
 * with the last purchase date and total ordered quantity.
 */
public record PriceListItemDto(
    String description,
    String unitOfMeasure,
    BigDecimal unitPrice,
    String lastPurchaseDate,
    BigDecimal totalQuantity
) {}
