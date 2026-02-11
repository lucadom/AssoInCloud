package it.assoincloud.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import it.assoincloud.backend.entity.InvoiceLineItem;

public interface InvoiceLineItemRepository extends JpaRepository<InvoiceLineItem, String> {

    @Query("SELECT li FROM InvoiceLineItem li " +
           "JOIN FETCH li.invoice i " +
           "JOIN FETCH i.supplier s " +
           "WHERE LOWER(li.description) LIKE LOWER(:pattern) " +
           "ORDER BY i.date DESC, s.name ASC, li.lineNumber ASC")
    List<InvoiceLineItem> searchByDescription(@Param("pattern") String pattern);
}
