package com.umglossary.backend.service;

import com.umglossary.backend.model.GlossaryEntry;
import com.umglossary.backend.repository.GlossaryRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Service
public class GlossaryService {

    private final GlossaryRepository repository;

    public GlossaryService(GlossaryRepository repository, @Value("${app.data.glossary-json-path}") String glossaryJsonPath) {
        // 註解：保留 glossary-json-path 參數相容舊設定（現階段不再用檔案當主要儲存）。
        this.repository = repository;
    }

    public synchronized List<GlossaryEntry> search(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return repository.search(null);
        }
        String q = keyword.toLowerCase(Locale.ROOT).trim();
        return repository.search(q);
    }

    public synchronized Optional<GlossaryEntry> findById(String id) {
        return repository.findById(id);
    }

    public synchronized Optional<GlossaryEntry> updateEntry(String id, GlossaryEntry payload) throws IOException {
        Optional<GlossaryEntry> original = repository.findById(id);
        if (original.isEmpty()) {
            return Optional.empty();
        }

        GlossaryEntry base = original.get();
        GlossaryEntry merged = new GlossaryEntry(
                base.id(),
                base.sourceSheet(),
                base.sourceRow(),
                safe(payload.termZh(), base.termZh()),
                safe(payload.termEn(), base.termEn()),
                safe(payload.code(), base.code()),
                safe(payload.exampleZh(), base.exampleZh()),
                safe(payload.exampleEn(), base.exampleEn()),
                payload.aliasesZh() == null ? base.aliasesZh() : payload.aliasesZh(),
                payload.aliasesEn() == null ? base.aliasesEn() : payload.aliasesEn(),
                payload.abbreviations() == null ? base.abbreviations() : payload.abbreviations(),
                safe(payload.remarks(), base.remarks()),
                null,
                Instant.now().toString()
        );
        return repository.update(id, merged);
    }

    public synchronized void replaceAll(List<GlossaryEntry> newEntries) {
        repository.replaceAll(newEntries);
    }

    public synchronized void saveToDisk(List<GlossaryEntry> newEntries) throws IOException {
        // 註解：改用 Postgres 後不再把整份 glossary 寫回檔案。
    }

    public static GlossaryEntry createEntry(
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
            String remarks
    ) {
        return new GlossaryEntry(
                UUID.randomUUID().toString(),
                sourceSheet,
                sourceRow,
                termZh,
                termEn,
                code,
                exampleZh,
                exampleEn,
                aliasesZh,
                aliasesEn,
                abbreviations,
                remarks,
                null,
                Instant.now().toString()
        );
    }

    private String safe(String newValue, String oldValue) {
        return newValue == null ? oldValue : newValue;
    }
}
