package it.assoincloud.backend.service;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import it.assoincloud.backend.dto.SupplierDto;
import it.assoincloud.backend.dto.SupplierFormData;
import it.assoincloud.backend.entity.Supplier;
import it.assoincloud.backend.repository.InvoiceRepository;
import it.assoincloud.backend.repository.SupplierRepository;

@Service
@Transactional
public class SupplierService {

    private static final Logger log = LoggerFactory.getLogger(SupplierService.class);

    private final SupplierRepository supplierRepository;
    private final InvoiceRepository invoiceRepository;

    public SupplierService(SupplierRepository supplierRepository, InvoiceRepository invoiceRepository) {
        this.supplierRepository = supplierRepository;
        this.invoiceRepository = invoiceRepository;
    }

    @Transactional(readOnly = true)
    public List<SupplierDto> findAll() {
        log.info("Fetching all suppliers");
        return supplierRepository.findAll().stream()
                .map(s -> SupplierDto.from(s, invoiceRepository.countBySupplierId(s.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public SupplierDto findById(String id) {
        log.debug("Fetching supplier by id: {}", id);
        Supplier s = supplierRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Fornitore non trovato: " + id));
        return SupplierDto.from(s, invoiceRepository.countBySupplierId(s.getId()));
    }

    public SupplierDto create(SupplierFormData data) {
        if (supplierRepository.findByVatNumber(data.vatNumber()).isPresent()) {
            log.warn("Cannot create supplier: VAT number already exists: {}", data.vatNumber());
            throw new IllegalArgumentException("Esiste già un fornitore con P.IVA " + data.vatNumber());
        }
        log.info("Creating supplier: name='{}', VAT={}", data.name(), data.vatNumber());
        Supplier s = new Supplier(data.name(), data.vatNumber());
        s.setPaymentMethod(data.paymentMethod());
        s = supplierRepository.save(s);
        log.info("Supplier created with id: {}", s.getId());
        return SupplierDto.from(s, 0);
    }

    public SupplierDto update(String id, SupplierFormData data) {
        log.info("Updating supplier id: {}", id);
        Supplier s = supplierRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Fornitore non trovato: " + id));

        // Check uniqueness of vatNumber if changed
        supplierRepository.findByVatNumber(data.vatNumber())
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("Esiste già un fornitore con P.IVA " + data.vatNumber());
                });

        s.setName(data.name());
        s.setVatNumber(data.vatNumber());
        s.setPaymentMethod(data.paymentMethod());
        s = supplierRepository.save(s);
        return SupplierDto.from(s, invoiceRepository.countBySupplierId(s.getId()));
    }

    public void delete(String id) {
        Supplier s = supplierRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Fornitore non trovato: " + id));
        long count = invoiceRepository.countBySupplierId(s.getId());
        if (count > 0) {
            log.warn("Cannot delete supplier id: {} - has {} linked invoice(s)", id, count);
            throw new IllegalStateException(
                    "Impossibile eliminare il fornitore: ha " + count + " fattura/e associate");
        }
        log.info("Deleting supplier id: {} (name='{}', VAT={})", id, s.getName(), s.getVatNumber());
        supplierRepository.delete(s);
    }
}
