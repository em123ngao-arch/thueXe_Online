package com.driveshare.modules.payment.service.impl;

import com.driveshare.common.enums.EPaymentMethod;
import com.driveshare.common.enums.EPaymentStatus;
import com.driveshare.common.enums.ERentalStatus;
import com.driveshare.common.exception.AppException;
import com.driveshare.common.exception.ErrorCode;
import com.driveshare.modules.car.entity.Car;
import com.driveshare.modules.car.repository.CarRepository;
import com.driveshare.modules.payment.dto.request.CreatePaymentRequest;
import com.driveshare.modules.payment.dto.response.OwnerEarningsResponse;
import com.driveshare.modules.payment.dto.response.PaymentResponse;
import com.driveshare.modules.payment.dto.response.PaymentTransactionDto;
import com.driveshare.modules.payment.entity.Payment;
import com.driveshare.modules.payment.repository.PaymentRepository;
import com.driveshare.modules.payment.service.PaymentService;
import com.driveshare.modules.payment.util.VietQrUtils;
import com.driveshare.modules.rental.entity.Rental;
import com.driveshare.modules.rental.repository.RentalRepository;
import com.driveshare.modules.user.entity.User;
import com.driveshare.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final RentalRepository rentalRepository;
    private final CarRepository carRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public PaymentResponse createDepositPayment(Long rentalId, CreatePaymentRequest request, Long currentUserId) {
        log.info("Khởi tạo thanh toán đặt cọc cho rentalId={}, user={}", rentalId, currentUserId);

        Rental rental = rentalRepository.findById(rentalId)
                .orElseThrow(() -> new AppException(ErrorCode.RENTAL_NOT_FOUND));

        // 1. Kiểm tra quyền của người dùng (chỉ người tạo đơn hoặc admin)
        if (currentUserId != null && !rental.getRenterId().equals(currentUserId)) {
            log.warn("User {} không phải là người tạo đơn rentalId={}", currentUserId, rentalId);
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // 2. Chỉ đơn APPROVED mới được thanh toán cọc
        if (rental.getStatus() != ERentalStatus.APPROVED) {
            log.warn("Đơn thuê rentalId={} đang ở trạng thái {} không thể đặt cọc", rentalId, rental.getStatus());
            throw new AppException(ErrorCode.RENTAL_NOT_APPROVED);
        }

        // 3. Kiểm tra xem đã có giao dịch nào chưa
        Optional<Payment> existingOpt = paymentRepository.findByRentalId(rentalId);
        if (existingOpt.isPresent()) {
            Payment existing = existingOpt.get();
            if (existing.getStatus() == EPaymentStatus.SUCCESS) {
                log.warn("Đơn thuê rentalId={} đã được thanh toán thành công trước đó", rentalId);
                throw new AppException(ErrorCode.PAYMENT_ALREADY_COMPLETED);
            }
            if (existing.getStatus() == EPaymentStatus.PENDING) {
                log.info("Trả về giao dịch PENDING hiện có cho rentalId={}", rentalId);
                return toPaymentResponse(existing, rental);
            }
            // Nếu FAILED hoặc CANCELLED -> tái tạo giao dịch mới
            existing.setStatus(EPaymentStatus.PENDING);
            String transactionCode = "DSPAY" + rentalId + "_" + System.currentTimeMillis();
            existing.setTransactionCode(transactionCode);
            String qrUrl = VietQrUtils.generateQrUrl(
                    VietQrUtils.getDefaultBankId(),
                    VietQrUtils.getDefaultAccountNo(),
                    VietQrUtils.getDefaultAccountName(),
                    existing.getAmount().longValue(),
                    transactionCode
            );
            existing.setQrCodeUrl(qrUrl);
            existing = paymentRepository.save(existing);
            return toPaymentResponse(existing, rental);
        }

        // 4. Tính toán tiền cọc 30%
        BigDecimal depositAmount = rental.getDepositAmount();
        if (depositAmount == null || depositAmount.compareTo(BigDecimal.ZERO) <= 0) {
            BigDecimal totalPrice = rental.getTotalPrice() != null ? rental.getTotalPrice() : BigDecimal.ZERO;
            depositAmount = totalPrice.multiply(new BigDecimal("0.30")).setScale(2, RoundingMode.HALF_UP);
            rental.setDepositAmount(depositAmount);
            rentalRepository.save(rental);
        }

        // 5. Sinh transaction code và QR VietQR
        String transactionCode = "DSPAY" + rentalId + "_" + System.currentTimeMillis();
        String qrUrl = VietQrUtils.generateQrUrl(
                VietQrUtils.getDefaultBankId(),
                VietQrUtils.getDefaultAccountNo(),
                VietQrUtils.getDefaultAccountName(),
                depositAmount.longValue(),
                transactionCode
        );

        EPaymentMethod method = (request != null && request.getPaymentMethod() != null)
                ? request.getPaymentMethod()
                : EPaymentMethod.VIETQR;

        String paymentType = (request != null && request.getPaymentType() != null && !request.getPaymentType().isBlank())
                ? request.getPaymentType()
                : "DEPOSIT";

        Payment payment = Payment.builder()
                .rentalId(rentalId)
                .amount(depositAmount)
                .paymentType(paymentType)
                .paymentMethod(method)
                .status(EPaymentStatus.PENDING)
                .transactionCode(transactionCode)
                .qrCodeUrl(qrUrl)
                .build();

        payment = paymentRepository.save(payment);
        log.info("Đã tạo giao dịch cọc paymentId={} cho rentalId={}", payment.getPaymentId(), rentalId);

        return toPaymentResponse(payment, rental);
    }

    @Override
    @Transactional
    public PaymentResponse confirmPayment(Long paymentId, Long currentUserId) {
        log.info("Xác nhận thanh toán thành công cho paymentId={}, actor={}", paymentId, currentUserId);

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_NOT_FOUND));

        if (payment.getStatus() == EPaymentStatus.SUCCESS) {
            log.warn("Payment paymentId={} đã thanh toán thành công trước đó", paymentId);
            throw new AppException(ErrorCode.PAYMENT_ALREADY_COMPLETED);
        }

        payment.setStatus(EPaymentStatus.SUCCESS);
        payment.setPaidAt(Instant.now());
        payment = paymentRepository.save(payment);

        // CRP-53: Booking Status Lifecycle after Payment -> Đơn chuyển sang CONFIRMED
        Rental rental = rentalRepository.findById(payment.getRentalId())
                .orElseThrow(() -> new AppException(ErrorCode.RENTAL_NOT_FOUND));

        rental.setStatus(ERentalStatus.CONFIRMED);
        rental.setUpdatedAt(Instant.now());
        rentalRepository.save(rental);

        log.info("Đơn rentalId={} đã được chuyển sang trạng thái CONFIRMED sau khi thanh toán", rental.getRentalId());
        return toPaymentResponse(payment, rental);
    }

    @Override
    @Transactional
    public PaymentResponse failPayment(Long paymentId, Long currentUserId, String note) {
        log.info("Ghi nhận thanh toán thất bại cho paymentId={}", paymentId);

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_NOT_FOUND));

        if (payment.getStatus() == EPaymentStatus.SUCCESS) {
            throw new AppException(ErrorCode.PAYMENT_ALREADY_COMPLETED);
        }

        payment.setStatus(EPaymentStatus.FAILED);
        payment = paymentRepository.save(payment);

        Rental rental = rentalRepository.findById(payment.getRentalId()).orElse(null);
        return toPaymentResponse(payment, rental);
    }

    @Override
    @Transactional
    public PaymentResponse cancelPayment(Long paymentId, Long currentUserId, String note) {
        log.info("Hủy thanh toán cho paymentId={}", paymentId);

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_NOT_FOUND));

        if (payment.getStatus() == EPaymentStatus.SUCCESS) {
            throw new AppException(ErrorCode.PAYMENT_ALREADY_COMPLETED);
        }

        payment.setStatus(EPaymentStatus.CANCELLED);
        payment = paymentRepository.save(payment);

        Rental rental = rentalRepository.findById(payment.getRentalId()).orElse(null);
        return toPaymentResponse(payment, rental);
    }

    @Override
    @Transactional
    public PaymentResponse updatePaymentStatus(Long paymentId, EPaymentStatus status, String note, Long currentUserId) {
        if (status == EPaymentStatus.SUCCESS) {
            return confirmPayment(paymentId, currentUserId);
        } else if (status == EPaymentStatus.FAILED) {
            return failPayment(paymentId, currentUserId, note);
        } else if (status == EPaymentStatus.CANCELLED) {
            return cancelPayment(paymentId, currentUserId, note);
        }

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_NOT_FOUND));
        payment.setStatus(status);
        payment = paymentRepository.save(payment);

        Rental rental = rentalRepository.findById(payment.getRentalId()).orElse(null);
        return toPaymentResponse(payment, rental);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getPaymentById(Long paymentId, Long currentUserId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_NOT_FOUND));
        Rental rental = rentalRepository.findById(payment.getRentalId()).orElse(null);
        return toPaymentResponse(payment, rental);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getPaymentByRentalId(Long rentalId, Long currentUserId) {
        Payment payment = paymentRepository.findByRentalId(rentalId)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_NOT_FOUND));
        Rental rental = rentalRepository.findById(rentalId).orElse(null);
        return toPaymentResponse(payment, rental);
    }

    @Override
    @Transactional(readOnly = true)
    public OwnerEarningsResponse getOwnerEarnings(Long ownerId) {
        log.info("Lấy thống kê doanh thu cho chủ xe ownerId={}", ownerId);

        // 1. Lấy danh sách xe của owner
        List<Car> cars = carRepository.findByOwnerIdAndDeletedAtIsNull(ownerId, Pageable.unpaged()).getContent();
        if (cars.isEmpty()) {
            return OwnerEarningsResponse.builder()
                    .ownerId(ownerId)
                    .totalEarnings(BigDecimal.ZERO)
                    .pendingEarnings(BigDecimal.ZERO)
                    .totalTransactions(0L)
                    .completedRentals(0L)
                    .transactions(Collections.emptyList())
                    .build();
        }

        Map<Long, Car> carMap = cars.stream()
                .collect(Collectors.toMap(Car::getCarId, c -> c, (a, b) -> a));
        List<Long> carIds = new ArrayList<>(carMap.keySet());

        // 2. Lấy các đơn thuê của các xe này
        List<Rental> rentals = rentalRepository.findByCarIdInOrderByCreatedAtDesc(carIds);
        if (rentals.isEmpty()) {
            return OwnerEarningsResponse.builder()
                    .ownerId(ownerId)
                    .totalEarnings(BigDecimal.ZERO)
                    .pendingEarnings(BigDecimal.ZERO)
                    .totalTransactions(0L)
                    .completedRentals(0L)
                    .transactions(Collections.emptyList())
                    .build();
        }

        Map<Long, Rental> rentalMap = rentals.stream()
                .collect(Collectors.toMap(Rental::getRentalId, r -> r, (a, b) -> a));
        List<Long> rentalIds = new ArrayList<>(rentalMap.keySet());

        // 3. Tính tổng doanh thu và tiền cọc đang chờ
        BigDecimal totalEarnings = paymentRepository.sumEarningsByRentalIds(rentalIds, EPaymentStatus.SUCCESS);
        if (totalEarnings == null) totalEarnings = BigDecimal.ZERO;

        BigDecimal pendingEarnings = paymentRepository.sumEarningsByRentalIds(rentalIds, EPaymentStatus.PENDING);
        if (pendingEarnings == null) pendingEarnings = BigDecimal.ZERO;

        // 4. Lấy danh sách thanh toán
        List<Payment> payments = paymentRepository.findByRentalIdInOrderByCreatedAtDesc(rentalIds);

        // 5. Lấy thông tin người thuê
        List<Long> renterIds = rentals.stream().map(Rental::getRenterId).distinct().toList();
        Map<Long, User> userMap = userRepository.findAllById(renterIds).stream()
                .collect(Collectors.toMap(User::getUserId, u -> u, (a, b) -> a));

        List<PaymentTransactionDto> transactions = payments.stream().map(p -> {
            Rental r = rentalMap.get(p.getRentalId());
            Car c = (r != null) ? carMap.get(r.getCarId()) : null;
            User u = (r != null) ? userMap.get(r.getRenterId()) : null;

            return PaymentTransactionDto.builder()
                    .paymentId(p.getPaymentId())
                    .rentalId(p.getRentalId())
                    .carId(c != null ? c.getCarId() : null)
                    .carBrand(c != null ? c.getBrand() : null)
                    .carModel(c != null ? c.getModel() : null)
                    .plateNumber(c != null ? c.getPlateNumber() : null)
                    .renterId(u != null ? u.getUserId() : null)
                    .renterName(u != null ? u.getFullName() : null)
                    .renterPhone(u != null ? u.getPhone() : null)
                    .renterEmail(u != null ? u.getEmail() : null)
                    .amount(p.getAmount())
                    .paymentType(p.getPaymentType())
                    .paymentMethod(p.getPaymentMethod())
                    .status(p.getStatus())
                    .transactionCode(p.getTransactionCode())
                    .paidAt(p.getPaidAt())
                    .createdAt(p.getCreatedAt())
                    .startDate(r != null ? r.getStartDate() : null)
                    .endDate(r != null ? r.getEndDate() : null)
                    .build();
        }).toList();

        long completedRentals = rentals.stream()
                .filter(r -> r.getStatus() == ERentalStatus.CONFIRMED
                        || r.getStatus() == ERentalStatus.COMPLETED
                        || r.getStatus() == ERentalStatus.IN_PROGRESS)
                .count();

        return OwnerEarningsResponse.builder()
                .ownerId(ownerId)
                .totalEarnings(totalEarnings)
                .pendingEarnings(pendingEarnings)
                .totalTransactions((long) transactions.size())
                .completedRentals(completedRentals)
                .transactions(transactions)
                .build();
    }

    private PaymentResponse toPaymentResponse(Payment payment, Rental rental) {
        Car car = null;
        if (rental != null && rental.getCarId() != null) {
            car = carRepository.findByCarIdAndDeletedAtIsNull(rental.getCarId()).orElse(null);
        }

        return PaymentResponse.builder()
                .paymentId(payment.getPaymentId())
                .rentalId(payment.getRentalId())
                .amount(payment.getAmount())
                .depositAmount(payment.getAmount())
                .paymentType(payment.getPaymentType())
                .paymentMethod(payment.getPaymentMethod())
                .status(payment.getStatus())
                .transactionCode(payment.getTransactionCode())
                .qrCodeUrl(payment.getQrCodeUrl())
                .paidAt(payment.getPaidAt())
                .createdAt(payment.getCreatedAt())
                .rentalStatus(rental != null ? rental.getStatus() : null)
                .carId(car != null ? car.getCarId() : null)
                .carBrand(car != null ? car.getBrand() : null)
                .carModel(car != null ? car.getModel() : null)
                .plateNumber(car != null ? car.getPlateNumber() : null)
                .thumbnailUrl(car != null ? car.getThumbnailUrl() : null)
                .totalDays(rental != null ? rental.getTotalDays() : null)
                .totalPrice(rental != null ? rental.getTotalPrice() : null)
                .startDate(rental != null ? rental.getStartDate() : null)
                .endDate(rental != null ? rental.getEndDate() : null)
                .bankName("MB Bank (Ngân hàng Quân Đội)")
                .bankAccountNumber(VietQrUtils.getDefaultAccountNo())
                .bankAccountName(VietQrUtils.getDefaultAccountName())
                .build();
    }
}
