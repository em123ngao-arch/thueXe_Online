import csv

headers = [
    'Issue Type', 'Issue key', 'Issue id', 'Parent id', 'Summary', 'Description',
    'Assignee', 'Priority', 'Labels', 'Component/s', 'Custom field (Sprint)'
]

def make_desc(target, steps, expected):
    return (
        f"*🎯 Mục tiêu & Kịch bản kiểm thử:*\n{target}\n\n"
        f"*📋 Các bước thực hiện:*\n{steps}\n\n"
        f"*✅ Kết quả mong đợi (Acceptance Criteria):*\n{expected}\n\n"
        "--------------------------------------------------\n"
        "*📝 Kết quả thực tế (QA ghi nhận):*\n"
        "[ ] Passed    [ ] Failed\n"
        "- Người test: ...\n"
        "- Ngày test: ...\n"
        "- Ghi chú: ...\n\n"
        "*📸 Ảnh bằng chứng nghiệm thu (Bắt buộc đính kèm 3 ảnh vào issue này):*\n"
        "1. [Ảnh UI] Giao diện người dùng thể hiện rõ trạng thái hoặc thông báo.\n"
        "2. [Ảnh DevTools] Network tab (Request URL, HTTP Method, Status Code, Payload).\n"
        "3. [Ảnh Database] Kết quả truy vấn bảng dữ liệu trên Adminer (cổng 8088).\n\n"
        "*🐛 Bug liên quan (Nếu Failed):*\n"
        "- Mã Bug Jira (nếu có): N/A\n"
    )

rows = [
    # EPIC
    ['Epic', 'DS-EPIC-TEST', '10000', '', 'Chiến dịch Kiểm thử Toàn diện Nền tảng Thuê xe DriveShare (Đợt 1 & Đợt 2)',
     'Chiến dịch kiểm thử toàn diện nền tảng thuê xe DriveShare: Đợt 1 (Luồng chính E2E, Đối soát dòng tiền, Bàn giao 2 chiều, Concurrency, Auth, eKYC, Lọc xe, AI) và Đợt 2 (Xử phạt OVERDUE, Blacklist BLOCKED, Hồ sơ Dossier, Tranh chấp DISPUTED, Phạt chủ xe). Đảm bảo 100% chuẩn mã nguồn Enum và không vi phạm 7 luật ArchUnit.',
     'NB', 'Highest', 'testing,qa,sprint-final', 'Core', 'Sprint 2'],

    # TASK 1: AUTH & eKYC & RBAC
    ['Task', 'DS-TASK-AUTH', '10010', '10000', 'Kiểm thử Xác thực, Hồ sơ eKYC & Phân quyền RBAC',
     'Kiểm thử đăng ký tài khoản, xác thực OTP cooldown, tải hồ sơ CCCD, khóa trường sau duyệt, và kiểm soát truy cập RBAC.',
     'QD', 'Highest', 'auth,ekyc,rbac,dot-1', 'User,Auth', 'Sprint 2'],
    
    ['Sub-task', 'DS-SUB-AUTH-01', '10011', '10010', 'TC-AUTH-01: Đăng ký tài khoản Khách thuê (ROLE_RENTER) hợp lệ',
     make_desc('Kiểm tra luồng đăng ký tài khoản khách thuê mới thành công.',
               '1. Gửi POST /api/v1/auth/register với email chưa tồn tại, mật khẩu mạnh, role ROLE_RENTER.\n2. Kiểm tra phản hồi HTTP và kiểm tra bản ghi trong bảng users.',
               'HTTP 201 Created hoặc 200 OK. Bản ghi user được tạo với status=ACTIVE, role=ROLE_RENTER.'),
     'CN', 'High', 'auth,registration,dot-1', 'Auth', 'Sprint 2'],

    ['Sub-task', 'DS-SUB-AUTH-02', '10012', '10010', 'TC-AUTH-02: Đăng ký với Email đã tồn tại (Chặn trùng lặp)',
     make_desc('Xác minh hệ thống chặn đăng ký khi email đã tồn tại trong CSDL.',
               '1. Gửi POST /api/v1/auth/register với email đã có sẵn trong bảng users.\n2. Quan sát mã lỗi phản hồi.',
               'HTTP 400 Bad Request kèm ErrorCode DUPLICATE_EMAIL. Không sinh bản ghi trùng lặp trong DB.'),
     'CN', 'Medium', 'auth,validation,dot-1', 'Auth', 'Sprint 2'],

    ['Sub-task', 'DS-SUB-AUTH-03', '10013', '10010', 'TC-AUTH-03: Gửi mã OTP xác thực & Kiểm soát Cooldown 30s',
     make_desc('Kiểm tra cơ chế chống spam mã OTP qua email với thời gian chờ 30 giây.',
               '1. Gửi POST /api/v1/auth/otp/send lần 1 -> Nhận OTP thành công.\n2. Ngay lập tức gửi tiếp lần 2 trong vòng 30 giây.',
               'Lần 1 thành công (TTL=300s, masked format 123***). Lần 2 bị từ chối với HTTP 400 Bad Request và mã lỗi OTP_COOLDOWN.'),
     'CN', 'Medium', 'auth,otp,cooldown,dot-1', 'Auth', 'Sprint 2'],

    ['Sub-task', 'DS-SUB-USER-01', '10014', '10010', 'TC-USER-01: Tải ảnh CCCD 2 mặt & Giới hạn dung lượng eKYC',
     make_desc('Kiểm tra tính năng tải ảnh CCCD 2 mặt định danh người dùng lên Cloudinary.',
               '1. Đăng nhập JWT, gửi POST /api/v1/users/me/cccd với 2 file ảnh mặt trước và mặt sau < 10MB.\n2. Thử nghiệm gửi file > 10MB.',
               'File hợp lệ -> HTTP 200, URL Cloudinary được lưu vào DB, status=PENDING. File vượt quá 10MB -> Chặn với HTTP 400 PAYLOAD_TOO_LARGE.'),
     'QD', 'High', 'ekyc,cccd,upload,dot-1', 'User', 'Sprint 2'],

    ['Sub-task', 'DS-SUB-USER-02', '10015', '10010', 'TC-USER-02: Khóa trường Họ tên/CCCD sau khi Admin duyệt (Read-only)',
     make_desc('Đảm bảo thông tin định danh không bị người dùng tự ý thay đổi sau khi đã được Admin xác thực.',
               '1. Dùng tài khoản đã có CCCD trạng thái VERIFIED.\n2. Gửi request PUT /api/v1/users/me cố tình sửa lại họ tên hoặc số CCCD.',
               'Hệ thống từ chối cập nhật với HTTP 400 Bad Request (PROFILE_LOCKED). Dữ liệu gốc trong CSDL được bảo toàn.'),
     'QD', 'Medium', 'ekyc,security,dot-1', 'User', 'Sprint 2'],

    ['Sub-task', 'DS-SUB-ADMIN-01', '10016', '10010', 'TC-ADMIN-01: Kiểm tra phân quyền RBAC (Khách gọi API Admin nhận 403)',
     make_desc('Kiểm tra ranh giới bảo mật phân quyền Role-Based Access Control.',
               '1. Đăng nhập với quyền ROLE_RENTER (khách thuê).\n2. Gửi request GET /api/v1/admin/users.',
               'Server chặn ngay lập tức và trả về HTTP 403 Forbidden. Không để lộ dữ liệu quản trị.'),
     'KT', 'Highest', 'rbac,security,dot-1', 'Admin', 'Sprint 2'],

    ['Sub-task', 'DS-SUB-ADMIN-02', '10017', '10010', 'TC-ADMIN-02: Gọi API bảo mật không có JWT Token nhận 401',
     make_desc('Xác minh cơ chế lọc JWT Filter đối với các endpoint yêu cầu xác thực.',
               '1. Gửi GET /api/v1/rentals/me mà không truyền header Authorization Bearer Token.',
               'Server từ chối truy cập với HTTP 401 Unauthorized.'),
     'KT', 'High', 'security,jwt,dot-1', 'Security', 'Sprint 2'],

    # TASK 2: CAR MANAGEMENT & DATE FILTER
    ['Task', 'DS-TASK-CAR', '10020', '10000', 'Kiểm thử Quản lý Xe & Bộ lọc Khả dụng theo Khung ngày',
     'Kiểm thử đăng tin xe của chủ xe và bộ lọc tìm kiếm xe chống trùng lịch (Date-range Overlap).',
     'CN', 'High', 'car,search,filter,dot-1', 'Car', 'Sprint 2'],

    ['Sub-task', 'DS-SUB-CAR-01', '10021', '10020', 'TC-CAR-01: Chủ xe đăng xe mới & Trạng thái khởi tạo PENDING_REVIEW',
     make_desc('Kiểm tra quy trình đăng ký xe mới của chủ xe và chờ phê duyệt.',
               '1. Chủ xe gửi POST /api/v1/owner/cars với thông tin xe, biển số, giá thuê, ảnh cavet.\n2. Kiểm tra trạng thái xe trên sàn công khai và trong DB.',
               'HTTP 201/200. Xe sinh ra ở trạng thái PENDING_REVIEW, tuyệt đối KHÔNG xuất hiện trên danh sách xe công khai cho đến khi Admin duyệt.'),
     'CN', 'High', 'car,create,dot-1', 'Car', 'Sprint 2'],

    ['Sub-task', 'DS-SUB-CAR-02', '10022', '10020', 'TC-CAR-02: Bộ lọc xe khả dụng theo khung ngày (Date-range Overlap)',
     make_desc('Kiểm tra thuật toán lọc xe khả dụng theo khoảng thời gian giao nhau.',
               '1. Xe X đang có đơn CONFIRMED từ ngày 10/11 đến 15/11.\n2. Tìm kiếm xe với khung ngày 12/11 - 14/11.\n3. Tìm kiếm xe với khung ngày 16/11 - 20/11.',
               'Lần 1 (trùng lịch): Xe X bị loại trừ khỏi danh sách kết quả.\nLần 2 (không trùng): Xe X xuất hiện bình thường trong danh sách khả dụng.'),
     'CN', 'Highest', 'car,search,overlap,dot-1', 'Car', 'Sprint 2'],

    # TASK 3: CONCURRENCY
    ['Task', 'DS-TASK-CONCUR', '10030', '10000', 'Kiểm thử Tương tranh Đa luồng (Concurrency & Race Conditions)',
     'Kiểm thử tương tranh bằng JUnit song song ExecutorService: Double approval, cọc lặp, race condition 44:59, cạnh tranh đơn.',
     'VL', 'Highest', 'concurrency,junit,race-condition,dot-1', 'Rental,Payment', 'Sprint 2'],

    ['Sub-task', 'DS-SUB-CONCUR-01', '10031', '10030', 'TC-CONCUR-01: Double Approval - Chủ xe duyệt 2 đơn cùng lúc',
     make_desc('Kiểm tra khóa bi quan bảo vệ khi chủ xe bấm duyệt song song 2 đơn trùng lịch.',
               '1. Tạo 2 đơn trùng lịch cho cùng 1 xe.\n2. Dùng 2 thread song song (ExecutorService) cùng gọi duyệt 2 đơn.',
               'Đúng 1 đơn chuyển thành công sang WAITING_PAYMENT. Đơn còn lại bị chặn với lỗi 409 Conflict (CAR_ALREADY_RENTED). Không bao giờ duyệt đè 2 đơn.'),
     'VL', 'Highest', 'concurrency,race-condition,dot-1', 'Rental', 'Sprint 2'],

    ['Sub-task', 'DS-SUB-CONCUR-02', '10032', '10030', 'TC-CONCUR-02: Idempotent Payment - Cọc 2 lần song song',
     make_desc('Kiểm tra tính Idempotent ngăn ngừa trừ tiền hoặc ghi nhận cọc 2 lần khi mạng lag/double click.',
               '1. Gửi 2 request POST /payments/deposit song song cho cùng 1 rentalId.',
               'Chỉ duy nhất 1 giao dịch thanh toán thành công được ghi nhận, đơn chuyển sang CONFIRMED. Không sinh giao dịch kép hoặc cộng ví 2 lần.'),
     'CN', 'Highest', 'concurrency,payment,dot-1', 'Payment', 'Sprint 2'],

    ['Sub-task', 'DS-SUB-CONCUR-03', '10033', '10030', 'TC-CONCUR-03: Race condition giây 44:59 (Cọc vs Scheduler Expire)',
     make_desc('Kiểm tra tính nguyên tử ACID tại thời điểm biên nguy hiểm nhất giữa thanh toán và hủy tự động.',
               '1. Khách thanh toán cọc đúng giây 44:59.\n2. Đồng thời Scheduler autoExpireWaitingPaymentSoftLocks() chạy quét hết hạn.',
               'Kết quả DB nguyên tử: Đơn hoặc sang CONFIRMED (nếu cọc hoàn tất trước) hoặc sang EXPIRED (nếu hết hạn trước). Tuyệt đối không tồn tại trạng thái lai (bị trừ tiền nhưng đơn EXPIRED).'),
     'VL', 'Highest', 'concurrency,scheduler,dot-1', 'Rental,Payment', 'Sprint 2'],

    ['Sub-task', 'DS-SUB-CONCUR-04', '10034', '10030', 'TC-CONCUR-04: Competing Bookings - Nhiều khách đặt cùng xe',
     make_desc('Kiểm tra tính chịu tải và đồng bộ khi nhiều khách cùng đặt 1 xe trong cùng khung giờ.',
               '1. 10 khách cùng tạo đơn thuê trùng khung ngày cho Xe 1.\n2. Chủ xe bấm duyệt đơn của Khách 1.',
               'Toàn bộ 10 đơn lưu PENDING_APPROVAL. Khi chủ duyệt Đơn 1 -> Đơn 1 sang WAITING_PAYMENT (Soft Lock 45p), 9 đơn còn lại tự động chuyển sang ON_HOLD.'),
     'CN', 'High', 'concurrency,soft-lock,dot-1', 'Rental', 'Sprint 2'],

    # TASK 4: RENTAL CORE & SOFT LOCK & GPLX
    ['Task', 'DS-TASK-RENTAL', '10040', '10000', 'Kiểm thử Vòng đời Thuê xe, Soft Lock 45 phút & eKYC GPLX',
     'Kiểm thử đặt xe E2E, 4 trường hợp GPLX, hồi sinh đơn ON_HOLD và 2 đơn ON_HOLD xung đột nhau.',
     'VL', 'Highest', 'rental,soft-lock,e2e,gplx,dot-1', 'Rental', 'Sprint 2'],

    ['Sub-task', 'DS-SUB-RENTAL-01', '10041', '10040', 'TC-RENTAL-01: E2E Happy Path toàn vòng đời (Đặt -> Trả -> Review)',
     make_desc('Kiểm thử luồng chính xuyên suốt toàn bộ vòng đời hợp đồng thuê xe.',
               '1. Tạo đơn thuê -> Chủ duyệt -> Cọc 30% VietQR -> Check-in 2 chiều -> Check-out 2 chiều -> Đánh giá 5 sao.',
               'Trạng thái chuyển chuẩn xác: PENDING_APPROVAL -> WAITING_PAYMENT -> CONFIRMED -> IN_PROGRESS -> COMPLETED. Ví chủ xe nhận 90% doanh thu thuần + 100% phụ phí xăng.'),
     'VL', 'Highest', 'e2e,smoke,happy-path,dot-1', 'Rental', 'Sprint 2'],

    ['Sub-task', 'DS-SUB-RENTAL-08A', '10042', '10040', 'TC-RENTAL-08A: GPLX Case 1 - Chưa nộp hồ sơ GPLX tự lái bị chặn',
     make_desc('Kiểm tra ràng buộc bắt buộc phải có GPLX khi thuê xe tự lái.',
               '1. Tài khoản chưa từng tải ảnh GPLX gửi yêu cầu thuê tự lái (withDriver=false).\n2. Gửi yêu cầu với withDriver=true (thuê kèm tài xế).',
               'Tự lái: Bị chặn với HTTP 400 Bad Request và ErrorCode KYC_NOT_VERIFIED.\nKèm tài xế: Thành công tạo đơn PENDING_APPROVAL (miễn GPLX khách).'),
     'QD', 'High', 'kyc,gplx,validation,dot-1', 'Rental', 'Sprint 2'],

    ['Sub-task', 'DS-SUB-RENTAL-08B', '10043', '10040', 'TC-RENTAL-08B: GPLX Case 2 - GPLX đang PENDING tự lái bị chặn',
     make_desc('Đảm bảo hồ sơ GPLX đang chờ duyệt thì chưa được phép đặt xe tự lái.',
               '1. Tài khoản đã upload GPLX nhưng trạng thái verificationStatus=PENDING.\n2. Gửi yêu cầu thuê xe tự lái.',
               'Hệ thống ném lỗi HTTP 400 Bad Request (KYC_NOT_VERIFIED), yêu cầu chờ Admin phê duyệt trước khi thuê xe.'),
     'QD', 'High', 'kyc,gplx,validation,dot-1', 'Rental', 'Sprint 2'],

    ['Sub-task', 'DS-SUB-RENTAL-08C', '10044', '10040', 'TC-RENTAL-08C: GPLX Case 3 - GPLX bị REJECTED tự lái bị chặn',
     make_desc('Xác minh hồ sơ GPLX bị từ chối không được phép thực hiện giao dịch thuê xe tự lái.',
               '1. Tài khoản có GPLX bị Admin từ chối (REJECTED do ảnh mờ/hết hạn).\n2. Gửi yêu cầu thuê tự lái.',
               'Bị chặn với HTTP 400 KYC_NOT_VERIFIED kèm thông báo hướng dẫn cập nhật lại giấy tờ trong Hồ sơ cá nhân.'),
     'QD', 'High', 'kyc,gplx,validation,dot-1', 'Rental', 'Sprint 2'],

    ['Sub-task', 'DS-SUB-RENTAL-08D', '10045', '10040', 'TC-RENTAL-08D: GPLX Case 4 - GPLX đã VERIFIED đặt xe tự lái thành công',
     make_desc('Kiểm tra khách hàng đã hoàn tất eKYC được phép đặt xe tự lái bình thường.',
               '1. Tài khoản có GPLX trạng thái VERIFIED.\n2. Gửi yêu cầu thuê xe tự lái hợp lệ.',
               'Tạo đơn thành công với trạng thái PENDING_APPROVAL, tính đúng số tiền thuê và 30% cọc.'),
     'QD', 'High', 'kyc,gplx,dot-1', 'Rental', 'Sprint 2'],

    ['Sub-task', 'DS-SUB-RENTAL-03', '10046', '10040', 'TC-RENTAL-03: Hồi sinh đơn ON_HOLD khi Chủ xe từ chối đơn chính',
     make_desc('Kiểm tra cơ chế tự phục hồi (Self-healing) mở lại cơ hội cho các đơn bị hoãn.',
               '1. Đơn A đang WAITING_PAYMENT, đơn B đang ON_HOLD.\n2. Chủ xe gửi PUT /owner/rentals/{A}/reject kèm lý do từ chối.',
               'Đơn A chuyển sang REJECTED. Đơn B tự động hồi sinh về trạng thái PENDING_APPROVAL, rejectReason được xóa sạch về null.'),
     'VL', 'High', 'on-hold,self-healing,dot-1', 'Rental', 'Sprint 2'],

    ['Sub-task', 'DS-SUB-RENTAL-04', '10047', '10040', 'TC-RENTAL-04: Hồi sinh đơn ON_HOLD khi hết hạn 45 phút Soft Lock',
     make_desc('Kiểm tra Scheduler quét hết hạn giải phóng Soft Lock và phục hồi các đơn ON_HOLD.',
               '1. Đơn A WAITING_PAYMENT quá hạn 45 phút không cọc, đơn B đang ON_HOLD.\n2. Kích hoạt Scheduler autoExpireWaitingPaymentSoftLocks().',
               'Đơn A chuyển sang EXPIRED. Đơn B tự động hồi sinh về PENDING_APPROVAL để chủ xe có thể duyệt tiếp.'),
     'VL', 'High', 'soft-lock,scheduler,dot-1', 'Rental', 'Sprint 2'],

    ['Sub-task', 'DS-SUB-RENTAL-09', '10048', '10040', 'TC-RENTAL-09: Xử lý 2 đơn ON_HOLD xung đột khung giờ với nhau',
     make_desc('Kiểm tra xử lý tình huống phức tạp khi có nhiều đơn ON_HOLD cũng trùng khung giờ với nhau.',
               '1. Đơn A duyệt sang WAITING_PAYMENT. Đơn B và C cùng vào ON_HOLD (biết rằng B và C cũng trùng ngày).\n2. Đơn A bị từ chối -> B và C cùng hồi sinh về PENDING_APPROVAL.\n3. Chủ xe duyệt Đơn B.',
               'Đơn B chuyển sang WAITING_PAYMENT (Soft Lock 45p). Đơn C lập tức bị chuyển lại thành ON_HOLD.'),
     'VL', 'High', 'on-hold,conflict,dot-1', 'Rental', 'Sprint 2'],

    # TASK 5: PAYMENT & EARNINGS
    ['Task', 'DS-TASK-PAYMENT', '10050', '10000', 'Kiểm thử Thanh toán VietQR & Đối soát Doanh thu 90/10',
     'Kiểm thử cọc 30% server-side, bảo mật API cọc, làm tròn số lẻ và đối soát doanh thu chủ xe 90/10 + phụ phí 100%.',
     'CN', 'Highest', 'payment,vietqr,earnings,dot-1', 'Payment', 'Sprint 2'],

    ['Sub-task', 'DS-SUB-PAY-01', '10051', '10050', 'TC-PAY-01: Tính cọc 30% Server-side an toàn (chặn hack amount)',
     make_desc('Đảm bảo server không tin cậy số tiền do client truyền lên.',
               '1. Client gửi POST /payments/deposit với body cố tình sửa amount=1000 VNĐ.\n2. Kiểm tra số tiền trong mã QR và CSDL.',
               'Server bỏ qua amount của client, tự truy vấn DB lấy depositAmount chuẩn (30% giá thuê), sinh QR đúng số tiền hợp đồng.'),
     'CN', 'Highest', 'security,tampering,payment,dot-1', 'Payment', 'Sprint 2'],

    ['Sub-task', 'DS-SUB-PAY-02', '10052', '10050', 'TC-PAY-02: Chặn khách lạ thanh toán cọc đơn người khác (403)',
     make_desc('Kiểm tra phân quyền bảo vệ giao dịch thanh toán đặt cọc.',
               '1. Đăng nhập với User B, gọi API cọc cho rentalId thuộc sở hữu của User A.',
               'Server từ chối xử lý và ném HTTP 403 Forbidden (UNAUTHORIZED). Không sinh giao dịch thanh toán.'),
     'CN', 'High', 'security,authz,dot-1', 'Payment', 'Sprint 2'],

    ['Sub-task', 'DS-SUB-PAY-03', '10053', '10050', 'TC-PAY-03: Chặn thanh toán cọc đơn đã EXPIRED hoặc REJECTED',
     make_desc('Xác minh không nhận thanh toán cho các đơn đã bị hủy hoặc hết hạn giữ chỗ.',
               '1. Gọi POST /payments/deposit cho đơn đã ở trạng thái EXPIRED hoặc REJECTED.',
               'Server từ chối với HTTP 400 Bad Request và ErrorCode RENTAL_NOT_APPROVED.'),
     'CN', 'High', 'validation,business-rule,dot-1', 'Payment', 'Sprint 2'],

    ['Sub-task', 'DS-SUB-PAY-04', '10054', '10050', 'TC-PAY-04: Đối soát Doanh thu 90/10 & Phụ phí 100% cho chủ xe',
     make_desc('Kiểm tra bảng tính đối soát dòng tiền khi chuyến đi hoàn tất.',
               '1. Đơn hoàn tất với tiền thuê 2,000,000đ, phụ phí xăng 150,000đ.\n2. Kiểm tra số liệu tại GET /api/v1/payments/owner/earnings.',
               'Chủ xe nhận đủ: 1,800,000đ (90% tiền thuê) + 150,000đ (100% phụ phí). Sàn chỉ thu 200,000đ (10% hoa hồng trên tiền thuê thuần).'),
     'VL', 'Highest', 'earnings,commission,accounting,dot-1,cần-xác-nhận', 'Payment', 'Sprint 2'],

    ['Sub-task', 'DS-SUB-PAY-06', '10055', '10050', 'TC-PAY-06: Kiểm tra quy tắc làm tròn tiền cọc & chia doanh thu số lẻ',
     make_desc('Kiểm tra tính toán tài chính với các số tiền thuê bị lẻ.',
               '1. Đơn thuê có giá 1,111,111 VNĐ.\n2. Tính cọc 30% và chia tỷ lệ 90/10.',
               'Áp dụng RoundingMode.HALF_UP chuẩn xác, tổng cọc 30% + 70% còn lại đúng bằng 100% totalPrice, không bị lệch 1 đồng.'),
     'VL', 'Medium', 'rounding,accounting,dot-1', 'Payment', 'Sprint 2'],

    # TASK 6: INSPECTION & SESSION RESILIENCE
    ['Task', 'DS-TASK-INSPECT', '10060', '10000', 'Kiểm thử Bàn giao 2 Chiều & Khôi phục Phiên Token',
     'Kiểm thử Check-in, Check-out 2 chiều có đồng thuận của khách, timeout tự động duyệt và khôi phục form sessionStorage.',
     'VL', 'Highest', 'inspection,checkin,checkout,dot-1', 'Rental', 'Sprint 2'],

    ['Sub-task', 'DS-SUB-INSPECT-01', '10061', '10060', 'TC-INSPECT-01: Check-in 2 chiều đầy đủ 4 ảnh hiện trường',
     make_desc('Kiểm tra cơ chế đồng thuận 2 chiều khi giao nhận xe bắt đầu chuyến đi.',
               '1. Chủ xe lập Check-in (ODO, xăng, 4 ảnh) -> Biên bản ở trạng thái PENDING_RENTER_CONFIRMATION.\n2. Khách gọi confirm với agreed=true.',
               'Đơn chính thức chuyển sang IN_PROGRESS. Biên bản chuyển sang CONFIRMED. Chặn chỉnh sửa sau khi đã ký nhận.'),
     'VL', 'Highest', 'checkin,twoway,dot-1', 'Rental', 'Sprint 2'],

    ['Sub-task', 'DS-SUB-INSPECT-02', '10062', '10060', 'TC-INSPECT-02: Check-out 2 chiều & Đối soát phụ phí',
     make_desc('Kiểm tra cơ chế nghiệm thu trả xe và chốt phụ phí xăng 2 chiều.',
               '1. Chủ xe lập Check-out (ODO trả, xăng trả, phụ phí 150k) -> PENDING_RENTER_CONFIRMATION.\n2. Khách bấm xác nhận agreed=true.',
               'Đơn chính thức chuyển sang COMPLETED, lưu actualReturnTime. Biên bản chuyển CONFIRMED.'),
     'VL', 'Highest', 'checkout,twoway,dot-1', 'Rental', 'Sprint 2'],

    ['Sub-task', 'DS-SUB-INSPECT-03', '10063', '10060', 'TC-INSPECT-03: Khôi phục nháp biên bản khi hết hạn Token',
     make_desc('Đảm bảo trải nghiệm người dùng không bị mất 4 ảnh chụp hiện trường khi token hết hạn.',
               '1. Giảm token TTL còn 1 phút, nhập dở biên bản ODO + 4 ảnh, đợi nhận 401 Unauthorized.\n2. Hệ thống lưu sessionStorage -> Đăng nhập lại.',
               'Sau khi đăng nhập lại, form bàn giao tự động khôi phục 100% dữ liệu số ODO, xăng và link ảnh đã upload.'),
     'CN', 'High', 'token,session-storage,resilience,dot-1', 'Rental,Security', 'Sprint 2'],

    ['Sub-task', 'DS-SUB-INSPECT-04', '10064', '10060', 'TC-INSPECT-04: Check-out khách không xác nhận (Tự động duyệt sau 24h)',
     make_desc('Kiểm tra cơ chế bảo vệ quyền lợi chủ xe khi khách cố tình ngâm đơn không xác nhận trả xe.',
               '1. Chủ xe lập Check-out thành công. Khách không bấm xác nhận và không khiếu nại quá 24h.\n2. Hệ thống kích hoạt auto-confirm.',
               'Sau 24h, hệ thống tự động đổi trạng thái biên bản sang CONFIRMED, đơn sang COMPLETED và giải ngân doanh thu cho chủ xe.'),
     'VL', 'Medium', 'checkout,timeout,dot-1,cần-xác-nhận', 'Rental', 'Sprint 2'],

    # TASK 7: REVIEW & AI ASSISTANT
    ['Task', 'DS-TASK-REVIEW-AI', '10070', '10000', 'Kiểm thử Đánh giá Chuyến đi & Trợ lý Ảo AI Chatbot',
     'Khách đánh giá 5 sao cho chuyến đi COMPLETED, chặn đánh giá lặp, và kiểm thử Chatbot RAG tư vấn xe.',
     'PT', 'High', 'review,ai,chatbot,dot-1', 'Rental,AI', 'Sprint 2'],

    ['Sub-task', 'DS-SUB-REVIEW-01', '10071', '10070', 'TC-REVIEW-01: Gửi đánh giá 5 sao & Chặn đánh giá lần 2',
     make_desc('Kiểm tra tính năng đánh giá xe và chặn đánh giá trùng lặp.',
               '1. Khách gửi đánh giá 5 sao cho đơn COMPLETED.\n2. Cố tình gửi tiếp đánh giá lần 2 cho cùng đơn.',
               'Lần 1: Thành công, car.rating_average được tính lại tự động.\nLần 2: Bị chặn với HTTP 400 Bad Request và mã REVIEW_ALREADY_EXISTS.'),
     'VL', 'Medium', 'review,validation,dot-1', 'Rental', 'Sprint 2'],

    ['Sub-task', 'DS-SUB-AI-01', '10072', '10070', 'TC-AI-01: AI Chatbot tư vấn xe Grounded CSDL thật & Tính cọc 30%',
     make_desc('Kiểm tra bộ não trợ lý AI RAG tư vấn chính xác theo kho xe thật và tính cọc chuẩn.',
               '1. Mở widget Chat AI, hỏi: Tôi muốn thuê VinFast VF8 2 ngày từ mai, tính giúp tôi tiền cọc.',
               'AI trả về thông tin xe thực tế từ PostgreSQL, tính đúng Tổng tiền = 2.4tr, Cọc 30% = 720k. Không bịa đặt xe ảo.'),
     'PT', 'High', 'ai,widget,chat,dot-1', 'AI', 'Sprint 2'],

    ['Sub-task', 'DS-SUB-NOTIF-01', '10073', '10070', 'TC-NOTIF-01: Đẩy thông báo thời gian thực qua WebSocket STOMP',
     make_desc('Kiểm tra hệ thống đẩy thông báo thời gian thực giữa Khách và Chủ xe.',
               '1. Mở 2 trình duyệt (1 Khách, 1 Chủ xe).\n2. Chủ xe duyệt đơn hoặc Khách cọc tiền.',
               'Chuông thông báo của đối phương lập tức nhảy số đỏ và hiện pop-up thời gian thực qua kênh WebSocket STOMP mà không cần reload trang.'),
     'PT', 'Medium', 'websocket,notification,dot-1', 'Notification', 'Sprint 2'],

    # TASK 8 (ĐỢT 2): PENALTY, BLACKLIST, DISPUTE & HOST PENALTIES
    ['Task', 'DS-TASK-PENALTY', '10080', '10000', 'ĐỢT 2: Kiểm thử Luồng Xử phạt, Blacklist, Tranh chấp & Phạt Chủ xe',
     'Kiểm thử xử phạt trễ hạn OVERDUE, khóa tài khoản BLOCKED, xuất Dossier vi phạm, khiếu nại DISPUTED, No-show và 3 case phạt chủ xe.',
     'QD', 'Highest', 'penalty,overdue,blacklist,dispute,host-penalty,dot-2', 'Rental,Admin', 'Sprint 2'],

    ['Sub-task', 'DS-SUB-PEN-01', '10081', '10080', 'TC-PENALTY-01: Quá hạn trả xe dưới 24h (Phạt giờ hệ số x1.5)',
     make_desc('Kiểm tra chế tài xử phạt trễ hạn theo giờ dưới 24 tiếng.',
               '1. Mô phỏng đơn IN_PROGRESS quá hạn kết thúc 3 tiếng chưa trả xe.\n2. Scheduler autoCheckOverdueRentals() quét.',
               'Đơn chuyển sang OVERDUE. Phí phạt tính đúng: 3h x (giá ngày / 10) x 1.5 = 450,000 VNĐ.'),
     'QD', 'Highest', 'overdue,penalty,dot-2,cần-xác-nhận', 'Rental', 'Sprint 2'],

    ['Sub-task', 'DS-SUB-PEN-02', '10082', '10080', 'TC-PENALTY-02: Quá hạn trên 24h & Khóa tài khoản BLOCKED (Danh sách đen)',
     make_desc('Kiểm tra chế tài nghiêm khắc đối với hành vi trễ hạn trả xe nghiêm trọng trên 24h.',
               '1. Mô phỏng đơn trễ hạn 25 tiếng.\n2. Scheduler quét kiểm tra vi phạm.',
               'Đơn chuyển OVERDUE với mức phạt lũy tiến gấp đôi đơn giá ngày. Tài khoản khách tự động bị chuyển status=BLOCKED, cấm vĩnh viễn tạo đơn mới.'),
     'QD', 'Highest', 'blacklist,blocked,dot-2,cần-xác-nhận', 'Rental,User', 'Sprint 2'],

    ['Sub-task', 'DS-SUB-PEN-03', '10083', '10080', 'TC-PENALTY-03: Xuất hồ sơ pháp lý 1-Click Dossier Điều 175 BLHS',
     make_desc('Kiểm tra tính năng trích xuất toàn bộ hồ sơ vi phạm cung cấp cho cơ quan điều tra.',
               '1. Admin gọi GET /api/v1/admin/rentals/{id}/dossier cho đơn vi phạm quá hạn > 24h.',
               'Trả về JSON/PDF đầy đủ thông tin: CCCD, GPLX 2 mặt, lịch sử di chuyển, biên bản bàn giao và bằng chứng vi phạm Điều 175 BLHS.'),
     'QD', 'High', 'dossier,legal,pdf,dot-2', 'Rental,Admin', 'Sprint 2'],

    ['Sub-task', 'DS-SUB-PEN-04', '10084', '10080', 'TC-PENALTY-04: Phụ phí phát sinh lúc trả xe Check-out (thiếu xăng, bẩn xe)',
     make_desc('Kiểm tra ghi nhận phụ phí phát sinh bồi thường cho chủ xe.',
               '1. Chủ xe nhập phụ phí 150,000đ và lý do "Thiếu 10% bình xăng" khi lập Check-out.',
               'Biên bản lưu đúng extraFee=150000 và extraFeeReason vào DB. Khách xác nhận đồng ý -> Khoản tiền được chuyển cho chủ xe.'),
     'QD', 'High', 'checkout,extrafee,dot-2', 'Rental', 'Sprint 2'],

    ['Sub-task', 'DS-SUB-PEN-05', '10085', '10080', 'TC-PENALTY-05: Validation chặn ODO trả xe nhỏ hơn ODO lúc nhận',
     make_desc('Kiểm tra ràng buộc logic ngăn ngừa chủ xe nhập sai số km đồng hồ.',
               '1. ODO nhận là 15,000 km. Chủ xe cố tình nhập ODO trả là 14,000 km trong Check-out.',
               'Hệ thống ném lỗi Validation INVALID_ODOMETER chặn lại, bắt buộc ODO trả phải >= ODO nhận.'),
     'QD', 'Medium', 'validation,odometer,dot-2', 'Rental', 'Sprint 2'],

    ['Sub-task', 'DS-SUB-DISPUTE-01', '10086', '10080', 'TC-RENTAL-05: Khách từ chối biên bản Check-in & Khiếu nại sai lệch (DISPUTED)',
     make_desc('Kiểm tra luồng khiếu nại khi hiện trạng xe bàn giao không đúng với thỏa thuận.',
               '1. Khách gọi confirm biên bản Check-in với agreed=false kèm lý do và ảnh bằng chứng.',
               'Biên bản chuyển DISPUTED, đơn thuê chuyển sang DISPUTED, tạo tự động bản ghi khiếu nại trong rental_disputes chờ Admin xử lý.'),
     'KT', 'High', 'dispute,checkin,dot-2', 'Rental', 'Sprint 2'],

    ['Sub-task', 'DS-SUB-DISPUTE-02', '10087', '10080', 'TC-RENTAL-06: Khách hủy đơn trước giờ nhận >24h được hoàn 100% cọc',
     make_desc('Kiểm tra chính sách hủy đơn hợp lệ trước 24 giờ.',
               '1. Đơn đã CONFIRMED. Khách gửi yêu cầu hủy trước giờ nhận xe > 24 giờ.',
               'Đơn chuyển sang CANCELLED_BY_GUEST. Hệ thống tạo lệnh hoàn trả 100% tiền cọc cho khách hàng.'),
     'KT', 'High', 'cancellation,refund,dot-2', 'Rental,Payment', 'Sprint 2'],

    ['Sub-task', 'DS-SUB-DISPUTE-03', '10088', '10080', 'TC-RENTAL-07: Khách hủy đơn trong vòng <24h bị mất 100% cọc',
     make_desc('Kiểm tra chế tài hủy đơn muộn gây thiệt hại cho chủ xe.',
               '1. Khách gửi yêu cầu hủy đơn khi chỉ còn dưới 24 giờ trước giờ nhận xe.',
               'Đơn chuyển sang CANCELLED_BY_GUEST. Khách mất 100% tiền cọc, số tiền cọc được chuyển bồi thường vào ví của chủ xe.'),
     'KT', 'High', 'cancellation,no-refund,dot-2', 'Rental,Payment', 'Sprint 2'],

    ['Sub-task', 'DS-SUB-DISPUTE-04', '10089', '10080', 'TC-RENTAL-04: No-show chủ xe không đến giao xe (Hoàn cọc Idempotent)',
     make_desc('Kiểm tra xử lý sự cố chủ xe bùng kèo và chặn hoàn cọc 2 lần.',
               '1. Khách gửi khiếu nại report-no-show kèm bằng chứng.\n2. Admin duyệt RESOLVED_REFUND lần 1.\n3. Admin bấm duyệt tiếp lần 2.',
               'Lần 1: Hoàn 100% cọc cho khách, chủ xe bị ghi nợ phạt, đơn sang CANCELLED_BY_HOST.\nLần 2: Chặn lỗi DISPUTE_ALREADY_RESOLVED (chống hoàn tiền kép).'),
     'KT', 'Highest', 'no-show,refund,penalty,dot-2', 'Rental,Admin', 'Sprint 2'],

    ['Sub-task', 'DS-SUB-HOST-01', '10090', '10080', 'TC-PENALTY-06: Phạt chủ xe 1 - Admin từ chối khiếu nại sai (Khách vu khống)',
     make_desc('Kiểm tra bảo vệ quyền lợi chủ xe khi khách khiếu nại sai sự thật.',
               '1. Khách khiếu nại sai, Admin kiểm tra đối chiếu bằng chứng và bấm từ chối khiếu nại (REJECTED).',
               'Đơn khiếu nại chuyển sang REJECTED. Tiền cọc được bảo toàn hoặc chuyển bồi thường cho chủ xe, đơn tiếp tục/kết thúc hợp lệ, Chủ xe KHÔNG bị phạt nợ.'),
     'KT', 'High', 'host-penalty,dispute,dot-2', 'Rental,Admin', 'Sprint 2'],

    ['Sub-task', 'DS-SUB-HOST-02', '10091', '10080', 'TC-PENALTY-07: Phạt chủ xe 2 - Đối soát cấn trừ công nợ phạt vào chuyến sau',
     make_desc('Kiểm tra cơ chế thu hồi tiền phạt qua cấn trừ doanh thu tự động.',
               '1. Chủ xe đang bị ghi nợ phạt 500,000đ do vi phạm đơn trước.\n2. Chủ xe hoàn tất chuyến đi mới với thu nhập 1,800,000đ.',
               'Hệ thống tự động cấn trừ 500,000đ nợ cũ, giải ngân số dư thực nhận 1,300,000đ vào ví khả dụng. Hiển thị rõ dòng cấn trừ trong báo cáo doanh thu.'),
     'KT', 'Highest', 'host-penalty,debt,earnings,dot-2,cần-xác-nhận', 'Payment', 'Sprint 2'],

    ['Sub-task', 'DS-SUB-HOST-03', '10092', '10080', 'TC-PENALTY-08: Phạt chủ xe 3 - Chủ xe tự ý hủy đơn sau cọc (CANCELLED_BY_HOST)',
     make_desc('Kiểm tra chế tài xử phạt khi chủ xe đơn phương hủy kèo sau khi khách đã đặt cọc.',
               '1. Đơn đã CONFIRMED, chủ xe tự ý bấm hủy đơn.',
               'Đơn chuyển sang CANCELLED_BY_HOST. Hệ thống tự động hoàn 100% cọc cho khách và ghi nhận khoản phạt nợ 30% giá trị hợp đồng đối với chủ xe.'),
     'KT', 'Highest', 'host-penalty,cancellation,dot-2', 'Rental,Payment', 'Sprint 2']
]

with open('docs/scrum/jira_test_plan_import.csv', 'w', newline='', encoding='utf-8-sig') as f:
    writer = csv.writer(f)
    writer.writerow(headers)
    writer.writerows(rows)

print(f'Ghi thanh cong {len(rows)} issues vao docs/scrum/jira_test_plan_import.csv voi template day du!')

