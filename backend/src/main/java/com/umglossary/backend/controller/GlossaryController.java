package com.umglossary.backend.controller;

import com.umglossary.backend.model.GlossaryEntry;
import com.umglossary.backend.service.GlossaryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class GlossaryController {

    private final GlossaryService glossaryService;

    public GlossaryController(GlossaryService glossaryService) {
        this.glossaryService = glossaryService;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok");
    }

    @GetMapping("/entries")
    public List<GlossaryEntry> entries(@RequestParam(required = false) String q) {
        return glossaryService.search(q);
    }

    @GetMapping("/entries/{id}")
    public ResponseEntity<GlossaryEntry> entryDetail(@PathVariable String id) {
        return glossaryService.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/entries/{id}")
    public ResponseEntity<GlossaryEntry> updateEntry(@PathVariable String id, @RequestBody GlossaryEntry payload) {
        try {
            return glossaryService.updateEntry(id, payload)
                    .map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.notFound().build());
        } catch (Exception exception) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
