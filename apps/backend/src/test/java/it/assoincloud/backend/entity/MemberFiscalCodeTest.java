package it.assoincloud.backend.entity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

/**
 * Integration tests to verify fiscal code is always stored in uppercase.
 */
@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:sqlite::memory:",
    "spring.jpa.hibernate.ddl-auto=none"
})
@Transactional
class MemberFiscalCodeTest {

    @Test
    void setFiscalCodeShouldConvertToUppercase() {
        Member member = new Member();
        member.setFiscalCode("rssmra80a01h501u");
        assertEquals("RSSMRA80A01H501U", member.getFiscalCode(), 
            "Fiscal code should be converted to uppercase when set");
    }

    @Test
    void constructorShouldConvertFiscalCodeToUppercase() {
        Member member = new Member("Rossi", "Mario", "rssmra80a01h501u");
        assertEquals("RSSMRA80A01H501U", member.getFiscalCode(), 
            "Fiscal code should be converted to uppercase in constructor");
    }

    @Test
    void setFiscalCodeWithMixedCaseShouldConvertToUppercase() {
        Member member = new Member();
        member.setFiscalCode("RssMra80A01h501U");
        assertEquals("RSSMRA80A01H501U", member.getFiscalCode(), 
            "Mixed case fiscal code should be converted to uppercase");
    }

    @Test
    void setFiscalCodeWithNullShouldPreserveNull() {
        Member member = new Member();
        member.setFiscalCode(null);
        assertNull(member.getFiscalCode(), 
            "Null fiscal code should remain null");
    }

    @Test
    void setFiscalCodeWithAlreadyUppercaseShouldRemainUnchanged() {
        Member member = new Member();
        member.setFiscalCode("RSSMRA80A01H501U");
        assertEquals("RSSMRA80A01H501U", member.getFiscalCode(), 
            "Already uppercase fiscal code should remain unchanged");
    }
}
