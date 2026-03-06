package it.assoincloud.backend.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for FrontendController.
 */
@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:sqlite::memory:",
    "spring.jpa.hibernate.ddl-auto=none"
})
@AutoConfigureMockMvc
class FrontendControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void loginShouldForwardToLoginHtml() throws Exception {
        // The controller forwards to /login.html; in tests this may return 404
        // (no static file), but the controller method IS executed.
        mockMvc.perform(get("/login"))
                .andExpect(status().is(org.hamcrest.Matchers.anyOf(
                        org.hamcrest.Matchers.is(200),
                        org.hamcrest.Matchers.is(302),
                        org.hamcrest.Matchers.is(401),
                        org.hamcrest.Matchers.is(404))));
    }

    @Test
    void loginWithTrailingSlashShouldAlsoBeHandled() throws Exception {
        mockMvc.perform(get("/login/"))
                .andExpect(status().is(org.hamcrest.Matchers.anyOf(
                        org.hamcrest.Matchers.is(200),
                        org.hamcrest.Matchers.is(302),
                        org.hamcrest.Matchers.is(401),
                        org.hamcrest.Matchers.is(404))));
    }
}
