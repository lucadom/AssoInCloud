package it.assoincloud.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import it.assoincloud.backend.entity.InvoiceAttachment;

public interface InvoiceAttachmentRepository extends JpaRepository<InvoiceAttachment, String> {
    Optional<InvoiceAttachment> findByIdAndInvoiceId(String id, String invoiceId);
}
