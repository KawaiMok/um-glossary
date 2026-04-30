package com.umglossary.backend.controller;

import com.umglossary.backend.model.ImportResult;
import com.umglossary.backend.service.ImportService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/import")
@CrossOrigin(origins = "*")
public class ImportController {

    private final ImportService importService;

    public ImportController(ImportService importService) {
        this.importService = importService;
    }

    @PostMapping("/xlsx")
    public ResponseEntity<?> importXlsx(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "sheets", required = false) List<String> sheets
    ) {
        try {
            ImportResult result = importService.importFromXlsx(file, sheets);
            return ResponseEntity.ok(result);
        } catch (IOException exception) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "message", "匯入失敗",
                    "error", exception.getMessage()
            ));
        }
    }
}
