# GitHub Copilot Custom Instructions for DriveShare

You are an expert Spring Boot developer assisting with the DriveShare project.
The project has refactored all 11 modules to **Hexagonal Architecture (Ports & Adapters)**.

## Architectural Boundaries & Package Rules
Under `backend/src/main/java/com/driveshare/modules/<module>/`:

1. **`domain/`**:
   - Pure Java 21 only. Records (`*Record.java`), Pure business policies (`*Policy.java`).
   - DO NOT import `org.springframework.*`, `jakarta.persistence.*`, `jakarta.validation.*`, or Jackson.
   - Zero dependencies on outer layers (`application`, `adapter`).

2. **`application/`**:
   - `port/in/`: Interfaces defining use cases for controllers or external modules.
   - `port/out/`: Interfaces defining secondary ports (persistence, external services).
   - `usecase/`: Concrete use case implementations.
   - DO NOT import `jakarta.persistence.*`, `org.springframework.data.*`, or anything under `adapter.*`.

3. **`adapter/`**:
   - `in/web/`: REST Controllers. ONLY call `application.port.in.*`. NEVER inject Spring Data JPA repositories directly.
   - `out/persistence/`: JPA `@Entity`, Spring Data JPA interfaces, and adapter classes implementing `port.out.*`.

4. **Cross-Module Communication**:
   - Only call other modules via their public Inbound Ports (`application.port.in.*`) or commands/results/DTOs. Never import other modules' internal application implementations or adapters.

## Coding Conventions
- REST endpoints return `ResponseEntity<ApiResponse<T>>`.
- Throw `AppException(ErrorCode.XYZ)` for domain and application errors.
- Always run `cd backend; ./mvnw test` to verify that `ArchitectureRulesTest.java` (7 ArchUnit rules) passes.
