package it.assoincloud.backend.controller;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration tests for BackupController endpoints.
 */
@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:sqlite::memory:",
    "spring.jpa.hibernate.ddl-auto=none"
})
@AutoConfigureMockMvc
@WithMockUser
class BackupControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void getVersionShouldReturnCurrentDatabaseVersion() throws Exception {
        mockMvc.perform(get("/api/backup/version"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.version", notNullValue()))
                .andExpect(jsonPath("$.version", is("6")));
    }

    @Test
    void downloadShouldReturnBinaryContentWithDispositionHeader() throws Exception {
        mockMvc.perform(get("/api/backup"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_OCTET_STREAM))
                .andExpect(header().string("Content-Disposition",
                        org.hamcrest.Matchers.containsString("attachment")))
                .andExpect(header().string("Content-Disposition",
                        org.hamcrest.Matchers.containsString(".db")));
    }

    @Test
    void downloadShouldReturnValidSqliteBytes() throws Exception {
        byte[] body = mockMvc.perform(get("/api/backup"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsByteArray();

        // Verify SQLite magic header
        org.assertj.core.api.Assertions.assertThat(body).isNotEmpty();
        org.assertj.core.api.Assertions.assertThat(new String(body, 0, 6)).isEqualTo("SQLite");
    }

    @Test
    void inspectShouldReturnVersionFromValidBackupFile() throws Exception {
        // First download a valid backup to use as the inspect payload
        byte[] backupBytes = mockMvc.perform(get("/api/backup"))
                .andReturn()
                .getResponse()
                .getContentAsByteArray();

        MockMultipartFile file = new MockMultipartFile(
                "file", "backup.db", "application/octet-stream", backupBytes);

        mockMvc.perform(multipart("/api/backup/inspect").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.version", is("6")));
    }

    @Test
    void inspectWithInvalidFileShouldReturn400() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "invalid.db", "application/octet-stream",
                "this is not a sqlite file".getBytes());

        mockMvc.perform(multipart("/api/backup/inspect").file(file))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", notNullValue()));
    }

    @Test
    void restoreWithValidBackupFileShouldReturn200() throws Exception {
        byte[] backupBytes = mockMvc.perform(get("/api/backup"))
                .andReturn()
                .getResponse()
                .getContentAsByteArray();

        MockMultipartFile file = new MockMultipartFile(
                "file", "backup.db", "application/octet-stream", backupBytes);

        mockMvc.perform(multipart("/api/backup/restore").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", notNullValue()));
    }

    @Test
    void restoreWithInvalidFileShouldReturn400() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "invalid.db", "application/octet-stream",
                "not a database".getBytes());

        mockMvc.perform(multipart("/api/backup/restore").file(file))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", notNullValue()));
    }
}
