package it.assoincloud.backend.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Properties;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import it.assoincloud.backend.dto.PecAttachmentDto;
import it.assoincloud.backend.dto.PecFolderDto;
import it.assoincloud.backend.dto.PecMessageDto;
import it.assoincloud.backend.dto.PecMessageSummaryDto;
import jakarta.mail.Flags;
import jakarta.mail.Folder;
import jakarta.mail.Message;
import jakarta.mail.MessagingException;
import jakarta.mail.Multipart;
import jakarta.mail.Part;
import jakarta.mail.Session;
import jakarta.mail.Store;
import jakarta.mail.UIDFolder;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.search.BodyTerm;
import jakarta.mail.search.FromStringTerm;
import jakarta.mail.search.OrTerm;
import jakarta.mail.search.SearchTerm;
import jakarta.mail.search.SubjectTerm;

@Service
public class PecService {

    private static final Logger log = LoggerFactory.getLogger(PecService.class);
    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_OFFSET_DATE_TIME;

    private final AppSettingService appSettingService;

    public PecService(AppSettingService appSettingService) {
        this.appSettingService = appSettingService;
    }

    public boolean isConfigured() {
        String host = appSettingService.getPecSettings().host();
        return host != null && !host.isBlank();
    }

    public List<PecFolderDto> listFolders() {
        log.info("Listing PEC folders");
        try (Store store = openStore()) {
            Folder[] folders = store.getDefaultFolder().list("*");
            List<PecFolderDto> result = new ArrayList<>();
            for (Folder folder : folders) {
                if ((folder.getType() & Folder.HOLDS_MESSAGES) != 0) {
                    try {
                        folder.open(Folder.READ_ONLY);
                        int total = folder.getMessageCount();
                        int unread = folder.getUnreadMessageCount();
                        folder.close(false);
                        result.add(new PecFolderDto(folder.getName(), folder.getFullName(), total, unread));
                    } catch (MessagingException e) {
                        log.warn("Could not open folder '{}': {}", folder.getFullName(), e.getMessage());
                        result.add(new PecFolderDto(folder.getName(), folder.getFullName(), 0, 0));
                    }
                }
            }
            log.info("Found {} PEC folders", result.size());
            return result;
        } catch (MessagingException e) {
            log.error("Error connecting to PEC mailbox: {}", e.getMessage(), e);
            throw new RuntimeException("Errore nella connessione alla casella PEC: " + e.getMessage(), e);
        }
    }

    public List<PecMessageSummaryDto> listMessages(String folderName, int page, int size) {
        log.info("Listing PEC messages in folder '{}', page={}, size={}", folderName, page, size);
        try (Store store = openStore()) {
            Folder folder = store.getFolder(folderName);
            folder.open(Folder.READ_ONLY);
            try {
                int total = folder.getMessageCount();
                UIDFolder uidFolder = (UIDFolder) folder;

                // Calculate range (most recent first, 1-based index)
                int end = total - page * size;
                int start = Math.max(1, end - size + 1);
                if (end < 1) {
                    return List.of();
                }

                Message[] messages = folder.getMessages(start, end);
                List<PecMessageSummaryDto> result = new ArrayList<>();
                // Reverse to show most recent first
                for (int i = messages.length - 1; i >= 0; i--) {
                    Message msg = messages[i];
                    result.add(toSummaryDto(uidFolder.getUID(msg), folderName, msg));
                }
                log.info("Returned {} messages from folder '{}'", result.size(), folderName);
                return result;
            } finally {
                folder.close(false);
            }
        } catch (MessagingException e) {
            log.error("Error reading PEC messages from folder '{}': {}", folderName, e.getMessage(), e);
            throw new RuntimeException("Errore nella lettura dei messaggi: " + e.getMessage(), e);
        }
    }

    public List<PecMessageSummaryDto> searchMessages(String folderName, String query) {
        log.info("Searching PEC messages in folder '{}' with query='{}'", folderName, query);
        try (Store store = openStore()) {
            Folder folder = store.getFolder(folderName);
            folder.open(Folder.READ_ONLY);
            try {
                UIDFolder uidFolder = (UIDFolder) folder;
                SearchTerm term = new OrTerm(new SearchTerm[]{
                    new SubjectTerm(query),
                    new FromStringTerm(query),
                    new BodyTerm(query)
                });
                Message[] messages = folder.search(term);
                List<PecMessageSummaryDto> result = new ArrayList<>();
                for (int i = messages.length - 1; i >= 0; i--) {
                    Message msg = messages[i];
                    result.add(toSummaryDto(uidFolder.getUID(msg), folderName, msg));
                }
                log.info("Search in folder '{}' for '{}' returned {} messages", folderName, query, result.size());
                return result;
            } finally {
                folder.close(false);
            }
        } catch (MessagingException e) {
            log.error("Error searching PEC messages in folder '{}': {}", folderName, e.getMessage(), e);
            throw new RuntimeException("Errore nella ricerca dei messaggi: " + e.getMessage(), e);
        }
    }

    public PecMessageDto getMessage(String folderName, long uid, boolean envelope) {
        log.info("Fetching PEC message uid={} from folder '{}'", uid, folderName);
        try (Store store = openStore()) {
            Folder folder = store.getFolder(folderName);
            folder.open(Folder.READ_ONLY);
            try {
                UIDFolder uidFolder = (UIDFolder) folder;
                Message msg = uidFolder.getMessageByUID(uid);
                if (msg == null) {
                    throw new IllegalArgumentException("Messaggio non trovato");
                }

                boolean isBusta = !envelope && detectBustaTransporto(msg);

                if (isBusta) {
                    Message innerMsg = extractPostacertMessage(msg);
                    if (innerMsg != null) {
                        return new PecMessageDto(
                                uid,
                                folderName,
                                getFrom(innerMsg),
                                innerMsg.getSubject(),
                                formatDate(innerMsg.getSentDate()),
                                msg.getFlags().contains(Flags.Flag.SEEN),
                                extractBodyHtml(innerMsg),
                                extractBodyText(innerMsg),
                                extractAttachments(innerMsg),
                                true);
                    }
                }

                return new PecMessageDto(
                        uid,
                        folderName,
                        getFrom(msg),
                        msg.getSubject(),
                        formatDate(msg.getSentDate()),
                        msg.getFlags().contains(Flags.Flag.SEEN),
                        extractBodyHtml(msg),
                        extractBodyText(msg),
                        extractAttachments(msg),
                        false);
            } finally {
                folder.close(false);
            }
        } catch (MessagingException | IOException e) {
            log.error("Error reading PEC message uid={} from folder '{}': {}", uid, folderName, e.getMessage(), e);
            throw new RuntimeException("Errore nella lettura del messaggio: " + e.getMessage(), e);
        }
    }

    public void setReadStatus(String folderName, long uid, boolean read) {
        log.info("Setting read status uid={} in folder '{}' to read={}", uid, folderName, read);
        try (Store store = openStore()) {
            Folder folder = store.getFolder(folderName);
            folder.open(Folder.READ_WRITE);
            try {
                UIDFolder uidFolder = (UIDFolder) folder;
                Message msg = uidFolder.getMessageByUID(uid);
                if (msg == null) {
                    throw new IllegalArgumentException("Messaggio non trovato");
                }
                msg.setFlag(Flags.Flag.SEEN, read);
            } finally {
                folder.close(false);
            }
        } catch (MessagingException e) {
            log.error("Error updating read status uid={} in folder '{}': {}", uid, folderName, e.getMessage(), e);
            throw new RuntimeException("Errore nell'aggiornamento dello stato del messaggio: " + e.getMessage(), e);
        }
    }

    public record AttachmentData(byte[] bytes, String contentType, String filename) {
    }

    public AttachmentData getAttachmentBytes(String folderName, long uid, int partIndex, boolean envelope) {
        try (Store store = openStore()) {
            Folder folder = store.getFolder(folderName);
            folder.open(Folder.READ_ONLY);
            try {
                UIDFolder uidFolder = (UIDFolder) folder;
                Message msg = uidFolder.getMessageByUID(uid);
                if (msg == null) {
                    throw new IllegalArgumentException("Allegato non trovato");
                }

                List<Part> attachmentParts;
                if (!envelope && detectBustaTransporto(msg)) {
                    Message innerMsg = extractPostacertMessage(msg);
                    attachmentParts = innerMsg != null
                            ? collectAttachmentParts(innerMsg)
                            : collectAttachmentParts(msg);
                } else {
                    attachmentParts = collectAttachmentParts(msg);
                }

                if (partIndex < 0 || partIndex >= attachmentParts.size()) {
                    throw new IllegalArgumentException("Allegato non trovato");
                }
                Part part = attachmentParts.get(partIndex);
                try (InputStream is = part.getInputStream();
                        ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
                    is.transferTo(baos);
                    String filename = part.getFileName() != null ? part.getFileName() : "allegato";
                    String contentType = part.getContentType().split(";")[0].trim();
                    return new AttachmentData(baos.toByteArray(), contentType, filename);
                }
            } finally {
                folder.close(false);
            }
        } catch (MessagingException | IOException e) {
            throw new RuntimeException("Errore nel download dell'allegato: " + e.getMessage(), e);
        }
    }

    // ---- busta di trasporto helpers ----

    /**
     * Returns true if the message is a PEC "busta di trasporto" (transport envelope),
     * detected by the presence of a "postacert.eml" attachment.
     */
    private boolean detectBustaTransporto(Message msg) throws MessagingException, IOException {
        List<Part> parts = collectAttachmentParts(msg);
        for (Part part : parts) {
            if ("postacert.eml".equalsIgnoreCase(part.getFileName())) {
                return true;
            }
        }
        return false;
    }

    /**
     * Parses and returns the inner "postacert.eml" message contained
     * inside a PEC transport envelope, or null if not found.
     */
    private Message extractPostacertMessage(Message outerMsg) throws MessagingException, IOException {
        List<Part> parts = collectAttachmentParts(outerMsg);
        for (Part part : parts) {
            if ("postacert.eml".equalsIgnoreCase(part.getFileName())) {
                Session session = Session.getDefaultInstance(new Properties());
                try (InputStream is = part.getInputStream()) {
                    return new MimeMessage(session, is);
                }
            }
        }
        return null;
    }

    // ---- private helpers ----

    private Store openStore() throws MessagingException {
        it.assoincloud.backend.dto.PecSettingsDto cfg = appSettingService.getPecSettings();
        String password = appSettingService.getPecPassword();
        boolean ssl = cfg.ssl();
        String protocol = ssl ? "imaps" : "imap";
        Properties props = new Properties();
        if (ssl) {
            props.put("mail.imaps.host", cfg.host());
            props.put("mail.imaps.port", String.valueOf(cfg.port()));
            if (cfg.sslTrustAll()) {
                // Trust any SSL certificate — needed for PEC providers with private CA chains
                // (e.g. Legalmail/Infocert). Configure via the settings page.
                props.put("mail.imaps.ssl.trust", "*");
            }
        } else {
            props.put("mail.imap.host", cfg.host());
            props.put("mail.imap.port", String.valueOf(cfg.port()));
        }
        Session session = Session.getInstance(props);
        Store store = session.getStore(protocol);
        store.connect(cfg.host(), cfg.port(), cfg.username(), password);
        return store;
    }

    private PecMessageSummaryDto toSummaryDto(long uid, String folderName, Message msg)
            throws MessagingException {
        return new PecMessageSummaryDto(
                uid,
                folderName,
                getFrom(msg),
                msg.getSubject(),
                formatDate(msg.getSentDate()),
                msg.getFlags().contains(Flags.Flag.SEEN));
    }

    private String getFrom(Message msg) throws MessagingException {
        jakarta.mail.Address[] from = msg.getFrom();
        if (from == null || from.length == 0) {
            return "";
        }
        if (from[0] instanceof InternetAddress ia) {
            return ia.getPersonal() != null
                    ? ia.getPersonal() + " <" + ia.getAddress() + ">"
                    : ia.getAddress();
        }
        return from[0].toString();
    }

    private String formatDate(Date date) {
        if (date == null) {
            return null;
        }
        return date.toInstant().atZone(ZoneId.systemDefault()).format(ISO_FORMATTER);
    }

    private String extractBodyHtml(Part part) throws MessagingException, IOException {
        if (part.isMimeType("text/html")) {
            return (String) part.getContent();
        }
        if (part.isMimeType("multipart/*")) {
            Multipart mp = (Multipart) part.getContent();
            for (int i = 0; i < mp.getCount(); i++) {
                String html = extractBodyHtml(mp.getBodyPart(i));
                if (html != null) {
                    return html;
                }
            }
        }
        return null;
    }

    private String extractBodyText(Part part) throws MessagingException, IOException {
        if (part.isMimeType("text/plain") && !Part.ATTACHMENT.equalsIgnoreCase(part.getDisposition())) {
            return (String) part.getContent();
        }
        if (part.isMimeType("multipart/*")) {
            Multipart mp = (Multipart) part.getContent();
            for (int i = 0; i < mp.getCount(); i++) {
                String text = extractBodyText(mp.getBodyPart(i));
                if (text != null) {
                    return text;
                }
            }
        }
        return null;
    }

    private List<PecAttachmentDto> extractAttachments(Part part) throws MessagingException, IOException {
        List<Part> parts = collectAttachmentParts(part);
        List<PecAttachmentDto> result = new ArrayList<>();
        for (int i = 0; i < parts.size(); i++) {
            Part p = parts.get(i);
            String filename = p.getFileName() != null ? p.getFileName() : "allegato-" + i;
            String ct = p.getContentType().split(";")[0].trim();
            long size = p.getSize(); // -1 if unknown
            result.add(new PecAttachmentDto(i, filename, ct, size));
        }
        return result;
    }

    private List<Part> collectAttachmentParts(Part part) throws MessagingException, IOException {
        List<Part> parts = new ArrayList<>();
        collectAttachmentPartsRecursive(part, parts);
        return parts;
    }

    private void collectAttachmentPartsRecursive(Part part, List<Part> result)
            throws MessagingException, IOException {
        if (part.isMimeType("multipart/*")) {
            Multipart mp = (Multipart) part.getContent();
            for (int i = 0; i < mp.getCount(); i++) {
                collectAttachmentPartsRecursive(mp.getBodyPart(i), result);
            }
        } else {
            String disposition = part.getDisposition();
            if (Part.ATTACHMENT.equalsIgnoreCase(disposition) || part.getFileName() != null) {
                result.add(part);
            }
        }
    }
}
