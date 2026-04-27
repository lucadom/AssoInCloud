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

    /**
     * Price list query: groups line items by (description, unit_of_measure, unit_price, discount_percentage)
     * for a given supplier, optionally filtered by date range. Returns one row per distinct
     * (price + discount) combination with the last purchase date and total ordered quantity.
     */
    @Query(value =
        "SELECT li.description, li.unit_of_measure, li.unit_price, " +
        "       MAX(i.date) AS last_purchase_date, " +
        "       SUM(li.quantity) AS total_quantity, " +
        "       li.discount_percentage " +
        "FROM invoice_line_items li " +
        "JOIN invoices i ON li.invoice_id = i.id " +
        "WHERE i.supplier_id = :supplierId " +
        "  AND (:dateFrom IS NULL OR i.date >= :dateFrom) " +
        "  AND (:dateTo IS NULL OR i.date <= :dateTo) " +
        "  AND li.unit_price > 0 " +
        "GROUP BY li.description, li.unit_of_measure, li.unit_price, li.discount_percentage " +
        "HAVING SUM(li.quantity) > 0 " +
        "ORDER BY li.description ASC, MAX(i.date) DESC",
        nativeQuery = true)
    List<Object[]> findPriceList(
        @Param("supplierId") String supplierId,
        @Param("dateFrom") String dateFrom,
        @Param("dateTo") String dateTo
    );
}
