package com.umglossary.backend.model;

import java.util.List;

public record ImportResult(
        int successCount,
        int errorCount,
        String backupFileName,
        List<String> errors
) {
}
