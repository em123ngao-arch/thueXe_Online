# CLAUDE.md

Guidance for AI coding agents working in this repository.

## Project
DriveShare — A car-sharing platform built with Spring Boot 3.3.4, Java 21, and PostgreSQL 16.
All 11 modules follow **Hexagonal Architecture (Ports & Adapters)**.

- Build Tool: Maven (`./mvnw` or `.\mvnw.cmd`)
- Architecture: Hexagonal (Ports & Adapters) across 11 modules under `backend/src/main/java/com/driveshare/modules/`

## Hexagonal Package Structure
For any module `<module_name>`:
- `domain/`: Pure Java immutable models (`*Record.java`) and business policies (`*Policy.java`).
  - NO Spring, JPA, Hibernate, Jackson, or Validation imports.
- `application/`:
  - `port/in/`: Inbound Ports (Use Case interfaces called by web/other modules).
  - `port/out/`: Outbound Ports (Secondary interfaces for persistence, external APIs).
  - `usecase/`: Concrete implementations of Inbound Ports.
  - `command/`, `result/`: DTOs for use cases.
  - NO JPA, Hibernate, or Spring Data imports.
- `adapter/`:
  - `in/web/`: REST Controllers. ONLY call Inbound Ports (`application.port.in`). NEVER inject persistence repositories.
  - `out/persistence/`: JPA Entities, Spring Data Repositories, and Mappers.

## Verification
Always run test verification before finishing work:
```bash
cd backend && ./mvnw test
```
All 7 ArchUnit rules in `ArchitectureRulesTest.java` must pass.
