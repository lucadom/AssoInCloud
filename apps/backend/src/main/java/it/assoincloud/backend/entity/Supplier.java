package it.assoincloud.backend.entity;

import jakarta.persistence.*;
import java.util.Objects;

@Entity
@Table(name = "suppliers")
public class Supplier {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(name = "vat_number", nullable = false, unique = true)
    private String vatNumber;

    public Supplier() {}

    public Supplier(String name, String vatNumber) {
        this.name = name;
        this.vatNumber = vatNumber;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getVatNumber() { return vatNumber; }
    public void setVatNumber(String vatNumber) { this.vatNumber = vatNumber; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Supplier s)) return false;
        return Objects.equals(vatNumber, s.vatNumber);
    }

    @Override
    public int hashCode() {
        return Objects.hash(vatNumber);
    }
}
