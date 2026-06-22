package com.uatplataform.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * UATPlataform API
 *
 * Backend agnóstico de banco de dados — conecta hoje no Supabase
 * (PostgreSQL) e está pronto para migrar para SQL Server trocando
 * apenas a camada de adaptador (Repository Pattern), sem alterar
 * Controllers, Services, DTOs ou o frontend Angular.
 */
@SpringBootApplication
public class UatPlatformApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(UatPlatformApiApplication.class, args);
    }
}
