package com.driveshare.modules.payment.util;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

public final class VietQrUtils {

    private static final String DEFAULT_BANK_ID = "MB";
    private static final String DEFAULT_ACCOUNT_NO = "090123456789";
    private static final String DEFAULT_ACCOUNT_NAME = "DRIVESHARE CORP";

    private VietQrUtils() {}

    /**
     * Sinh URL mã VietQR chuẩn VietQR.io
     *
     * @param bankId        Mã ngân hàng (ví dụ: MB, ICB, VCB)
     * @param accountNo     Số tài khoản ngân hàng thụ hưởng
     * @param accountName   Tên chủ tài khoản
     * @param amount        Số tiền giao dịch (VND)
     * @param memo          Nội dung chuyển khoản (chứa mã giao dịch)
     * @return URL hình ảnh QR code
     */
    public static String generateQrUrl(String bankId, String accountNo, String accountName, long amount, String memo) {
        String bank = (bankId != null && !bankId.isBlank()) ? bankId.trim() : DEFAULT_BANK_ID;
        String accNo = (accountNo != null && !accountNo.isBlank()) ? accountNo.trim() : DEFAULT_ACCOUNT_NO;
        String accName = (accountName != null && !accountName.isBlank()) ? accountName.trim() : DEFAULT_ACCOUNT_NAME;
        String safeMemo = (memo != null) ? memo.trim() : "DRIVESHARE";

        String encodedAddInfo = URLEncoder.encode(safeMemo, StandardCharsets.UTF_8);
        String encodedAccName = URLEncoder.encode(accName, StandardCharsets.UTF_8);

        return String.format(
                "https://img.vietqr.io/image/%s-%s-compact2.png?amount=%d&addInfo=%s&accountName=%s",
                bank, accNo, Math.max(0, amount), encodedAddInfo, encodedAccName
        );
    }

    public static String getDefaultBankId() {
        return DEFAULT_BANK_ID;
    }

    public static String getDefaultAccountNo() {
        return DEFAULT_ACCOUNT_NO;
    }

    public static String getDefaultAccountName() {
        return DEFAULT_ACCOUNT_NAME;
    }
}
