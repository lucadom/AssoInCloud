package it.assoincloud.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import it.assoincloud.backend.entity.InvoiceSourceFile;

public interface InvoiceSourceFileRepository extends JpaRepository<InvoiceSourceFile, String> {
    Optional<InvoiceSourceFile> findByInvoiceId(String invoiceId);
}
