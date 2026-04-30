package com.umglossary.backend.model;

import java.util.List;

public record GlossaryEntry(
        String id,
        String sourceSheet,
        int sourceRow,
        String termZh,
        String termEn,
        String code,
        String exampleZh,
        String exampleEn,
        List<String> aliasesZh,
        List<String> aliasesEn,
        List<String> abbreviations,
        String remarks,
        String searchableText,
        String updatedAt
) {
}
