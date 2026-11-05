package it.assoincloud.backend.repository;

import java.util.Optional;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import it.assoincloud.backend.entity.Invoice;

public interface InvoiceRepository extends JpaRepository<Invoice, String> {
    Optional<Invoice> findBySupplier_VatNumberAndInvoiceNumber(String vatNumber, String invoiceNumber);

    long countBySupplierId(String supplierId);

    @Query(value = """
            WITH RECURSIVE months(month_number) AS (
                SELECT 1
                UNION ALL
                SELECT month_number + 1 FROM months WHERE month_number < 12
            ),
            years(year_number) AS (
                SELECT DISTINCT CAST(strftime('%Y', date) AS INTEGER)
                FROM invoices
                WHERE supplier_id = :supplierId
            ),
            monthly_totals(year_number, month_number, total_amount) AS (
                SELECT
                    CAST(strftime('%Y', date) AS INTEGER),
                    CAST(strftime('%m', date) AS INTEGER),
                    SUM(CASE
                        WHEN UPPER(TRIM(COALESCE(document_type, ''))) = 'TD04'
                            OR LOWER(TRIM(COALESCE(document_type, ''))) = 'nota di credito'
                        THEN -total_amount
                        ELSE total_amount
                    END)
                FROM invoices
                WHERE supplier_id = :supplierId
                GROUP BY CAST(strftime('%Y', date) AS INTEGER),
                         CAST(strftime('%m', date) AS INTEGER)
            )
            SELECT years.year_number AS year,
                   months.month_number AS month,
                   COALESCE(monthly_totals.total_amount, 0) AS totalAmount
            FROM years
            CROSS JOIN months
            LEFT JOIN monthly_totals
                ON monthly_totals.year_number = years.year_number
                AND monthly_totals.month_number = months.month_number
            ORDER BY years.year_number, months.month_number
            """, nativeQuery = true)
    List<MonthlySummaryProjection> findMonthlySummaryBySupplierId(@Param("supplierId") String supplierId);

    interface MonthlySummaryProjection {
        Integer getYear();
        Integer getMonth();
        java.math.BigDecimal getTotalAmount();
    }
}
