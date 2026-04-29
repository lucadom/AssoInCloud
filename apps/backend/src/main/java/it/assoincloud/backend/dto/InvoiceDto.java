package it.assoincloud.backend.dto;

import java.math.BigDecimal;
import java.util.List;

import it.assoincloud.backend.entity.Invoice;
import it.assoincloud.backend.entity.InvoiceAttachment;
import it.assoincloud.backend.entity.InvoiceLineItem;
import it.assoincloud.backend.util.DocumentTypeUtil;

/**
 * JSON representation of an invoice returned to the frontend.
 */
public record InvoiceDto(
    String id,
    String documentType,
    String documentTypeDescription,
    boolean creditNote,
    String invoiceNumber,
    String date,
    SupplierDto supplier,
    BigDecimal taxableAmount,
    BigDecimal taxAmount,
    BigDecimal totalAmount,
    String sdiNumber,
    boolean viewed,
    String fileName,
    boolean sourceFileAvailable,
    String sourceFileName,
    // XML-specific fields
    String currency,
    String causale,
    String paymentMethod,
    String paymentDueDate,
    BigDecimal paymentAmount,
    String iban,
    String supplierFiscalCode,
    String supplierAddress,
    String supplierCap,
    String supplierCity,
    String supplierProvince,
    List<LineItemDto> lineItems,
    List<AttachmentDto> attachments
) {
    public static InvoiceDto from(Invoice entity) {
        List<LineItemDto> lineItemDtos = entity.getLineItems() != null
                ? entity.getLineItems().stream().map(LineItemDto::from).toList()
                : List.of();
        List<AttachmentDto> attachmentDtos = entity.getAttachments() != null
                ? entity.getAttachments().stream().map(AttachmentDto::from).toList()
                : List.of();

        String docType = entity.getDocumentType() != null ? entity.getDocumentType() : "";
        return new InvoiceDto(
            entity.getId(),
            docType,
            DocumentTypeUtil.getDescription(docType),
            DocumentTypeUtil.isCreditNote(docType),
            entity.getInvoiceNumber(),
            entity.getDate().toString(),
            SupplierDto.from(entity.getSupplier()),
            entity.getTaxableAmount(),
            entity.getTaxAmount(),
            entity.getTotalAmount(),
            entity.getSdiNumber() != null ? entity.getSdiNumber() : "",
            entity.isViewed(),
            entity.getFileName(),
            entity.getSourceFile() != null,
            entity.getSourceFile() != null ? entity.getSourceFile().getFileName() : null,
            entity.getCurrency(),
            entity.getCausale(),
            entity.getPaymentMethod(),
            entity.getPaymentDueDate(),
            entity.getPaymentAmount(),
            entity.getIban(),
            entity.getSupplierFiscalCode(),
            entity.getSupplierAddress(),
            entity.getSupplierCap(),
            entity.getSupplierCity(),
            entity.getSupplierProvince(),
            lineItemDtos,
            attachmentDtos
        );
    }

    public record SupplierDto(String id, String name, String vatNumber, String paymentMethod) {
        public static SupplierDto from(it.assoincloud.backend.entity.Supplier s) {
            return new SupplierDto(s.getId(), s.getName(), s.getVatNumber(), s.getPaymentMethod());
        }
    }

    public record LineItemDto(
        String id,
        int lineNumber,
        String description,
        BigDecimal quantity,
        String unitOfMeasure,
        BigDecimal unitPrice,
        BigDecimal totalPrice,
        BigDecimal vatRate,
        String articleCode,
        String articleCodeType,
        String eanCode,
        String discountType,
        BigDecimal discountPercentage
    ) {
        public static LineItemDto from(InvoiceLineItem item) {
            return new LineItemDto(
                item.getId(),
                item.getLineNumber(),
                item.getDescription(),
                item.getQuantity(),
                item.getUnitOfMeasure(),
                item.getUnitPrice(),
                item.getTotalPrice(),
                item.getVatRate(),
                item.getArticleCode(),
                item.getArticleCodeType(),
                item.getEanCode(),
                item.getDiscountType(),
                item.getDiscountPercentage()
            );
        }
    }

    public record AttachmentDto(
        String id,
        String fileName,
        String contentType
    ) {
        public static AttachmentDto from(InvoiceAttachment att) {
            return new AttachmentDto(att.getId(), att.getFileName(), att.getContentType());
        }
    }
}
