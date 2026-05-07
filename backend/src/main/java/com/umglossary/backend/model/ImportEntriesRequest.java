package com.umglossary.backend.model;

import java.util.List;

// 註解：方案 C - 前端解析 xlsx 後，以 JSON 傳給後端，後端不再讀取 xlsx。
public record ImportEntriesRequest(
        List<ImportSheetPayload> sheets
) {
    public record ImportSheetPayload(
            String name,
            List<ImportRowPayload> rows
    ) {}

    public record ImportRowPayload(
            int rowNumber,
            String cn,
            String en,
            String abbrev,
            String code,
            String remarks,
            String exampleZh,
            String exampleEn
    ) {}
}

