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

import org.springframework.beans.factory.annotation.Value;
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

@Service
public class PecService {

    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_OFFSET_DATE_TIME;

    private final String host;
    private final int port;
    private final String username;
    private final String password;
    private final boolean ssl;
    private final boolean sslTrustAll;

    public PecService(
            @Value("${assoincloud.pec.host:}") String host,
            @Value("${assoincloud.pec.port:993}") int port,
            @Value("${assoincloud.pec.username:}") String username,
            @Value("${assoincloud.pec.password:}") String password,
            @Value("${assoincloud.pec.ssl:true}") boolean ssl,
            @Value("${assoincloud.pec.ssl-trust-all:false}") boolean sslTrustAll) {
        this.host = host;
        this.port = port;
        this.username = username;
        this.password = password;
        this.ssl = ssl;
        this.sslTrustAll = sslTrustAll;
    }

    public boolean isConfigured() {
        return host != null && !host.isBlank();
    }

    public List<PecFolderDto> listFolders() {
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
                        result.add(new PecFolderDto(folder.getName(), folder.getFullName(), 0, 0));
                    }
                }
            }
            return result;
        } catch (MessagingException e) {
            throw new RuntimeException("Errore nella connessione alla casella PEC: " + e.getMessage(), e);
        }
    }

    public List<PecMessageSummaryDto> listMessages(String folderName, int page, int size) {
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
                return result;
            } finally {
                folder.close(false);
            }
        } catch (MessagingException e) {
            throw new RuntimeException("Errore nella lettura dei messaggi: " + e.getMessage(), e);
        }
    }

    public PecMessageDto getMessage(String folderName, long uid) {
        try (Store store = openStore()) {
            Folder folder = store.getFolder(folderName);
            folder.open(Folder.READ_ONLY);
            try {
                UIDFolder uidFolder = (UIDFolder) folder;
                Message msg = uidFolder.getMessageByUID(uid);
                if (msg == null) {
                    throw new IllegalArgumentException("Messaggio non trovato");
                }

                String bodyHtml = extractBodyHtml(msg);
                String bodyText = extractBodyText(msg);
                List<PecAttachmentDto> attachments = extractAttachments(msg);

                return new PecMessageDto(
                        uid,
                        folderName,
                        getFrom(msg),
                        msg.getSubject(),
                        formatDate(msg.getSentDate()),
                        msg.getFlags().contains(Flags.Flag.SEEN),
                        bodyHtml,
                        bodyText,
                        attachments);
            } finally {
                folder.close(false);
            }
        } catch (MessagingException | IOException e) {
            throw new RuntimeException("Errore nella lettura del messaggio: " + e.getMessage(), e);
        }
    }

    public void setReadStatus(String folderName, long uid, boolean read) {
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
            throw new RuntimeException("Errore nell'aggiornamento dello stato del messaggio: " + e.getMessage(), e);
        }
    }

    public record AttachmentData(byte[] bytes, String contentType, String filename) {
    }

    public AttachmentData getAttachmentBytes(String folderName, long uid, int partIndex) {
        try (Store store = openStore()) {
            Folder folder = store.getFolder(folderName);
            folder.open(Folder.READ_ONLY);
            try {
                UIDFolder uidFolder = (UIDFolder) folder;
                Message msg = uidFolder.getMessageByUID(uid);
                if (msg == null) {
                    throw new IllegalArgumentException("Messaggio non trovato");
                }
                List<Part> attachmentParts = collectAttachmentParts(msg);
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

    // ---- private helpers ----

    private Store openStore() throws MessagingException {
        String protocol = ssl ? "imaps" : "imap";
        Properties props = new Properties();
        if (ssl) {
            props.put("mail.imaps.host", host);
            props.put("mail.imaps.port", String.valueOf(port));
            if (sslTrustAll) {
                // Trust any SSL certificate — needed for PEC providers that use
                // private CA chains not included in the standard JRE trust store
                // (e.g. Legalmail/Infocert). Enable via ASSOINCLOUD_PEC_SSL_TRUST_ALL=true.
                props.put("mail.imaps.ssl.trust", "*");
            }
        } else {
            props.put("mail.imap.host", host);
            props.put("mail.imap.port", String.valueOf(port));
        }
        Session session = Session.getInstance(props);
        Store store = session.getStore(protocol);
        store.connect(host, port, username, password);
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
