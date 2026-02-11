package it.assoincloud.backend.repository;

import it.assoincloud.backend.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface SupplierRepository extends JpaRepository<Supplier, String> {
    Optional<Supplier> findByVatNumber(String vatNumber);
}
