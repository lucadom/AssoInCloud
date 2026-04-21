package it.assoincloud.backend.exception;

public class DocumentConflictException extends RuntimeException {
    public DocumentConflictException(String message) { super(message); }
}
