# Hướng dẫn kiểm thử Claude Code — EvShop

Tài liệu này hướng dẫn **cách kiểm chứng từng thành phần** Claude Code trong repo này hoạt động
đúng, rồi kiểm chứng **cách chúng phối hợp**. Dùng cho giảng dạy và cho sinh viên tự kiểm tra.

Nguyên tắc xuyên suốt: **đừng tin, hãy kiểm chứng.** Một file cấu hình đúng cú pháp vẫn có thể
chưa từng được nạp. Mỗi phần dưới đây đều có bước "chứng minh nó thật sự chạy", không chỉ "kiểm tra
file có tồn tại".

---

## 1. Sáu thành phần — vai trò và ai kích hoạt

| Thành phần | Nằm ở đâu | Ai kích hoạt | Tác dụng chính |
|---|---|---|---|
| **CLAUDE.md** | repo root | Tự động, mọi session | Luật nền của dự án — nạp vào context đầu tiên |
| **Skills** | `.claude/skills/*/SKILL.md` | Claude, khi ngữ cảnh khớp | Kiến thức chuyên môn dùng lại nhiều lần |
| **Slash commands** | `.claude/commands/*.md` | **Bạn**, gõ `/tên` | Quy trình đóng gói sẵn, bạn chủ động gọi |
| **Subagents** | `.claude/agents/*.md` | Claude, hoặc `@agent-tên` | Việc ồn ào chạy trong context riêng |
| **Hooks** | `.claude/settings.json` + `.claude/hooks/` | **Harness**, theo sự kiện | Thực thi tự động, không phụ thuộc model |
| **Settings** | `.claude/settings.json`, `settings.local.json` | Tự động | Quyền, biến môi trường |

**Khác biệt then chốt cần dạy sinh viên:**

- **Skill vs Subagent.** Skill là *kiến thức* được nạp vào — không có context riêng. Subagent là
  *tiến trình* có context riêng, chạy xong chỉ trả về bản báo cáo. Việc ồn ào (đọc 50 file, log
  build 500 dòng) → subagent. Việc cần biết luật để làm đúng → skill.
- **Hook vs mọi thứ còn lại.** Đây là thứ duy nhất **không phụ thuộc vào việc model có "nghe lời"
  hay không**. Skill và CLAUDE.md là chỉ dẫn — model có thể bỏ qua. Hook là mã thực thi — nó chặn
  thật. Đây là điểm dạy quan trọng nhất về ranh giới tin cậy.

---

## 2. Chuẩn bị trước khi kiểm thử

### 2.1 Kiểm tra điều kiện tiên quyết

```bash
# python3 là BẮT BUỘC — hook dùng python3, không dùng jq
python3 --version                 # cần >= 3.x

# JAVA_HOME — nếu sai, mọi lệnh gradle đều chết
cat .claude/settings.local.json
java -version
```

> **Vì sao không dùng `jq`?** Hầu hết ví dụ hook trên mạng dùng `jq` để đọc JSON từ stdin. Máy này
> **không có `jq`**. Đây là bài học tốt cho sinh viên: đừng copy ví dụ mạng mà không kiểm tra môi
> trường đích.

### 2.2 Nạp lại cấu hình — bước hay bị bỏ qua nhất

`.claude/settings.json` và `.claude/settings.local.json` được tạo **trong** session hiện tại. Bộ
theo dõi file chỉ theo dõi thư mục đã có sẵn `settings.json` lúc session khởi động. Vì vậy:

- **Skill và command**: nạp lại nóng, không cần restart.
- **Hook và settings**: có thể cần **mở `/hooks` một lần** hoặc **khởi động lại Claude Code**.

Kiểm tra nhanh xem hook đã nạp chưa → xem mục 3.4 bước "chứng minh hook chạy thật".

---

## 3. Kiểm thử từng thành phần riêng lẻ

### 3.1 CLAUDE.md

**Kiểm tra nội dung có đúng sự thật không** — đây là bài tập tốt, vì CLAUDE.md dễ bị lạc hậu:

```bash
# CLAUDE.md nói có mấy module? Thực tế có mấy?
rg -n 'Gradle modules|com\.eshop' CLAUDE.md
cat settings.gradle
```

**Chứng minh nó thật sự ảnh hưởng tới hành vi:** hỏi Claude một câu mà câu trả lời chỉ có trong
CLAUDE.md:

```
Trong repo này, đặt @Configuration ở module nào?
```

→ Trả lời đúng phải là: chỉ trong `app`, không bao giờ trong `core`.

### 3.2 Skills

Skill không có lệnh gọi trực tiếp. Ba cách kiểm chứng:

**Cách 1 — hỏi trực tiếp.**
```
Liệt kê các skill đang hoạt động trong repo này.
```
→ Phải kể đúng 7: `hexagonal-architecture`, `ripgrep`, `springboot-patterns`,
`springboot-security`, `springboot-tdd`, `springboot-verification`, `create-github-pr`.

**Cách 2 — kiểm chứng hành vi.** Skill `ripgrep` yêu cầu dùng `rg` thay vì `grep`/`find`:
```
Tìm tất cả chỗ dùng class Money trong repo.
```
→ Quan sát: Claude có gọi `rg` không, hay gọi `grep -r`?

**Cách 3 — kiểm tra xung đột (bài tập nâng cao, quan trọng nhất).**

Repo này có **hai skill mâu thuẫn với kiến trúc thật**:

| Skill | Lời khuyên của skill | Thực tế repo này |
|---|---|---|
| `springboot-patterns` | Chia controller → service → repository | Ports & Adapters — **không có tầng service** |
| `springboot-tdd` | Dùng Mockito, mục tiêu JaCoCo 80% | `core` **không có Mockito**, **không có JaCoCo** |

Đây là bài học lớn: **skill là chỉ dẫn chung, không phải luật của repo.** Ai thắng? Thứ tự ưu tiên
đã ghi trong `CLAUDE.md`:

```
CLAUDE.md  >  .claude/commands/implement.md  >  hexagonal-architecture  >  springboot-patterns
```

Kiểm chứng bằng cách hỏi:
```
Viết cho tôi một "ProductService" xử lý nghiệp vụ đặt hàng.
```
→ Claude **tốt** phải từ chối tạo `@Service` và đề xuất use case trong `core` + adapter trong `app`.

### 3.3 Slash commands

Gõ từng lệnh và đối chiếu hành vi. Cả 5 command **không tự chạy** — bạn phải gõ.

| Lệnh | Kiểm chứng kỳ vọng |
|---|---|
| `/plan Thêm tính năng huỷ đơn hàng` | Ra kế hoạch có domain → port → adapter → test. **Không viết code.** Phải nhắc `HexagonalArchitectureTest`. Phải nói test `core` dùng fake, không Mockito. |
| `/implement Thêm endpoint ping` | Tạo file đúng package. Chạy `./gradlew build`. |
| `/fix` | Chạy `./gradlew build` (không `clean`). Nếu có lỗi, sửa. |
| `/review` | Chạy `git diff HEAD` + liệt kê file untracked + `git log main..HEAD`. Chạy ArchUnit. |
| `/handoff` | In ra tóm tắt có nhánh hiện tại và kết quả `./gradlew build`. |

**Bẫy kiểm tra `/review`.** Cố tình tạo một file mới chưa `git add`:
```bash
echo "test" > /tmp/scratch.txt && cp /tmp/scratch.txt ./NEWFILE.md
```
Rồi gõ `/review`. Nếu bản review **không** nhắc tới `NEWFILE.md`, tức là nó đang dùng `git diff`
thuần (chỉ thấy thay đổi chưa stage của file đã track) — đó là lỗi cũ đã sửa. Xoá file sau khi test.

### 3.4 Hooks — phần dễ kiểm thử nhất

Hook là **script độc lập**. Test được mà không cần Claude chạy. Đây là cách dạy tốt nhất vì tách
bạch được "script đúng chưa" khỏi "harness có gọi script không".

**Bước 1 — test script trực tiếp (không qua Claude).**

```bash
cd /mnt/c/Users/binht/IdeaProjects/spring-ai-demo2

# Hook kiến trúc: phải CHẶN
echo '{"tool_input":{"file_path":"core/src/main/java/com/eshop/core/domain/model/Product.java","content":"import org.springframework.stereotype.Component;"}}' \
  | python3 .claude/hooks/guard-core-imports.py

# Hook kiến trúc: phải IM LẶNG
echo '{"tool_input":{"file_path":"core/src/main/java/com/eshop/core/domain/model/Product.java","content":"import java.util.Objects;"}}' \
  | python3 .claude/hooks/guard-core-imports.py
```

Kết quả mong đợi: lệnh đầu in ra JSON có `"permissionDecision": "deny"`. Lệnh thứ hai **không in
gì** và exit code 0.

```bash
# Hook secret: tạo file bait rồi thử stage
printf 'PAT=dummy\n' > .env.bait
git add .env.bait
echo '{"tool_input":{"command":"git commit -m \"x\""}}' | python3 .claude/hooks/guard-secrets.py
git rm --cached -q .env.bait && rm -f .env.bait      # DỌN DẸP, đừng bỏ qua
```

**Bước 2 — test các bẫy báo nhầm (false positive).** Đây là phần sinh viên hay bỏ qua nhưng quan
trọng nhất — một hook báo nhầm sẽ bị tắt, và rồi nó vô dụng:

```bash
t() { out=$(printf '{"tool_input":{"command":%s}}' "$(python3 -c 'import json,sys;print(json.dumps(sys.argv[1]))' "$1")" | python3 .claude/hooks/guard-secrets.py); [ -z "$out" ] && echo "ALLOW  $1" || echo "DENY   $1"; }

t 'git commit -m "docs: explain .env setup"'   # phải ALLOW — chữ ".env" nằm trong commit message
t 'git commit --amend'                          # phải ALLOW — --amend không phải cờ -a
t 'git add .env.example'                        # phải ALLOW — file mẫu, không có secret
t 'git add -A'                                  # phải DENY nếu có .env đang sửa
```

**Bước 3 — chứng minh hook chạy thật (khác hoàn toàn bước 1).**

Script đúng **không** có nghĩa harness gọi nó. Cách chứng minh:

```
Nhờ Claude sửa file core/src/main/java/com/eshop/core/domain/vo/Money.java,
thêm dòng: import org.springframework.stereotype.Component;
```

- Nếu hook đã nạp → thao tác bị **chặn**, Claude báo lý do.
- Nếu file được sửa thật → hook **chưa nạp**. Mở `/hooks` một lần hoặc restart, rồi thử lại.
  **Nhớ hoàn tác file sau khi test.**

### 3.5 Subagents

**Bước 1 — xác nhận đã nạp.**
```
Liệt kê các subagent hiện có và mô tả của chúng.
```
→ Phải đủ 6: `hexagon-guard`, `ai-adapter-smith`, `core-test-author`, `build-doctor`,
`secret-sentinel`, `security-reviewer`.

**Bước 2 — gọi tường minh từng agent với đầu vào có kiểm soát.** Dùng `@agent-tên` để **đảm bảo**
đúng agent đó chạy (gọi bằng ngôn ngữ tự nhiên thì Claude tự quyết, có thể chọn sai).

| Agent | Câu lệnh test | Kết quả mong đợi |
|---|---|---|
| `hexagon-guard` | `@agent-hexagon-guard audit the working tree` | Chạy ArchUnit, trả bảng `file:line \| rule \| why \| fix`. Không sửa file nào. |
| `secret-sentinel` | `@agent-secret-sentinel audit tracked secrets` | **Phải** xác nhận `core/.env` không còn bị track. **Tuyệt đối không được in giá trị credential.** |
| `security-reviewer` | `@agent-security-reviewer review the auth code` | **Phải** tìm ra `/api/v1/suggest` là `permitAll` và CORS `addAllowedOrigin("*")`. |
| `core-test-author` | `@agent-core-test-author viết test cho Money.multiply` | Dùng AssertJ + fake tự viết. **Không được** dùng Mockito. Chạy `./gradlew :core:test`. |
| `build-doctor` | Cố tình tạo lỗi biên dịch, rồi gọi agent | Phải chỉ ra module nào lỗi **trước khi** sửa. |

**Bước 3 — kiểm chứng quyền hạn (bài học về least privilege).** Ba agent `hexagon-guard`,
`secret-sentinel`, `security-reviewer` **không có** `Write`/`Edit`:

```
@agent-hexagon-guard hãy sửa luôn các vi phạm bạn tìm thấy
```

→ Phải từ chối vì không có công cụ, chứ không phải vì "được dặn là không nên". Đây là khác biệt
giữa **ràng buộc kỹ thuật** và **lời dặn**.

**Bước 4 — kiểm chứng cách ly context.** Yêu cầu một việc ồn ào và để ý context:

```
@agent-secret-sentinel quét toàn bộ repo tìm credential, liệt kê mọi file đã đọc
```

→ Bản báo cáo quay về hội thoại chính phải **ngắn**, dù agent đã đọc rất nhiều file. Đó chính là
giá trị của subagent.

### 3.6 Settings

```bash
# Cú pháp JSON hợp lệ? (JSON hỏng sẽ VÔ HIỆU TOÀN BỘ settings của file đó, im lặng)
python3 -c "import json;json.load(open('.claude/settings.json'));print('ok')"
python3 -c "import json;json.load(open('.claude/settings.local.json'));print('ok')"

# Xem luật quyền
python3 -m json.tool .claude/settings.json | head -40
```

**Kiểm chứng quyền có hiệu lực thật:**

- `Bash(git status*)` nằm trong `allow` → nhờ Claude chạy `git status`, **không** được hỏi quyền.
- `Bash(git push*)` nằm trong `ask` → phải **hỏi** trước khi đẩy.
- `Read(./.env)` nằm trong `deny` → nhờ Claude đọc `.env` → phải bị từ chối.

> **Bài học:** `.env` giờ không còn trong repo, nhưng luật `deny` vẫn giữ để phòng khi ai đó lấy
> `.env.example` ra tạo `.env` thật. Phòng thủ theo lớp, không phải một lớp.

---

## 4. Kiểm thử phối hợp — một quy trình hoàn chỉnh

Đây là phần quan trọng nhất: các thành phần không chạy độc lập, chúng **bổ trợ nhau**. Chạy hết
quy trình này để thấy bức tranh tổng thể.

### Kịch bản: thêm endpoint "huỷ đơn hàng"

**Bước 1 — Lập kế hoạch (skill + command)**
```
/plan Thêm tính năng huỷ đơn hàng cho user
```
→ `implement.md` + skill `hexagonal-architecture` chi phối. Kế hoạch phải có: domain → port →
adapter → test. Chưa có code nào được viết.

**Bước 2 — Thực thi (subagent + CLAUDE.md)**
```
@agent-ai-adapter-smith implement kế hoạch trên
```
→ Agent đọc kế hoạch, viết `core` trước. Nếu nó định tạo `@Service`, bạn biết `CLAUDE.md` chưa
được nạp đúng.

**Bước 3 — Hook can thiệp (tự động, không cần gọi)**
Trong lúc code, thử yêu cầu:
```
Thêm annotation @Component vào CancelOrderUseCaseImpl trong core
```
→ **Hook `guard-core-imports` phải chặn ngay.** Không có subagent nào liên quan — đây là harness
thực thi, đáng tin hơn mọi lời dặn. So sánh: nếu bạn chỉ *dặn* Claude trong CLAUDE.md là "đừng
làm thế", nó **có thể** vẫn làm. Hook thì không.

**Bước 4 — Viết test (subagent)**
```
@agent-core-test-author viết test cho CancelOrderUseCase
```
→ AssertJ + fake tự viết. Nếu thấy `Mockito.mock` xuất hiện, agent này sai (Mockito không có
trong `core`).

**Bước 5 — Kiểm tra kiến trúc (subagent + ArchUnit)**
```
@agent-hexagon-guard audit the working tree
```
→ Chạy `HexagonalArchitectureTest`, trả bảng phát hiện. **Không sửa gì** — nó chỉ báo cáo.

**Bước 6 — Sửa và kiểm chứng (command)**
```
/fix
```
→ Chạy build, sửa lỗi, có guardrail không được phá ArchUnit hay xoá test để "xanh".

**Bước 7 — Review trước khi commit (command + skill)**
```
/review
```
→ Skill `create-github-pr` chi phối. Phải quét cả file untracked, không chỉ `git diff`.

**Bước 8 — Commit (hook can thiệp lần hai)**
```
git commit -m "feat: add cancel order endpoint"
```
→ Nếu vô tình có `.env` trong vùng stage, **hook `guard-secrets` chặn**. Nếu sạch, `Bash(git commit*)`
nằm trong `ask` nên vẫn hỏi bạn trước.

**Bước 9 — Bàn giao (command)**
```
/handoff
```
→ Tóm tắt có nhánh, kết quả build, việc còn lại.

### Bảng: thành phần nào chi phối bước nào

| Bước | Command | Skill | Subagent | Hook |
|---|---|---|---|---|
| 1 Lập kế hoạch | `/plan` | hexagonal-architecture | — | — |
| 2 Thực thi | — | hexagonal, springboot-patterns | ai-adapter-smith | — |
| 3 Chặn import | — | — | — | **guard-core-imports** |
| 4 Viết test | — | springboot-tdd | core-test-author | — |
| 5 Kiểm tra | — | — | hexagon-guard | — |
| 6 Sửa | `/fix` | springboot-verification | (build-doctor) | — |
| 7 Review | `/review` | create-github-pr | security-reviewer | — |
| 8 Commit | — | — | — | **guard-secrets** |
| 9 Bàn giao | `/handoff` | — | — | — |

---

## 5. Checklist tổng

### Kiểm tra tĩnh (không cần Claude)
- [ ] `python3 --version` chạy được
- [ ] `.claude/settings.local.json` có `JAVA_HOME` đúng, và `java -version` chạy được
- [ ] `settings.json` + `settings.local.json` đều là JSON hợp lệ
- [ ] 7 skills, 5 commands, 6 agents, 2 hook scripts tồn tại
- [ ] `git check-ignore .claude/settings.local.json` → bị ignore
- [ ] `git ls-files | grep -c '\.env$'` → **0** (không còn secret nào bị track)
- [ ] Cả 2 hook script chạy đúng ở bước 3.4 bước 1 và 2

### Kiểm tra động (cần Claude Code)
- [ ] Hỏi "liệt kê skill" → đủ 7
- [ ] Hỏi "liệt kê subagent" → đủ 6
- [ ] `/plan` → ra kế hoạch, không viết code
- [ ] `/review` → **có** nhắc file untracked
- [ ] Hook chặn được import Spring vào `core` (bước 3.4 bước 3)
- [ ] `hexagon-guard` từ chối sửa file khi được nhờ
- [ ] `secret-sentinel` không in giá trị token

---

## 6. Xử lý sự cố

| Triệu chứng | Nguyên nhân thường gặp | Cách xử lý |
|---|---|---|
| Hook không chặn dù script đúng | `settings.json` chưa được nạp | Mở `/hooks` một lần, hoặc restart Claude Code |
| `ERROR: JAVA_HOME is set to an invalid directory` | Biến môi trường trỏ vào đường dẫn Windows không tới được từ WSL | Sửa `JAVA_HOME` trong `.claude/settings.local.json` |
| Subagent không tự chạy | `description` quá chung chung | Gọi tường minh bằng `@agent-tên` |
| Agent dùng Mockito trong `core` | `springboot-tdd` chi phối mà không có luật repo ghi đè | Kiểm tra `CLAUDE.md` còn mục "Precedence when skills disagree" không |
| JSON hỏng, settings im lặng không hoạt động | Thiếu/thừa dấu phẩy | `python3 -c "import json;json.load(open('.claude/settings.json'))"` |
| `secret-sentinel` báo nhầm file thường | Regex quá rộng | Kiểm tra regex trong `guard-secrets.py`, phải neo `credentials\.json$`, không phải `credentials` |

---

## 7. Ba bài học nên nhấn với sinh viên

1. **Cấu hình đúng ≠ đã được nạp.** File hợp lệ vẫn có thể chưa từng chạy. Luôn có bước chứng minh.

2. **Hook mạnh hơn lời dặn.** CLAUDE.md và skill là *chỉ dẫn* — model có thể bỏ qua. Hook là *mã
   thực thi* — nó chặn thật. Khi một luật là bắt buộc, hãy viết hook, đừng viết dòng chữ.

3. **Kiểm tra báo nhầm quan trọng ngang kiểm tra bắt đúng.** Một hook chặn nhầm sẽ bị gỡ bỏ, và
   khi đó nó bảo vệ được 0 thứ. Ví dụ thật trong repo: bản regex đầu tiên dùng từ khoá
   `credentials` và báo nhầm vào class `InvalidCredentialsException.java` — một class domain hợp
   lệ. Phải neo thành `credentials\.json$` mới đúng.

---

## Phụ lục — Trạng thái kiểm chứng

| Thành phần | Đã kiểm chứng | Ghi chú |
|---|---|---|
| Hook scripts (logic) | ✅ 14/14 case | Test trực tiếp, gồm cả bẫy báo nhầm |
| Hook (harness gọi thật) | ❌ **chưa** | `settings.json` tạo giữa session — cần `/hooks` hoặc restart |
| Skills | ⚠️ một phần | Đã xác nhận tồn tại + xung đột; chưa test hành vi từng skill |
| Slash commands | ✅ | Đã sửa lỗi và xác nhận nạp lại |
| Subagents | ⚠️ một phần | Frontmatter hợp lệ, đã nạp; chưa chạy từng agent |
| `HexagonalArchitectureTest` | ✅ | `BUILD SUCCESSFUL` |
| `./gradlew build` toàn phần | ❌ **chưa** | Chưa chạy sau khi sửa |

> Cập nhật bảng này sau mỗi lần kiểm thử. Một tài liệu nói "đã kiểm chứng" trong khi thực tế chưa
> là tài liệu tệ hơn không có tài liệu.
