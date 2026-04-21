package it.assoincloud.backend.dto;

import java.util.List;

public record BulkMoveRequest(List<String> paths, String targetPath) {}
