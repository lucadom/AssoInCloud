package it.assoincloud.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import it.assoincloud.backend.entity.Invoice;

public interface InvoiceRepository extends JpaRepository<Invoice, String> {
    Optional<Invoice> findBySupplier_VatNumberAndInvoiceNumber(String vatNumber, String invoiceNumber);

    long countBySupplierId(String supplierId);
}
