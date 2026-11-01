import os

path = r'C:\Users\ChiTin\Downloads\ThueXe\thueXe_Online\backend\src\main\java\com\driveshare\modules\rental\adapter\in\web\RentalController.java'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

target_field = 'private final com.driveshare.modules.rental.service.RentalDisputeService rentalDisputeService;'
repl_field = target_field + '\n    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;'
c = c.replace(target_field, repl_field)

target_method = 'private Long getCurrentUserId() {'
clear_endpoint = '''/**
     * Xóa sạch toàn bộ đơn thuê và chuyến đi (dọn dẹp dữ liệu để test lại từ đầu)
     */
    @RequestMapping(value = "/clear-all", method = {RequestMethod.DELETE, RequestMethod.POST, RequestMethod.GET})
    @Operation(summary = "Xóa sạch toàn bộ đơn thuê và chuyến đi", description = "Dọn sạch bảng rentals, reviews, inspections, payments, disputes")
    public ResponseEntity<ApiResponse<String>> clearAllRentals() {
        try {
            jdbcTemplate.execute("DELETE FROM reviews");
            jdbcTemplate.execute("DELETE FROM rental_inspections");
            jdbcTemplate.execute("DELETE FROM payments");
            jdbcTemplate.execute("DELETE FROM rental_disputes");
            jdbcTemplate.execute("DELETE FROM car_calendar_blocks");
            jdbcTemplate.execute("DELETE FROM rentals");
            jdbcTemplate.execute("DELETE FROM notifications WHERE type IN ('RENTAL_COMPLETED', 'REVIEW_RECEIVED', 'RENTAL_CREATED', 'RENTAL_APPROVED')");
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(RentalController.class).warn("Lỗi khi xóa đơn thuê: {}", e.getMessage());
        }
        return ResponseEntity.ok(ApiResponse.success("Đã xóa sạch toàn bộ đơn thuê và chuyến đi"));
    }

    private Long getCurrentUserId() {'''
c = c.replace(target_method, clear_endpoint)

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)

print('Updated RentalController.java')

