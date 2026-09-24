# CLAUDE.md

Guidance for AI coding agents working in this repository.

## Project

Hexagonal Structure Shop ("EvShop") — a Spring Boot e-commerce backend that follows
the Hexagonal Architecture (Ports & Adapters) pattern.

- Language: Java 21
- Build: Gradle (wrapper) — `gradlew` / `gradlew.bat`
- Framework: Spring Boot 3.5.16, Spring Security 6.5.x
- Gradle modules: `core` (package `com.eshop.core` — pure Java, no Spring on the classpath)
  and `app` (package `com.eshop.app` — Spring Boot, adapters, wiring)

## Active skills

Always strictly follow and apply all active skills located in `.claude/skills/`:

- **hexagonal-architecture**: Enforce clean boundary separation between domain core and application/adapter layers.
- **ripgrep**: Utilize fast code searching and discovery across the repository.
- **springboot-patterns**: Follow standard Spring Boot 3 enterprise patterns and clean code practices.
- **springboot-security**: Implement security, authentication, and authorization rules properly.
- **springboot-tdd**: Apply Test-Driven Development (TDD) using JUnit 5 & Mockito.
- **springboot-verification**: Run tests and verification steps to confirm code correctness before finishing tasks.
- **create-github-pr**: PR contents, branch naming (`lesson/<NN>-<kebab-slug>`), push and `gh` commands.

**Precedence when skills disagree.** `springboot-patterns` and `springboot-tdd` are generic
multi-project skills and two of their defaults do **not** hold here:

- `springboot-patterns` teaches a classic controller → service → repository layering. This repo is
  ports-and-adapters. `hexagonal-architecture` and `.claude/commands/implement.md` win.
- `springboot-tdd` advises Mockito and a JaCoCo coverage target. **Mockito is not on `core`'s test
  classpath** and there is no JaCoCo plugin. In `core`, use AssertJ plus hand-written fakes
  (`core/src/test/java/com/eshop/core/test/fake/`). In `app`, Mockito and `@MockitoBean` are correct.

## Active subagents

`.claude/agents/` holds 6 read-mostly specialists. Delegate to them via the Agent tool when a task
would otherwise flood the main conversation with search results or build logs.

- **hexagon-guard** (read-only) — audits hexagonal boundary violations after changes under
  `core/` or `app/adapter/`.
- **ai-adapter-smith** — adds/changes AI features (Spring AI, LangChain4j, chat memory, prompts).
- **core-test-author** — writes `core` tests with hand-written fakes.
- **build-doctor** — triages a failing `./gradlew build`, finds the failing module first.
- **secret-sentinel** (read-only) — audits tracked secrets and credential handling.
- **security-reviewer** (read-only) — audits application code: authorization, injection, CORS.

The three read-only agents have no `Write`/`Edit`, so they cannot alter what they review.

## Coding workflow

Writing source directly, end to end, is the exception — not the default. Every task that changes
code walks this sequence, and **the agents are a gate, not an optional extra**: the task is not
finished until the audits in steps 5–6 have actually been run and reported. "It was a small
change" is not grounds to skip them; a small change under `core/` or `app/adapter/` is exactly
what `hexagon-guard` exists to check.

| # | Step | Who | Fires when |
|---|---|---|---|
| 1 | Survey before writing | `Explore` ×1–3, in parallel | Any task where you cannot name the files to touch up front. Find what to reuse before inventing anything. |
| 2 | Design | `Plan` ×1 | Anything beyond a one-line fix. Get the plan approved, then implement. |
| 3 | Write code | Main agent, or `core-test-author` / `ai-adapter-smith` | Delegate `core` tests to `core-test-author`; delegate Spring AI / LangChain4j work to `ai-adapter-smith`. |
| 4 | Build | `./gradlew build`; failures go to `build-doctor` | Always, before claiming done. |
| 5 | Boundary audit | `hexagon-guard` (read-only) | Any change under `core/` or `app/adapter/`. |
| 6 | Security audit | `security-reviewer`; add `secret-sentinel` before a PR | Any new endpoint, auth path, permission rule, or config change. |
| 7 | Open the PR | `create-github-pr` skill | Branch `lesson/<NN>-<kebab-slug>`. |

Rules that follow from the table:

- **Never debug a red `./gradlew build` by hand.** Hand it to `build-doctor` to isolate the
  failing module first; it reads the logs so the main thread does not have to.
- **Steps 1–2 are for you.** Do not open the editor before the plan is approved — no
  write-then-justify.
- **Load the matching skill before writing the code it governs**, not afterwards as a
  rationalisation: `hexagonal-architecture` for any new domain/application/adapter code,
  `springboot-security` before touching auth, `springboot-tdd` before writing tests,
  `springboot-verification` before declaring the work done.
- **Report the audit results, including "no findings."** A skipped audit is indistinguishable
  from a passed one unless you say which ran.
- Do not delegate a step just to have delegated: the value is in the gate, not the ceremony. If
  you genuinely skip a step, say so and why in the final summary — an undeclared skip is the
  thing this section is here to prevent.

## Slash commands

`.claude/commands/`: `/implement`, `/plan`, `/fix`, `/review`, `/handoff`.

## Hooks

`.claude/settings.json` wires two `PreToolUse` guards (scripts in `.claude/hooks/`):

- **guard-secrets.py** — blocks a `git add`/`git commit` that would introduce a credential file
  (`.env`, `*.pem`, `id_rsa`, …). Deletions are allowed: removing a secret is the fix.
- **guard-core-imports.py** — blocks a write that puts Spring, JPA, servlet, Jackson or jjwt into
  `core/src/`. The forbidden set mirrors ArchUnit rules 1–3 exactly.

Both need `python3` (not `jq`). They fail open: any parse error exits 0 and lets the call proceed.

## Build & test commands

Run from the repo root. On Windows use `.\gradlew.bat`, elsewhere `./gradlew`.

- Build + test: `./gradlew build`
- Run tests only: `./gradlew test`
- Boot the app: `./gradlew bootRun`
- Clean: `./gradlew clean`

No lint/format tool is configured; rely on `./gradlew build` for correctness.

## Architecture conventions

Follow Hexagonal Architecture. Keep the dependency rule: inner layers must not
depend on outer layers (framework, persistence, transport).

- `domain` — pure business model: entities, value objects, domain services, rules.
  No Spring, no JPA annotations.
- `application` — use cases and ports. Port interfaces (inbound use cases, outbound
  repositories/gateways) are defined here. No framework dependencies except where
  unavoidable (e.g. `@Service`, transactions).
- `infrastructure` (adapters) — Spring wiring, REST controllers, persistence
  (JPA/Spring Data), security config, message adapters. Implement application ports here.

Rules:

- Domain and application code must not import `org.springframework` (application may
  use annotations only via configuration in infrastructure; keep ports pure interfaces).
- Adapters implement port interfaces; the domain is wired to adapters via
  dependency injection in the `infrastructure` layer.
- Use records for value objects and DTOs; keep DTOs out of the domain.
- Add `@Configuration`/`@Bean` wiring in `infrastructure`, never in `domain`.

## Conventions

- Match existing style before introducing new patterns.
- No comments unless asked; keep code self-documenting.
- Never commit secrets. Do not log credentials.
- Use the `hexagonal-architecture` skill when generating new domain/application/infrastructure
  code (see `.claude/skills/hexagonal-architecture`).

## Testing

- Two separate test trees: `core/src/test/java/com/eshop/core/` (JUnit 5 + AssertJ, hand-written
  fakes, **no Mockito**) and `app/src/test/java/com/eshop/app/` (`@WebMvcTest` + `MockMvc` +
  `@MockitoBean`; integration extends `app/support/PostgresIntegrationTest.java` with Testcontainers).
- `HexagonalArchitectureTest` (8 ArchUnit rules) is a first-class gate — it must stay green.
- Prefer focused unit tests for domain logic; use mocks for ports.
