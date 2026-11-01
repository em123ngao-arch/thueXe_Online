import os

# 1. Update RentalServiceImpl.java
rental_service_path = r'C:\Users\ChiTin\Downloads\ThueXe\thueXe_Online\backend\src\main\java\com\driveshare\modules\rental\service\impl\RentalServiceImpl.java'
with open(rental_service_path, 'r', encoding='utf-8') as f:
    rs = f.read()

target_fields_rs = 'private final com.driveshare.modules.user.repository.UserRepository userRepository;'
repl_fields_rs = target_fields_rs + '\n\n    @org.springframework.beans.factory.annotation.Autowired(required = false)\n    private com.driveshare.modules.notification.application.port.in.NotificationUseCase notificationUseCase;'
if target_fields_rs in rs and 'notificationUseCase' not in rs:
    rs = rs.replace(target_fields_rs, repl_fields_rs)

target_save_rs = 'Rental savedRental = rentalRepository.save(rental);'
repl_save_rs = '''Rental savedRental = rentalRepository.save(rental);
        log.info("Tạo yêu cầu thuê xe thành công: rentalId={}, carId={}, renterId={}, totalDays={}, totalPrice={}, withDriver={}, driverFee={}, status={}",
                savedRental.getRentalId(), car.getCarId(), renterId, totalDays, totalPrice, isWithDriver, driverFee, savedRental.getStatus());

        if (notificationUseCase != null && car.getOwnerId() != null) {
            try {
                notificationUseCase.sendNotification(
                        car.getOwnerId(),
                        "Yêu cầu thuê xe mới",
                        String.format("Khách thuê vừa gửi yêu cầu đặt xe %s %s (%s). Mã đơn #%d. Vui lòng kiểm tra và duyệt đơn.",
                                car.getBrand(), car.getModel(), car.getPlateNumber(), savedRental.getRentalId()),
                        "RENTAL_CREATED",
                        savedRental.getRentalId()
                );
                log.info("Đã gửi thông báo yêu cầu thuê xe tới chủ xe ownerId={}", car.getOwnerId());
            } catch (Exception e) {
                log.warn("Không thể gửi thông báo cho chủ xe: {}", e.getMessage());
            }
        }'''

# Replace the save and log block
old_log_block = '''Rental savedRental = rentalRepository.save(rental);
        log.info("Tạo yêu cầu thuê xe thành công: rentalId={}, carId={}, renterId={}, totalDays={}, totalPrice={}, withDriver={}, driverFee={}, status={}",
                savedRental.getRentalId(), car.getCarId(), renterId, totalDays, totalPrice, isWithDriver, driverFee, savedRental.getStatus());'''

if old_log_block in rs:
    rs = rs.replace(old_log_block, repl_save_rs)
    with open(rental_service_path, 'w', encoding='utf-8') as f:
        f.write(rs)
    print("Updated RentalServiceImpl.java successfully")
else:
    print("Warning: old_log_block not matched in RentalServiceImpl.java")

# 2. Update OwnerRentalServiceImpl.java
owner_service_path = r'C:\Users\ChiTin\Downloads\ThueXe\thueXe_Online\backend\src\main\java\com\driveshare\modules\rental\service\impl\OwnerRentalServiceImpl.java'
with open(owner_service_path, 'r', encoding='utf-8') as f:
    os_code = f.read()

target_fields_os = 'private final CarRepository carRepository;'
repl_fields_os = target_fields_os + '\n\n    @org.springframework.beans.factory.annotation.Autowired(required = false)\n    private com.driveshare.modules.notification.application.port.in.NotificationUseCase notificationUseCase;'
if target_fields_os in os_code and 'notificationUseCase' not in os_code:
    os_code = os_code.replace(target_fields_os, repl_fields_os)

# Notification after approve
old_approve_log = 'log.info("Duyệt thành công đơn rentalId={} sang WAITING_PAYMENT, hạn thanh toán: {}", rentalId, rental.getPaymentExpiresAt());'
repl_approve_log = '''if (notificationUseCase != null && rental.getRenterId() != null) {
            try {
                notificationUseCase.sendNotification(
                        rental.getRenterId(),
                        "Yêu cầu thuê xe đã được duyệt",
                        String.format("Chủ xe đã duyệt yêu cầu thuê xe %s %s (#%d). Vui lòng đặt cọc 30%% trong vòng 45 phút để hoàn tất giữ xe.",
                                car.getBrand(), car.getModel(), rental.getRentalId()),
                        "RENTAL_APPROVED",
                        rental.getRentalId()
                );
                log.info("Đã gửi thông báo duyệt đơn tới khách thuê renterId={}", rental.getRenterId());
            } catch (Exception e) {
                log.warn("Không thể gửi thông báo duyệt đơn: {}", e.getMessage());
            }
        }

        log.info("Duyệt thành công đơn rentalId={} sang WAITING_PAYMENT, hạn thanh toán: {}", rentalId, rental.getPaymentExpiresAt());'''

if old_approve_log in os_code:
    os_code = os_code.replace(old_approve_log, repl_approve_log)

# Notification after reject
old_reject_log = 'log.info("Đã từ chối đơn rentalId={}, lý do: {}", rentalId, request.getReason());'
repl_reject_log = '''if (notificationUseCase != null && rental.getRenterId() != null) {
            try {
                notificationUseCase.sendNotification(
                        rental.getRenterId(),
                        "Yêu cầu thuê xe bị từ chối",
                        String.format("Chủ xe đã từ chối yêu cầu thuê xe #%d. Lý do: %s",
                                rental.getRentalId(), request.getReason() != null ? request.getReason() : "Chủ xe bận"),
                        "RENTAL_REJECTED",
                        rental.getRentalId()
                );
                log.info("Đã gửi thông báo từ chối tới khách thuê renterId={}", rental.getRenterId());
            } catch (Exception e) {
                log.warn("Không thể gửi thông báo từ chối: {}", e.getMessage());
            }
        }

        log.info("Đã từ chối đơn rentalId={}, lý do: {}", rentalId, request.getReason());'''

if old_reject_log in os_code:
    os_code = os_code.replace(old_reject_log, repl_reject_log)

with open(owner_service_path, 'w', encoding='utf-8') as f:
    f.write(os_code)
print("Updated OwnerRentalServiceImpl.java successfully")

# 3. Update PaymentServiceImpl.java
payment_service_path = r'C:\Users\ChiTin\Downloads\ThueXe\thueXe_Online\backend\src\main\java\com\driveshare\modules\payment\service\impl\PaymentServiceImpl.java'
with open(payment_service_path, 'r', encoding='utf-8') as f:
    ps = f.read()

target_fields_ps = 'private final ReviewRepository reviewRepository;'
repl_fields_ps = target_fields_ps + '\n\n    @org.springframework.beans.factory.annotation.Autowired(required = false)\n    private com.driveshare.modules.notification.application.port.in.NotificationUseCase notificationUseCase;'
if target_fields_ps in ps and 'notificationUseCase' not in ps:
    ps = ps.replace(target_fields_ps, repl_fields_ps)

old_confirm_log = 'log.info("Đơn rentalId={} đã được chuyển sang trạng thái CONFIRMED sau khi thanh toán", rental.getRentalId());'
repl_confirm_log = '''if (notificationUseCase != null) {
            try {
                if (rental.getRenterId() != null) {
                    notificationUseCase.sendNotification(
                            rental.getRenterId(),
                            "Đặt cọc thành công",
                            String.format("Bạn đã thanh toán cọc 30%% cho đơn #%d thành công. Chuyến đi của bạn đã được xác nhận (CONFIRMED)!", rental.getRentalId()),
                            "RENTAL_CONFIRMED",
                            rental.getRentalId()
                    );
                }
                Car car = carRepository.findById(rental.getCarId()).orElse(null);
                if (car != null && car.getOwnerId() != null) {
                    notificationUseCase.sendNotification(
                            car.getOwnerId(),
                            "Khách đã đặt cọc xe thành công",
                            String.format("Khách thuê đã thanh toán cọc 30%% cho xe %s %s (#%d). Vui lòng chuẩn bị xe để bàn giao đúng hẹn.",
                                    car.getBrand(), car.getModel(), rental.getRentalId()),
                            "RENTAL_CONFIRMED",
                            rental.getRentalId()
                    );
                }
                log.info("Đã gửi thông báo xác nhận cọc thành công cho cả khách và chủ xe");
            } catch (Exception e) {
                log.warn("Không thể gửi thông báo đặt cọc thành công: {}", e.getMessage());
            }
        }

        log.info("Đơn rentalId={} đã được chuyển sang trạng thái CONFIRMED sau khi thanh toán", rental.getRentalId());'''

if old_confirm_log in ps:
    ps = ps.replace(old_confirm_log, repl_confirm_log)
    with open(payment_service_path, 'w', encoding='utf-8') as f:
        f.write(ps)
    print("Updated PaymentServiceImpl.java successfully")
else:
    print("Warning: old_confirm_log not matched in PaymentServiceImpl.java")

