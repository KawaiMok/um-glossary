package com.umglossary.backend.service;

import com.umglossary.backend.model.GlossaryEntry;
import com.umglossary.backend.model.ImportEntriesRequest;
import com.umglossary.backend.model.ImportResult;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ImportService {

    private final GlossaryService glossaryService;
    private final Path glossaryJsonPath;
    private final Path backupDir;
    private final String targetSheet;

    public ImportService(
            GlossaryService glossaryService,
            @Value("${app.data.glossary-json-path}") String glossaryJsonPath,
            @Value("${app.data.backup-dir}") String backupDir,
            @Value("${app.data.target-sheet}") String targetSheet
    ) {
        this.glossaryService = glossaryService;
        this.glossaryJsonPath = Path.of(glossaryJsonPath);
        this.backupDir = Path.of(backupDir);
        this.targetSheet = targetSheet;
    }

    public ImportResult importFromXlsx(MultipartFile file, List<String> selectedSheets) throws IOException {
        if (file.isEmpty()) {
            return new ImportResult(0, 1, null, List.of("上傳檔案為空"));
        }

        List<GlossaryEntry> importedEntries = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        try (Workbook workbook = new XSSFWorkbook(new ByteArrayInputStream(file.getBytes()))) {
            List<String> sheetsToImport;
            if (selectedSheets == null || selectedSheets.isEmpty()) {
                sheetsToImport = List.of(targetSheet);
            } else {
                sheetsToImport = selectedSheets.stream()
                        .map(String::trim)
                        .filter(name -> !name.isBlank())
                        .distinct()
                        .toList();
            }

            if (sheetsToImport.isEmpty()) {
                return new ImportResult(0, 1, null, List.of("未提供可匯入的工作表"));
            }

            for (String sheetName : sheetsToImport) {
                Sheet sheet = workbook.getSheet(sheetName);
                if (sheet == null) {
                    errors.add("找不到工作表: " + sheetName);
                    continue;
                }
                importSheet(sheet, importedEntries, errors);
            }            
        }

        if (importedEntries.isEmpty()) {
            return new ImportResult(0, errors.size(), null, errors.isEmpty() ? List.of("沒有可匯入的資料") : errors);
        }

        String backupFileName = backupCurrentJsonIfExists();
        glossaryService.saveToDisk(importedEntries);
        glossaryService.replaceAll(importedEntries);

        return new ImportResult(importedEntries.size(), errors.size(), backupFileName, errors);
    }

    // 註解：方案 C - 前端先解析成 JSON；後端只做驗證、正規化與寫入。
    public ImportResult importFromEntries(ImportEntriesRequest request) throws IOException {
        if (request == null || request.sheets() == null || request.sheets().isEmpty()) {
            return new ImportResult(0, 1, null, List.of("未提供可匯入的工作表"));
        }

        List<GlossaryEntry> importedEntries = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        for (ImportEntriesRequest.ImportSheetPayload sheet : request.sheets()) {
            if (sheet == null || sheet.name() == null || sheet.name().isBlank()) {
                errors.add("工作表名稱為空");
                continue;
            }
            if (sheet.rows() == null || sheet.rows().isEmpty()) {
                continue;
            }
            importRows(sheet.name().trim(), sheet.rows(), importedEntries, errors);
        }

        if (importedEntries.isEmpty()) {
            return new ImportResult(0, errors.size(), null, errors.isEmpty() ? List.of("沒有可匯入的資料") : errors);
        }

        String backupFileName = backupCurrentJsonIfExists();
        glossaryService.saveToDisk(importedEntries);
        glossaryService.replaceAll(importedEntries);

        return new ImportResult(importedEntries.size(), errors.size(), backupFileName, errors);
    }

    private void importRows(
            String sheetName,
            List<ImportEntriesRequest.ImportRowPayload> rows,
            List<GlossaryEntry> importedEntries,
            List<String> errors
    ) {
        for (ImportEntriesRequest.ImportRowPayload row : rows) {
            if (row == null) {
                continue;
            }

            String cnRaw = safeTrim(row.cn());
            String enRaw = safeTrim(row.en());
            String abbrevRaw = safeTrim(row.abbrev());
            String codeRaw = safeTrim(row.code());
            String remarksRaw = safeTrim(row.remarks());
            String exampleZhRaw = safeTrim(row.exampleZh());
            String exampleEnRaw = safeTrim(row.exampleEn());

            String finalExampleZh = !exampleZhRaw.isBlank() ? exampleZhRaw : "";
            String finalExampleEn = !exampleEnRaw.isBlank() ? exampleEnRaw : "";

            // 註解：略過完全空白列（前端理論上已濾掉，但後端仍做保護）。
            if (cnRaw.isBlank() && enRaw.isBlank() && abbrevRaw.isBlank() && remarksRaw.isBlank()
                    && finalExampleZh.isBlank() && finalExampleEn.isBlank() && codeRaw.isBlank()) {
                continue;
            }

            if (cnRaw.isBlank() || enRaw.isBlank()) {
                errors.add(buildRowError(
                        sheetName,
                        row.rowNumber(),
                        "缺少 <CN> 或 <EN>",
                        cnRaw,
                        enRaw
                ));
                continue;
            }

            List<String> zhParts = splitAndClean(cnRaw, "[/／]");
            List<String> enParts = splitAndClean(enRaw, "[\\n;；]");
            List<String> abbrevParts = splitAndClean(abbrevRaw, "[,;；\\n]");
            if (zhParts.isEmpty() || enParts.isEmpty()) {
                errors.add(buildRowError(
                        sheetName,
                        row.rowNumber(),
                        "解析後無有效中英內容",
                        cnRaw,
                        enRaw
                ));
                continue;
            }

            String termZh = zhParts.get(0);
            String termEn = enParts.get(0);
            List<String> aliasesZh = zhParts.size() > 1 ? zhParts.subList(1, zhParts.size()) : List.of();
            List<String> aliasesEn = enParts.size() > 1 ? enParts.subList(1, enParts.size()) : List.of();

            importedEntries.add(GlossaryService.createEntry(
                    sheetName,
                    row.rowNumber(),
                    termZh,
                    termEn,
                    codeRaw,
                    finalExampleZh,
                    finalExampleEn,
                    aliasesZh,
                    aliasesEn,
                    abbrevParts,
                    remarksRaw
            ));
        }
    }

    private String safeTrim(String value) {
        return value == null ? "" : value.trim();
    }

    private void importSheet(Sheet sheet, List<GlossaryEntry> importedEntries, List<String> errors) {
        DataFormatter formatter = new DataFormatter();
        Row headerRow = sheet.getRow(0);
        if (headerRow == null) {
            errors.add("工作表 " + sheet.getSheetName() + " 缺少表頭");
            return;
        }

        Map<String, Integer> headerMap = resolveHeaderMap(headerRow, formatter);
        if (!headerMap.keySet().containsAll(List.of("<cn>", "<en>"))) {
            errors.add("工作表 " + sheet.getSheetName() + " 缺少必要欄位 <CN> 或 <EN>");
            return;
        }

        int cnCol = headerMap.get("<cn>");
        int enCol = headerMap.get("<en>");
        Integer abbrevCol = getOptionalHeader(headerMap, "abbrev.", "abbrev");
        Integer codeCol = getOptionalHeader(headerMap, "code");
        Integer remarksCol = getOptionalHeader(headerMap, "*remarks*", "remarks", "remark");
        Integer exampleCol = getOptionalHeader(headerMap, "example", "examples");
        Integer exampleZhCol = getOptionalHeader(headerMap, "example zh", "example_zh");
        Integer exampleEnCol = getOptionalHeader(headerMap, "example en", "example_en");

        for (int rowIndex = 1; rowIndex <= sheet.getLastRowNum(); rowIndex++) {
            Row row = sheet.getRow(rowIndex);
            if (row == null) {
                continue;
            }

            String cnRaw = readCell(row.getCell(cnCol), formatter);
            String enRaw = readCell(row.getCell(enCol), formatter);
            String abbrevRaw = readOptionalCell(row, formatter, abbrevCol);
            String codeRaw = readOptionalCell(row, formatter, codeCol);
            String remarksRaw = readOptionalCell(row, formatter, remarksCol);
            String exampleRaw = readOptionalCell(row, formatter, exampleCol);
            String exampleZhRaw = readOptionalCell(row, formatter, exampleZhCol);
            String exampleEnRaw = readOptionalCell(row, formatter, exampleEnCol);
            String finalExampleZh = !exampleZhRaw.isBlank() ? exampleZhRaw : "";
            String finalExampleEn = !exampleEnRaw.isBlank() ? exampleEnRaw : exampleRaw;

            // 註解：略過完全空白列，避免把 Excel 尾端空列當成資料。
            if (cnRaw.isBlank() && enRaw.isBlank() && abbrevRaw.isBlank() && remarksRaw.isBlank()
                    && finalExampleZh.isBlank() && finalExampleEn.isBlank()) {
                continue;
            }

            if (cnRaw.isBlank() || enRaw.isBlank()) {
                errors.add(buildRowError(
                        sheet.getSheetName(),
                        rowIndex + 1,
                        "缺少 <CN> 或 <EN>",
                        cnRaw,
                        enRaw
                ));
                continue;
            }

            List<String> zhParts = splitAndClean(cnRaw, "[/／]");
            List<String> enParts = splitAndClean(enRaw, "[\\n;；]");
            List<String> abbrevParts = splitAndClean(abbrevRaw, "[,;；\\n]");
            if (zhParts.isEmpty() || enParts.isEmpty()) {
                errors.add(buildRowError(
                        sheet.getSheetName(),
                        rowIndex + 1,
                        "解析後無有效中英內容",
                        cnRaw,
                        enRaw
                ));
                continue;
            }

            String termZh = zhParts.get(0);
            String termEn = enParts.get(0);
            List<String> aliasesZh = zhParts.size() > 1 ? zhParts.subList(1, zhParts.size()) : List.of();
            List<String> aliasesEn = enParts.size() > 1 ? enParts.subList(1, enParts.size()) : List.of();

            importedEntries.add(GlossaryService.createEntry(
                    sheet.getSheetName(),
                    rowIndex + 1,
                    termZh,
                    termEn,
                    codeRaw,
                    finalExampleZh,
                    finalExampleEn,
                    aliasesZh,
                    aliasesEn,
                    abbrevParts,
                    remarksRaw
            ));
        }
    }

    private String backupCurrentJsonIfExists() throws IOException {
        if (!Files.exists(glossaryJsonPath)) {
            return null;
        }

        Files.createDirectories(backupDir);
        String fileName = "glossary-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss")) + ".json";
        Path backupPath = backupDir.resolve(fileName);
        Files.copy(glossaryJsonPath, backupPath, StandardCopyOption.REPLACE_EXISTING);
        return fileName;
    }

    private Map<String, Integer> resolveHeaderMap(Row headerRow, DataFormatter formatter) {
        Map<String, Integer> headerMap = new HashMap<>();
        for (Cell cell : headerRow) {
            String label = formatter.formatCellValue(cell).trim().toLowerCase();
            if (!label.isBlank()) {
                headerMap.put(label, cell.getColumnIndex());
            }
        }
        return headerMap;
    }

    private String readCell(Cell cell, DataFormatter formatter) {
        if (cell == null) {
            return "";
        }
        return formatter.formatCellValue(cell).trim();
    }

    private String readOptionalCell(Row row, DataFormatter formatter, Integer colIndex) {
        if (colIndex == null) {
            return "";
        }
        return readCell(row.getCell(colIndex), formatter);
    }

    private Integer getOptionalHeader(Map<String, Integer> headerMap, String... keys) {
        for (String key : keys) {
            Integer value = headerMap.get(key);
            if (value != null) {
                return value;
            }
        }
        return null;
    }

    private List<String> splitAndClean(String input, String regex) {
        if (input == null || input.isBlank()) {
            return List.of();
        }
        return Arrays.stream(input.split(regex))
                .map(String::trim)
                .filter(part -> !part.isBlank())
                .toList();
    }

    private String buildRowError(String sheetName, int rowNumber, String reason, String cnRaw, String enRaw) {
        return String.format(
                "sheet=%s, row=%d, reason=%s, cn=\"%s\", en=\"%s\"",
                sheetName,
                rowNumber,
                reason,
                sanitizeForMessage(cnRaw),
                sanitizeForMessage(enRaw)
        );
    }

    private String sanitizeForMessage(String value) {
        if (value == null || value.isBlank()) {
            return "-";
        }
        return value.replace("\n", "\\n");
    }
}
