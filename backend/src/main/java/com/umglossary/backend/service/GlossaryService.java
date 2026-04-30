package com.umglossary.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.umglossary.backend.model.GlossaryEntry;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Service
public class GlossaryService {

    private final ObjectMapper objectMapper;
    private final Path glossaryJsonPath;
    private final List<GlossaryEntry> entries = new ArrayList<>();

    public GlossaryService(ObjectMapper objectMapper, @Value("${app.data.glossary-json-path}") String glossaryJsonPath) {
        this.objectMapper = objectMapper;
        this.glossaryJsonPath = Path.of(glossaryJsonPath);
        loadFromDisk();
    }

    public synchronized List<GlossaryEntry> search(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return List.copyOf(entries);
        }

        String q = keyword.toLowerCase(Locale.ROOT).trim();
        return entries.stream()
                .filter(item -> item.searchableText() != null && item.searchableText().toLowerCase(Locale.ROOT).contains(q))
                .toList();
    }

    public synchronized Optional<GlossaryEntry> findById(String id) {
        return entries.stream().filter(item -> item.id().equals(id)).findFirst();
    }

    public synchronized Optional<GlossaryEntry> updateEntry(String id, GlossaryEntry payload) throws IOException {
        int index = -1;
        for (int i = 0; i < entries.size(); i++) {
            if (entries.get(i).id().equals(id)) {
                index = i;
                break;
            }
        }
        if (index < 0) {
            return Optional.empty();
        }

        GlossaryEntry original = entries.get(index);
        GlossaryEntry updated = new GlossaryEntry(
                original.id(),
                original.sourceSheet(),
                original.sourceRow(),
                safe(payload.termZh(), original.termZh()),
                safe(payload.termEn(), original.termEn()),
                safe(payload.code(), original.code()),
                safe(payload.exampleZh(), original.exampleZh()),
                safe(payload.exampleEn(), original.exampleEn()),
                payload.aliasesZh() == null ? original.aliasesZh() : payload.aliasesZh(),
                payload.aliasesEn() == null ? original.aliasesEn() : payload.aliasesEn(),
                payload.abbreviations() == null ? original.abbreviations() : payload.abbreviations(),
                safe(payload.remarks(), original.remarks()),
                buildSearchableText(
                        safe(payload.termZh(), original.termZh()),
                        safe(payload.termEn(), original.termEn()),
                        safe(payload.code(), original.code()),
                        safe(payload.exampleZh(), original.exampleZh()),
                        safe(payload.exampleEn(), original.exampleEn()),
                        payload.aliasesZh() == null ? original.aliasesZh() : payload.aliasesZh(),
                        payload.aliasesEn() == null ? original.aliasesEn() : payload.aliasesEn(),
                        payload.abbreviations() == null ? original.abbreviations() : payload.abbreviations()
                ),
                Instant.now().toString()
        );
        entries.set(index, updated);
        saveToDisk(entries);
        return Optional.of(updated);
    }

    public synchronized void replaceAll(List<GlossaryEntry> newEntries) {
        entries.clear();
        entries.addAll(newEntries);
    }

    public synchronized void saveToDisk(List<GlossaryEntry> newEntries) throws IOException {
        Files.createDirectories(glossaryJsonPath.getParent());
        objectMapper.writerWithDefaultPrettyPrinter().writeValue(glossaryJsonPath.toFile(), newEntries);
    }

    private synchronized void loadFromDisk() {
        if (!Files.exists(glossaryJsonPath)) {
            return;
        }
        try {
            List<GlossaryEntry> data = objectMapper.readValue(glossaryJsonPath.toFile(), new TypeReference<>() {});
            entries.clear();
            entries.addAll(data);
        } catch (IOException ignored) {
            // 註解：MVP 階段若讀檔失敗先不中斷服務，待後續加入 logger 與告警。
        }
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
        String searchable = buildSearchableText(termZh, termEn, code, exampleZh, exampleEn, aliasesZh, aliasesEn, abbreviations);

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
                searchable,
                Instant.now().toString()
        );
    }

    private static String buildSearchableText(
            String termZh,
            String termEn,
            String code,
            String exampleZh,
            String exampleEn,
            List<String> aliasesZh,
            List<String> aliasesEn,
            List<String> abbreviations
    ) {
        return String.join(" ", List.of(
                termZh == null ? "" : termZh,
                termEn == null ? "" : termEn,
                code == null ? "" : code,
                exampleZh == null ? "" : exampleZh,
                exampleEn == null ? "" : exampleEn,
                String.join(" ", aliasesZh == null ? List.of() : aliasesZh),
                String.join(" ", aliasesEn == null ? List.of() : aliasesEn),
                String.join(" ", abbreviations == null ? List.of() : abbreviations)
        ));
    }

    private String safe(String newValue, String oldValue) {
        return newValue == null ? oldValue : newValue;
    }
}
