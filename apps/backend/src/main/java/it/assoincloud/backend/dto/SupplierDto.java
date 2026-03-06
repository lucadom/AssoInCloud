package it.assoincloud.backend.dto;

import it.assoincloud.backend.entity.Supplier;

public record SupplierDto(
    String id,
    String name,
    String vatNumber,
    long invoiceCount,
    String paymentMethod
) {
    public static SupplierDto from(Supplier entity, long invoiceCount) {
        return new SupplierDto(
            entity.getId(),
            entity.getName(),
            entity.getVatNumber(),
            invoiceCount,
            entity.getPaymentMethod()
        );
    }
}
