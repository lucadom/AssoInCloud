package it.assoincloud.backend.controller;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import it.assoincloud.backend.dto.ProductSearchResultDto;
import it.assoincloud.backend.repository.InvoiceLineItemRepository;

@RestController
@RequestMapping("/api/products")
@CrossOrigin
public class ProductController {

    private final InvoiceLineItemRepository lineItemRepository;

    public ProductController(InvoiceLineItemRepository lineItemRepository) {
        this.lineItemRepository = lineItemRepository;
    }

    @GetMapping("/search")
    public List<ProductSearchResultDto> search(@RequestParam("q") String query) {
        if (query == null || query.isBlank()) {
            return List.of();
        }
        String pattern = buildLikePattern(query.trim());
        return lineItemRepository.searchByDescription(pattern).stream()
                .map(ProductSearchResultDto::from)
                .toList();
    }

    /**
     * Converts a user query with optional wildcards (*) into a SQL LIKE pattern.
     * Each * becomes %, and the whole pattern is wrapped in % for substring matching.
     * Example: "the*limone*12" → "%the%limone%12%"
     */
    static String buildLikePattern(String query) {
        // Escape any existing SQL wildcards in user input
        String escaped = query.replace("%", "\\%").replace("_", "\\_");
        // Convert user wildcard * to SQL %
        String pattern = escaped.replace("*", "%");
        // Wrap in % for substring matching
        return "%" + pattern + "%";
    }
}
