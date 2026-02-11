package it.assoincloud.backend.dto;

import java.math.BigDecimal;

import it.assoincloud.backend.entity.InvoiceLineItem;

/**
 * DTO for product search results, combining line item data with invoice/supplier context.
 */
public record ProductSearchResultDto(
    String lineItemId,
    String supplierName,
    String invoiceDate,
    String description,
    BigDecimal quantity,
    String unitOfMeasure,
    BigDecimal unitPrice,
    BigDecimal totalPrice
) {

    public static ProductSearchResultDto from(InvoiceLineItem item) {
        return new ProductSearchResultDto(
            item.getId(),
            item.getInvoice().getSupplier().getName(),
            item.getInvoice().getDate().toString(),
            item.getDescription(),
            item.getQuantity(),
            item.getUnitOfMeasure(),
            item.getUnitPrice(),
            item.getTotalPrice()
        );
    }
}
