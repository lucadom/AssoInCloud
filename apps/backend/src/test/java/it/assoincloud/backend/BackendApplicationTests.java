package it.assoincloud.backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
	"spring.datasource.url=jdbc:sqlite::memory:",
	"spring.jpa.hibernate.ddl-auto=none"
})
class BackendApplicationTests {

	@Test
	void contextLoads() {
	}

}
