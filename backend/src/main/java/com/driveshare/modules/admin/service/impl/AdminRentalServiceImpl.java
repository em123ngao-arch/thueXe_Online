package com.driveshare.modules.admin.service.impl;

import com.driveshare.common.enums.EInspectionType;
import com.driveshare.common.enums.ERentalStatus;
import com.driveshare.common.exception.AppException;
import com.driveshare.common.exception.ErrorCode;
import com.driveshare.modules.admin.dto.response.OverdueRentalResponse;
import com.driveshare.modules.admin.dto.response.ViolationDossierResponse;
import com.driveshare.modules.admin.service.AdminRentalService;
import com.driveshare.modules.car.adapter.out.persistence.Car;
import com.driveshare.modules.car.repository.CarRepository;
import com.driveshare.modules.payment.adapter.out.persistence.Payment;
import com.driveshare.modules.payment.repository.PaymentRepository;
import com.driveshare.modules.rental.adapter.out.persistence.Rental;
import com.driveshare.modules.rental.adapter.out.persistence.RentalInspection;
import com.driveshare.modules.rental.repository.RentalInspectionRepository;
import com.driveshare.modules.rental.repository.RentalRepository;
import com.driveshare.modules.user.adapter.out.persistence.OwnerProfile;
import com.driveshare.modules.user.adapter.out.persistence.RenterProfile;
import com.driveshare.modules.user.adapter.out.persistence.User;
import com.driveshare.modules.user.repository.OwnerProfileRepository;
import com.driveshare.modules.user.repository.RenterProfileRepository;
import com.driveshare.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminRentalServiceImpl implements AdminRentalService {

    private final RentalRepository rentalRepository;
    private final CarRepository carRepository;
    private final UserRepository userRepository;
    private final RenterProfileRepository renterProfileRepository;
    private final OwnerProfileRepository ownerProfileRepository;
    private final PaymentRepository paymentRepository;
    private final RentalInspectionRepository rentalInspectionRepository;

    @Override
    @Transactional(readOnly = true)
    public List<OverdueRentalResponse> getOverdueRentals() {
        List<Rental> rentals = rentalRepository.findByStatusOrderByCreatedAtDesc(ERentalStatus.OVERDUE);

        return rentals.stream().map(r -> {
            Car car = carRepository.findById(r.getCarId()).orElse(null);
            String carPlate = car != null ? car.getPlateNumber() : "N/A";
            String carBrand = car != null ? car.getBrand() : "";
            String carModel = car != null ? car.getModel() : "";
            String carName = (carBrand + " " + carModel).trim();
            if (carName.isEmpty()) carName = "Xe #" + r.getCarId();

            User renter = userRepository.findById(r.getRenterId()).orElse(null);
            String renterName = renter != null ? (renter.getFullName() != null ? renter.getFullName() : renter.getUsername()) : "Khách #" + r.getRenterId();
            String renterPhone = renter != null && renter.getPhone() != null ? renter.getPhone() : "N/A";
            String renterEmail = renter != null ? renter.getEmail() : "N/A";
            String renterIdCard = renter != null && renter.getIdCardNumber() != null ? renter.getIdCardNumber() : "N/A";

            Long ownerId = car != null ? car.getOwnerId() : null;
            String ownerName = "Chủ xe #" + ownerId;
            String ownerPhone = "N/A";
            if (ownerId != null) {
                User owner = userRepository.findById(ownerId).orElse(null);
                if (owner != null) {
                    ownerName = owner.getFullName() != null ? owner.getFullName() : owner.getUsername();
                    ownerPhone = owner.getPhone() != null ? owner.getPhone() : "N/A";
                }
            }

            int overdueHours = calculateOverdueHours(r);
            BigDecimal penaltyFee = calculatePenaltyFee(r, overdueHours);

            return OverdueRentalResponse.builder()
                    .rentalId(r.getRentalId())
                    .carId(r.getCarId())
                    .carPlate(carPlate)
                    .carBrand(carBrand)
                    .carModel(carModel)
                    .carName(carName)
                    .renterId(r.getRenterId())
                    .renterName(renterName)
                    .renterPhone(renterPhone)
                    .renterEmail(renterEmail)
                    .renterIdCard(renterIdCard)
                    .ownerId(ownerId)
                    .ownerName(ownerName)
                    .ownerPhone(ownerPhone)
                    .startDate(r.getStartDate())
                    .endDate(r.getEndDate())
                    .overdueHours(overdueHours)
                    .penaltyFee(penaltyFee)
                    .pricePerDay(r.getPricePerDay())
                    .totalPrice(r.getTotalPrice())
                    .depositAmount(r.getDepositAmount())
                    .status(r.getStatus())
                    .isBlacklistedTriggered(Boolean.TRUE.equals(r.getIsBlacklistedTriggered()))
                    .createdAt(r.getCreatedAt())
                    .build();
        }).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ViolationDossierResponse getViolationDossier(Long rentalId) {
        Rental rental = rentalRepository.findById(rentalId)
                .orElseThrow(() -> new AppException(ErrorCode.RENTAL_NOT_FOUND));

        Car car = carRepository.findById(rental.getCarId()).orElse(null);
        User renter = userRepository.findById(rental.getRenterId()).orElse(null);
        RenterProfile renterProfile = renterProfileRepository.findById(rental.getRenterId()).orElse(null);

        Long ownerId = car != null ? car.getOwnerId() : null;
        User owner = ownerId != null ? userRepository.findById(ownerId).orElse(null) : null;
        OwnerProfile ownerProfile = ownerId != null ? ownerProfileRepository.findById(ownerId).orElse(null) : null;

        Payment payment = paymentRepository.findByRentalId(rentalId).orElse(null);
        List<RentalInspection> inspections = rentalInspectionRepository.findByRentalIdOrderByCreatedAtAsc(rentalId);
        RentalInspection checkIn = inspections.stream()
                .filter(i -> i.getInspectionType() == EInspectionType.CHECK_IN)
                .findFirst()
                .orElse(null);

        int overdueHours = calculateOverdueHours(rental);
        BigDecimal penaltyFee = calculatePenaltyFee(rental, overdueHours);

        // 1. Renter Info
        ViolationDossierResponse.RenterInfo renterInfo = ViolationDossierResponse.RenterInfo.builder()
                .renterId(rental.getRenterId())
                .fullName(renter != null ? renter.getFullName() : null)
                .phone(renter != null ? renter.getPhone() : null)
                .email(renter != null ? renter.getEmail() : null)
                .idCardNumber(renter != null ? renter.getIdCardNumber() : null)
                .idCardFrontUrl(renterProfile != null ? renterProfile.getIdCardFrontUrl() : null)
                .idCardBackUrl(renterProfile != null ? renterProfile.getIdCardBackUrl() : null)
                .licenseNumber(renterProfile != null ? renterProfile.getLicenseNumber() : null)
                .licenseFullName(renterProfile != null ? renterProfile.getLicenseFullName() : null)
                .licenseFrontUrl(renterProfile != null ? renterProfile.getLicenseFrontUrl() : null)
                .licenseBackUrl(renterProfile != null ? renterProfile.getLicenseBackUrl() : null)
                .address(renter != null ? renter.getAddress() : null)
                .userStatus(renter != null && renter.getStatus() != null ? renter.getStatus().name() : null)
                .build();

        // 2. Car Info
        String chassisNumber = "VN-CHASSIS-" + (car != null && car.getPlateNumber() != null
                ? car.getPlateNumber().replaceAll("[^a-zA-Z0-9]", "")
                : "NA");
        ViolationDossierResponse.CarInfo carInfo = ViolationDossierResponse.CarInfo.builder()
                .carId(rental.getCarId())
                .plateNumber(car != null ? car.getPlateNumber() : null)
                .brand(car != null ? car.getBrand() : null)
                .model(car != null ? car.getModel() : null)
                .year(car != null ? car.getYear() : null)
                .color(car != null ? car.getColor() : null)
                .seats(car != null ? car.getSeats() : null)
                .chassisNumber(chassisNumber)
                .address(car != null ? car.getAddress() : null)
                .build();

        // 3. Owner Info
        ViolationDossierResponse.OwnerInfo ownerInfo = ViolationDossierResponse.OwnerInfo.builder()
                .ownerId(ownerId)
                .fullName(owner != null ? owner.getFullName() : null)
                .phone(owner != null ? owner.getPhone() : null)
                .email(owner != null ? owner.getEmail() : null)
                .idCardNumber(owner != null ? owner.getIdCardNumber() : null)
                .idCardFrontUrl(ownerProfile != null ? ownerProfile.getIdCardFrontUrl() : null)
                .idCardBackUrl(ownerProfile != null ? ownerProfile.getIdCardBackUrl() : null)
                .bankName(ownerProfile != null ? ownerProfile.getBankName() : null)
                .bankAccountNumber(ownerProfile != null ? ownerProfile.getBankAccountNumber() : null)
                .address(owner != null ? owner.getAddress() : null)
                .build();

        // 4. Deposit Payment Info
        ViolationDossierResponse.DepositPaymentInfo depositInfo = ViolationDossierResponse.DepositPaymentInfo.builder()
                .paymentId(payment != null ? payment.getPaymentId() : null)
                .amount(payment != null ? payment.getAmount() : rental.getDepositAmount())
                .paymentMethod(payment != null && payment.getPaymentMethod() != null ? payment.getPaymentMethod().name() : "VIETQR")
                .status(payment != null && payment.getStatus() != null ? payment.getStatus().name() : "SUCCESS")
                .transactionCode(payment != null ? payment.getTransactionCode() : null)
                .qrCodeUrl(payment != null ? payment.getQrCodeUrl() : null)
                .paidAt(payment != null ? payment.getPaidAt() : null)
                .build();

        // 5. Electronic Contract
        ViolationDossierResponse.ElectronicContractInfo contractInfo = ViolationDossierResponse.ElectronicContractInfo.builder()
                .contractCode("HDDT-" + rental.getRentalId() + "-" + rental.getStartDate())
                .termsAndConditions("Hợp đồng điện tử DriveShare cam kết bàn giao xe đúng hạn, đúng thỏa thuận. Khách thuê có nghĩa vụ hoàn trả phương tiện đúng giờ cam kết.")
                .criminalLiabilityNotice("Cảnh báo chế tài hình sự: Khách thuê chậm trả xe quá 24 giờ mà không có sự thỏa thuận với Chủ xe và Nền tảng sẽ bị chuyển hồ sơ sang Cơ quan Cảnh sát Điều tra để truy cứu trách nhiệm hình sự theo Điều 175 Bộ luật Hình sự (Tội lạm dụng tín nhiệm chiếm đoạt tài sản).")
                .signedAt(rental.getCreatedAt())
                .build();

        // 6. Check-in Inspection Info
        List<String> inspectionImages = new ArrayList<>();
        if (checkIn != null && checkIn.getImages() != null && !checkIn.getImages().isBlank()) {
            inspectionImages = Arrays.stream(checkIn.getImages().split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList();
        }

        ViolationDossierResponse.CheckInInspectionInfo checkInInfo = null;
        if (checkIn != null) {
            String performerName = checkIn.getPerformer() != null ? checkIn.getPerformer().getFullName() : "Chủ xe / Quản trị viên";
            checkInInfo = ViolationDossierResponse.CheckInInspectionInfo.builder()
                    .inspectionId(checkIn.getInspectionId())
                    .odoMeter(checkIn.getOdoMeter())
                    .fuelLevel(checkIn.getFuelLevel())
                    .notes(checkIn.getNotes())
                    .images(inspectionImages)
                    .checkedInAt(checkIn.getCreatedAt())
                    .performedByName(performerName)
                    .build();
        }

        return ViolationDossierResponse.builder()
                .dossierCode("HSPL-RENTAL-" + rental.getRentalId())
                .generatedAt(Instant.now())
                .legalNotice("Hồ sơ vi phạm chiếm dụng phương tiện giao thông đường bộ theo Điều 175 Bộ luật Hình sự (Tội lạm dụng tín nhiệm chiếm đoạt tài sản) được trích xuất từ hệ thống DriveShare phục vụ bàn giao Cơ quan Cảnh sát Điều tra và Công ty Bảo hiểm.")
                .rentalId(rental.getRentalId())
                .status(rental.getStatus())
                .startDate(rental.getStartDate())
                .endDate(rental.getEndDate())
                .overdueHours(overdueHours)
                .penaltyFee(penaltyFee)
                .pricePerDay(rental.getPricePerDay())
                .totalPrice(rental.getTotalPrice())
                .depositAmount(rental.getDepositAmount())
                .isBlacklistedTriggered(Boolean.TRUE.equals(rental.getIsBlacklistedTriggered()))
                .renter(renterInfo)
                .car(carInfo)
                .owner(ownerInfo)
                .depositPayment(depositInfo)
                .contract(contractInfo)
                .checkInInspection(checkInInfo)
                .build();
    }

    private int calculateOverdueHours(Rental r) {
        if (r.getOverdueHours() != null && r.getOverdueHours() > 0) {
            return r.getOverdueHours();
        }
        if (r.getEndDate() != null && r.getEndDate().isBefore(LocalDate.now())) {
            long days = ChronoUnit.DAYS.between(r.getEndDate(), LocalDate.now());
            if (days <= 0) days = 1;
            return (int) (days * 24);
        }
        return 0;
    }

    private BigDecimal calculatePenaltyFee(Rental r, int overdueHours) {
        if (r.getPenaltyFee() != null && r.getPenaltyFee().compareTo(BigDecimal.ZERO) > 0) {
            return r.getPenaltyFee();
        }
        BigDecimal dailyPrice = r.getPricePerDay() != null ? r.getPricePerDay() : BigDecimal.ZERO;
        long days = overdueHours / 24;
        if (days <= 0) days = 1;
        return dailyPrice.multiply(BigDecimal.valueOf(1.5)).multiply(BigDecimal.valueOf(days));
    }
}
