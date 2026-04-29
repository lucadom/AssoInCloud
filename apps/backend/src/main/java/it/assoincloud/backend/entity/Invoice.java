package it.assoincloud.backend.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "invoices")
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "document_type")
    private String documentType;

    @Column(name = "invoice_number", nullable = false)
    private String invoiceNumber;

    @Column(nullable = false)
    private LocalDate date;

    @ManyToOne(optional = false, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinColumn(name = "supplier_id", nullable = false)
    private Supplier supplier;

    @Column(name = "taxable_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal taxableAmount;

    @Column(name = "tax_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal taxAmount;

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "sdi_number")
    private String sdiNumber;

    @Column(nullable = false)
    private boolean viewed;

    @Column(name = "file_name")
    private String fileName;

    // --- XML-specific fields ---

    @Column
    private String currency;

    @Column
    private String causale;

    @Column(name = "payment_method")
    private String paymentMethod;

    @Column(name = "payment_due_date")
    private String paymentDueDate;

    @Column(name = "payment_amount", precision = 12, scale = 2)
    private BigDecimal paymentAmount;

    @Column
    private String iban;

    @Column(name = "supplier_fiscal_code")
    private String supplierFiscalCode;

    @Column(name = "supplier_address")
    private String supplierAddress;

    @Column(name = "supplier_cap")
    private String supplierCap;

    @Column(name = "supplier_city")
    private String supplierCity;

    @Column(name = "supplier_province")
    private String supplierProvince;

    // --- Relations ---

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("lineNumber ASC")
    private List<InvoiceLineItem> lineItems = new ArrayList<>();

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<InvoiceAttachment> attachments = new ArrayList<>();

    @OneToOne(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private InvoiceSourceFile sourceFile;

    public Invoice() {}

    // --- Getters / Setters ---

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getDocumentType() { return documentType; }
    public void setDocumentType(String documentType) { this.documentType = documentType; }

    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public Supplier getSupplier() { return supplier; }
    public void setSupplier(Supplier supplier) { this.supplier = supplier; }

    public BigDecimal getTaxableAmount() { return taxableAmount; }
    public void setTaxableAmount(BigDecimal taxableAmount) { this.taxableAmount = taxableAmount; }

    public BigDecimal getTaxAmount() { return taxAmount; }
    public void setTaxAmount(BigDecimal taxAmount) { this.taxAmount = taxAmount; }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

    public String getSdiNumber() { return sdiNumber; }
    public void setSdiNumber(String sdiNumber) { this.sdiNumber = sdiNumber; }

    public boolean isViewed() { return viewed; }
    public void setViewed(boolean viewed) { this.viewed = viewed; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getCausale() { return causale; }
    public void setCausale(String causale) { this.causale = causale; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getPaymentDueDate() { return paymentDueDate; }
    public void setPaymentDueDate(String paymentDueDate) { this.paymentDueDate = paymentDueDate; }

    public BigDecimal getPaymentAmount() { return paymentAmount; }
    public void setPaymentAmount(BigDecimal paymentAmount) { this.paymentAmount = paymentAmount; }

    public String getIban() { return iban; }
    public void setIban(String iban) { this.iban = iban; }

    public String getSupplierFiscalCode() { return supplierFiscalCode; }
    public void setSupplierFiscalCode(String supplierFiscalCode) { this.supplierFiscalCode = supplierFiscalCode; }

    public String getSupplierAddress() { return supplierAddress; }
    public void setSupplierAddress(String supplierAddress) { this.supplierAddress = supplierAddress; }

    public String getSupplierCap() { return supplierCap; }
    public void setSupplierCap(String supplierCap) { this.supplierCap = supplierCap; }

    public String getSupplierCity() { return supplierCity; }
    public void setSupplierCity(String supplierCity) { this.supplierCity = supplierCity; }

    public String getSupplierProvince() { return supplierProvince; }
    public void setSupplierProvince(String supplierProvince) { this.supplierProvince = supplierProvince; }

    public List<InvoiceLineItem> getLineItems() { return lineItems; }
    public void setLineItems(List<InvoiceLineItem> lineItems) { this.lineItems = lineItems; }

    public List<InvoiceAttachment> getAttachments() { return attachments; }
    public void setAttachments(List<InvoiceAttachment> attachments) { this.attachments = attachments; }

    public InvoiceSourceFile getSourceFile() { return sourceFile; }
    public void setSourceFile(InvoiceSourceFile sourceFile) {
        this.sourceFile = sourceFile;
        if (sourceFile != null) {
            sourceFile.setInvoice(this);
        }
    }

    @PrePersist
    @PreUpdate
    private void computeTotal() {
        if (taxableAmount != null && taxAmount != null) {
            this.totalAmount = taxableAmount.add(taxAmount);
        }
    }
}
