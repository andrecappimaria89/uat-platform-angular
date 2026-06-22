package com.uatplataform.api.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.util.HashMap;
import java.util.Map;

/**
 * Endpoint de diagnóstico — confirma em tempo real que a API está
 * conectada ao Supabase corretamente.
 *
 * Acesse GET /api/health/database após o deploy para validar a conexão.
 * Resposta esperada com sucesso:
 *   { "connected": true, "database": "PostgreSQL", "url": "...supabase.com..." }
 */
@RestController
@RequiredArgsConstructor
public class HealthController {

    private final DataSource dataSource;

    @GetMapping("/api/health/database")
    public ResponseEntity<Map<String, Object>> checkDatabaseConnection() {
        Map<String, Object> result = new HashMap<>();
        try (Connection conn = dataSource.getConnection()) {
            DatabaseMetaData meta = conn.getMetaData();
            result.put("connected", true);
            result.put("database", meta.getDatabaseProductName());
            result.put("version", meta.getDatabaseProductVersion());
            result.put("url", maskPassword(meta.getURL()));
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            result.put("connected", false);
            result.put("error", e.getMessage());
            return ResponseEntity.status(503).body(result);
        }
    }

    private String maskPassword(String url) {
        if (url == null) return null;
        return url.replaceAll("password=[^&;]*", "password=***");
    }
}
