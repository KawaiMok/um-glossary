package com.umglossary.backend.repository;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.umglossary.backend.model.GlossaryEntry;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public class GlossaryRepository {
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    public GlossaryRepository(JdbcTemplate jdbcTemplate, ObjectMapper objectMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
    }

    public List<GlossaryEntry> search(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return jdbcTemplate.query("SELECT * FROM glossary_entries ORDER BY term_en ASC", mapper());
        }
        String q = "%" + keyword.trim() + "%";
        // 註解：MVP 先用 ILIKE + concat_ws；資料大時再改 Postgres FTS / trigram。
        return jdbcTemplate.query(
                """
                SELECT *
                FROM glossary_entries
                WHERE concat_ws(' ',
                  term_zh,
                  term_en,
                  coalesce(code, ''),
                  coalesce(example_zh, ''),
                  coalesce(example_en, ''),
                  coalesce(remarks, ''),
                  coalesce(aliases_zh_json, ''),
                  coalesce(aliases_en_json, ''),
                  coalesce(abbreviations_json, '')
                ) ILIKE ?
                ORDER BY term_en ASC
                """,
                mapper(),
                q
        );
    }

    public Optional<GlossaryEntry> findById(String id) {
        List<GlossaryEntry> rows = jdbcTemplate.query(
                "SELECT * FROM glossary_entries WHERE id = ?",
                mapper(),
                id
        );
        return rows.stream().findFirst();
    }

    public GlossaryEntry insert(GlossaryEntry entry) {
        jdbcTemplate.update(
                """
                INSERT INTO glossary_entries
                  (id, source_sheet, source_row, term_zh, term_en, code, example_zh, example_en,
                   aliases_zh_json, aliases_en_json, abbreviations_json, remarks, updated_at)
                VALUES
                  (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                entry.id(),
                entry.sourceSheet(),
                entry.sourceRow(),
                entry.termZh(),
                entry.termEn(),
                entry.code(),
                entry.exampleZh(),
                entry.exampleEn(),
                toJson(entry.aliasesZh()),
                toJson(entry.aliasesEn()),
                toJson(entry.abbreviations()),
                entry.remarks(),
                Timestamp.from(Instant.parse(entry.updatedAt()))
        );
        return entry;
    }

    public void replaceAll(List<GlossaryEntry> entries) {
        jdbcTemplate.update("TRUNCATE TABLE glossary_entries");
        // 註解：MVP 先逐筆寫入；資料量大時再改 batchUpdate。
        for (GlossaryEntry entry : entries) {
            insert(entry);
        }
    }

    public Optional<GlossaryEntry> update(String id, GlossaryEntry payload) {
        GlossaryEntry updated = new GlossaryEntry(
                id,
                payload.sourceSheet(),
                payload.sourceRow(),
                payload.termZh(),
                payload.termEn(),
                payload.code(),
                payload.exampleZh(),
                payload.exampleEn(),
                payload.aliasesZh(),
                payload.aliasesEn(),
                payload.abbreviations(),
                payload.remarks(),
                null,
                Instant.now().toString()
        );
        int affected = jdbcTemplate.update(
                """
                UPDATE glossary_entries
                SET term_zh = ?,
                    term_en = ?,
                    code = ?,
                    example_zh = ?,
                    example_en = ?,
                    aliases_zh_json = ?,
                    aliases_en_json = ?,
                    abbreviations_json = ?,
                    remarks = ?,
                    updated_at = ?
                WHERE id = ?
                """,
                updated.termZh(),
                updated.termEn(),
                updated.code(),
                updated.exampleZh(),
                updated.exampleEn(),
                toJson(updated.aliasesZh()),
                toJson(updated.aliasesEn()),
                toJson(updated.abbreviations()),
                updated.remarks(),
                Timestamp.from(Instant.parse(updated.updatedAt())),
                id
        );
        if (affected <= 0) {
            return Optional.empty();
        }
        return Optional.of(updated);
    }

    private String toJson(Object value) {
        if (value == null) {
            return "[]";
        }
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }

    private RowMapper<GlossaryEntry> mapper() {
        return new RowMapper<>() {
            @Override
            public GlossaryEntry mapRow(ResultSet rs, int rowNum) throws SQLException {
                return new GlossaryEntry(
                        rs.getString("id"),
                        rs.getString("source_sheet"),
                        rs.getInt("source_row"),
                        rs.getString("term_zh"),
                        rs.getString("term_en"),
                        rs.getString("code"),
                        rs.getString("example_zh"),
                        rs.getString("example_en"),
                        parseJsonList(rs.getString("aliases_zh_json")),
                        parseJsonList(rs.getString("aliases_en_json")),
                        parseJsonList(rs.getString("abbreviations_json")),
                        rs.getString("remarks"),
                        null,
                        rs.getTimestamp("updated_at") == null ? Instant.now().toString() : rs.getTimestamp("updated_at").toInstant().toString()
                );
            }
        };
    }

    private List<String> parseJsonList(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<>() {});
        } catch (Exception ignored) {
            return List.of();
        }
    }
}

