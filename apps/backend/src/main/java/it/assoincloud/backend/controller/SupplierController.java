package it.assoincloud.backend.controller;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import it.assoincloud.backend.dto.SupplierDto;
import it.assoincloud.backend.dto.SupplierFormData;
import it.assoincloud.backend.service.SupplierService;

@RestController
@RequestMapping("/api/suppliers")
@CrossOrigin
public class SupplierController {

    private static final Logger log = LoggerFactory.getLogger(SupplierController.class);

    private final SupplierService supplierService;

    public SupplierController(SupplierService supplierService) {
        this.supplierService = supplierService;
    }

    @GetMapping
    public List<SupplierDto> list() {
        return supplierService.findAll();
    }

    @GetMapping("/{id}")
    public SupplierDto get(@PathVariable String id) {
        return supplierService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<?> create(@RequestBody SupplierFormData data) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(supplierService.create(data));
        } catch (IllegalArgumentException e) {
            log.warn("Failed to create supplier: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody SupplierFormData data) {
        try {
            return ResponseEntity.ok(supplierService.update(id, data));
        } catch (IllegalArgumentException e) {
            log.warn("Failed to update supplier id={}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        try {
            supplierService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalStateException e) {
            log.warn("Cannot delete supplier id={}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
