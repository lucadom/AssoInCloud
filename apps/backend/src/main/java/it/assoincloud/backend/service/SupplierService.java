package it.assoincloud.backend.service;

import java.util.List;

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

    private final SupplierRepository supplierRepository;
    private final InvoiceRepository invoiceRepository;

    public SupplierService(SupplierRepository supplierRepository, InvoiceRepository invoiceRepository) {
        this.supplierRepository = supplierRepository;
        this.invoiceRepository = invoiceRepository;
    }

    @Transactional(readOnly = true)
    public List<SupplierDto> findAll() {
        return supplierRepository.findAll().stream()
                .map(s -> SupplierDto.from(s, invoiceRepository.countBySupplierId(s.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public SupplierDto findById(String id) {
        Supplier s = supplierRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Fornitore non trovato: " + id));
        return SupplierDto.from(s, invoiceRepository.countBySupplierId(s.getId()));
    }

    public SupplierDto create(SupplierFormData data) {
        if (supplierRepository.findByVatNumber(data.vatNumber()).isPresent()) {
            throw new IllegalArgumentException("Esiste già un fornitore con P.IVA " + data.vatNumber());
        }
        Supplier s = new Supplier(data.name(), data.vatNumber());
        s.setPaymentMethod(data.paymentMethod());
        s = supplierRepository.save(s);
        return SupplierDto.from(s, 0);
    }

    public SupplierDto update(String id, SupplierFormData data) {
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
            throw new IllegalStateException(
                    "Impossibile eliminare il fornitore: ha " + count + " fattura/e associate");
        }
        supplierRepository.delete(s);
    }
}
