/**
 * DriveShare AI Chat Assistant Widget — Sprint 3
 * Integrates with /api/v1/chat endpoint
 * Supports: RAG car search, Car Card rendering, Deposit calculation display
 */
const AiChatWidget = (() => {
  let sessionId = localStorage.getItem("driveshare_ai_session_id");
  if (!sessionId) {
    sessionId = "session_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
    localStorage.setItem("driveshare_ai_session_id", sessionId);
  }

  let isOpen = false;

  function init() {
    renderWidgetHtml();
    attachEvents();
    loadHistory();
  }

  function renderWidgetHtml() {
    const container = document.createElement("div");
    container.id = "driveshare-ai-widget";
    container.innerHTML = `
      <!-- Trigger Floating Button -->
      <button id="ai-chat-trigger" title="Trợ lý AI DriveShare" style="
        position: fixed;
        bottom: 25px;
        right: 25px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, #2563eb, #7c3aed);
        color: white;
        border: none;
        box-shadow: 0 10px 25px -5px rgba(124, 58, 237, 0.5), 0 8px 10px -6px rgba(124, 58, 237, 0.3);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 26px;
        z-index: 9999;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      ">
        <span id="ai-trigger-icon">🤖</span>
      </button>

      <!-- Chat Modal Window -->
      <div id="ai-chat-window" style="
        position: fixed;
        bottom: 95px;
        right: 25px;
        width: 400px;
        height: 560px;
        max-width: calc(100vw - 40px);
        max-height: calc(100vh - 120px);
        background: #ffffff;
        border-radius: 20px;
        box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
        display: none;
        flex-direction: column;
        overflow: hidden;
        z-index: 9999;
        font-family: inherit;
        animation: aiPopIn 0.25s ease-out;
      ">
        <!-- Header -->
        <div style="
          padding: 16px 20px;
          background: linear-gradient(135deg, #1e40af, #6d28d9);
          color: white;
          display: flex;
          align-items: center;
          justify-content: space-between;
        ">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 38px; height: 38px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 20px;">
              ✨
            </div>
            <div>
              <div style="font-weight: 700; font-size: 15px; letter-spacing: -0.2px;">Trợ Lý AI DriveShare</div>
              <div style="font-size: 11px; opacity: 0.85; display: flex; align-items: center; gap: 4px;">
                <span style="width: 6px; height: 6px; border-radius: 50%; background: #10b981; display: inline-block;"></span>
                Tư vấn thuê xe & tài xế 24/7
              </div>
            </div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button id="ai-clear-btn" title="Xóa đoạn chat" style="background: none; border: none; color: white; opacity: 0.75; cursor: pointer; font-size: 15px;">🗑️</button>
            <button id="ai-close-btn" title="Đóng" style="background: none; border: none; color: white; cursor: pointer; font-size: 18px; font-weight: bold;">✕</button>
          </div>
        </div>

        <!-- Suggestions Banner -->
        <div style="padding: 10px 14px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; gap: 6px; overflow-x: auto; white-space: nowrap; scrollbar-width: none;">
          <button class="ai-chip" data-query="Tôi muốn thuê xe 7 chỗ đi Đà Lạt cuối tuần cho gia đình" style="background: white; border: 1px solid #cbd5e1; border-radius: 12px; padding: 4px 10px; font-size: 11px; cursor: pointer; color: #475569;">🏖️ Du lịch gia đình</button>
          <button class="ai-chip" data-query="Gợi ý xe điện VinFast chạy trong nội thành HCM" style="background: white; border: 1px solid #cbd5e1; border-radius: 12px; padding: 4px 10px; font-size: 11px; cursor: pointer; color: #475569;">⚡ Xe điện VinFast</button>
          <button class="ai-chip" data-query="Tìm xe số tự động giá dưới 800k có dịch vụ tài xế" style="background: white; border: 1px solid #cbd5e1; border-radius: 12px; padding: 4px 10px; font-size: 11px; cursor: pointer; color: #475569;">🚘 Xe + Tài xế</button>
          <button class="ai-chip" data-query="Chính sách đặt cọc 30% VietQR như thế nào?" style="background: white; border: 1px solid #cbd5e1; border-radius: 12px; padding: 4px 10px; font-size: 11px; cursor: pointer; color: #475569;">💳 Chính sách cọc</button>
        </div>

        <!-- Messages Area -->
        <div id="ai-messages-box" style="
          flex: 1;
          padding: 16px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: #fdfdfd;
        ">
          <!-- Initial bot greeting -->
          <div style="display: flex; gap: 8px; align-items: flex-start;">
            <div style="width: 28px; height: 28px; border-radius: 50%; background: #ede9fe; color: #7c3aed; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0;">🤖</div>
            <div style="background: #f1f5f9; color: #1e293b; padding: 10px 14px; border-radius: 14px 14px 14px 2px; font-size: 13px; line-height: 1.45; max-width: 82%;">
              Xin chào! Tôi là Trợ lý AI DriveShare 🚗✨<br><br>
              Tôi có thể giúp bạn:<br>
              • Tìm xe thuê theo nhu cầu (du lịch, công tác, xe điện...)<br>
              • Tính chi phí & cọc 30% VietQR<br>
              • Giới thiệu dịch vụ thuê kèm tài xế<br><br>
              Bạn đang muốn tìm xe gì hôm nay?
            </div>
          </div>
        </div>

        <!-- Input Area -->
        <form id="ai-chat-form" style="
          padding: 12px 14px;
          background: white;
          border-top: 1px solid #e2e8f0;
          display: flex;
          gap: 8px;
          align-items: center;
        ">
          <input id="ai-user-input" type="text" placeholder="Nhập câu hỏi của bạn..." autocomplete="off" style="
            flex: 1;
            padding: 10px 14px;
            border: 1px solid #cbd5e1;
            border-radius: 20px;
            font-size: 13px;
            outline: none;
            transition: border-color 0.2s;
          " />
          <button type="submit" id="ai-send-btn" style="
            width: 38px;
            height: 38px;
            border-radius: 50%;
            background: #2563eb;
            color: white;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 15px;
            transition: background 0.2s;
          ">➤</button>
        </form>
      </div>

      <style>
        @keyframes aiPopIn {
          from { opacity: 0; transform: scale(0.92) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes aiCardSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        #ai-chat-trigger:hover { transform: scale(1.08); }
        .ai-chip:hover { background: #eff6ff !important; border-color: #93c5fd !important; color: #1d4ed8 !important; }
        #ai-user-input:focus { border-color: #6366f1; box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15); }
        .ai-car-card { transition: transform 0.2s, box-shadow 0.2s; animation: aiCardSlideIn 0.3s ease-out; }
        .ai-car-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.12) !important; }
        .ai-deposit-box { animation: aiCardSlideIn 0.3s ease-out 0.1s both; }
        .ai-book-btn { transition: background 0.2s, transform 0.1s; }
        .ai-book-btn:hover { background: #1d4ed8 !important; transform: scale(1.02); }
      </style>
    `;
    document.body.appendChild(container);
  }

  function attachEvents() {
    const trigger = document.getElementById("ai-chat-trigger");
    const closeBtn = document.getElementById("ai-close-btn");
    const clearBtn = document.getElementById("ai-clear-btn");
    const form = document.getElementById("ai-chat-form");
    const chips = document.querySelectorAll(".ai-chip");

    trigger.addEventListener("click", toggleChat);
    closeBtn.addEventListener("click", toggleChat);

    clearBtn.addEventListener("click", async () => {
      if (confirm("Bạn có muốn xóa toàn bộ lịch sử trò chuyện này không?")) {
        try {
          const baseUrl = getBaseUrl();
          await fetch(`${baseUrl}/chat/${sessionId}`, {
            method: "DELETE",
            headers: { "Authorization": getAuthHeader() }
          });
        } catch (e) {}
        const box = document.getElementById("ai-messages-box");
        box.innerHTML = `
          <div style="display: flex; gap: 8px; align-items: flex-start;">
            <div style="width: 28px; height: 28px; border-radius: 50%; background: #ede9fe; color: #7c3aed; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0;">🤖</div>
            <div style="background: #f1f5f9; color: #1e293b; padding: 10px 14px; border-radius: 14px 14px 14px 2px; font-size: 13px; line-height: 1.45; max-width: 82%;">
              Đã làm mới cuộc hội thoại! 🔄 Bạn đang cần tìm xe gì hôm nay?
            </div>
          </div>
        `;
      }
    });

    chips.forEach(chip => {
      chip.addEventListener("click", () => {
        const query = chip.getAttribute("data-query");
        document.getElementById("ai-user-input").value = query;
        form.dispatchEvent(new Event("submit"));
      });
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const input = document.getElementById("ai-user-input");
      const text = input.value.trim();
      if (!text) return;

      input.value = "";
      appendMessage("user", text);

      // Loading state
      const loadingId = appendLoading();

      try {
        const baseUrl = getBaseUrl();
        const res = await fetch(`${baseUrl}/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": getAuthHeader()
          },
          body: JSON.stringify({ sessionId, message: text })
        });

        const data = await res.json();
        removeLoading(loadingId);

        if (data.success && data.data) {
          const reply = data.data;
          // 1. Hiển thị tin nhắn văn bản (với Markdown đơn giản)
          if (reply.message) {
            appendMessage("assistant", reply.message);
          }
          // 2. Render Car Cards (Structured Output)
          if (reply.suggestedCars && reply.suggestedCars.length > 0) {
            renderCarCards(reply.suggestedCars);
          }
          // 3. Render Deposit Calculation Box
          if (reply.depositCalculation) {
            renderDepositBox(reply.depositCalculation);
          }
        } else {
          appendMessage("assistant", "Xin lỗi, hiện tại tôi chưa phản hồi được. Vui lòng thử lại sau giây lát!");
        }
      } catch (err) {
        removeLoading(loadingId);
        appendMessage("assistant", "Không thể kết nối đến máy chủ AI. Vui lòng kiểm tra lại backend!");
      }
    });
  }

  // =========================================================================
  // CAR CARD RENDERING (Structured Output → Visual Cards)
  // =========================================================================

  function renderCarCards(cars) {
    const box = document.getElementById("ai-messages-box");
    const cardsContainer = document.createElement("div");
    cardsContainer.style.cssText = "display: flex; flex-direction: column; gap: 10px; padding-left: 36px;";

    cars.forEach((car, index) => {
      const card = document.createElement("div");
      card.className = "ai-car-card";
      card.style.cssText = `
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        cursor: pointer;
        animation-delay: ${index * 0.1}s;
      `;

      const thumbnailHtml = car.thumbnailUrl
        ? `<div style="width: 100%; height: 120px; overflow: hidden;">
             <img src="${escapeHtml(car.thumbnailUrl)}" alt="${escapeHtml(car.name)}"
                  style="width: 100%; height: 100%; object-fit: cover;"
                  onerror="this.parentElement.innerHTML='<div style=\\'width:100%;height:100%;background:#f1f5f9;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:32px;\\'>🚗</div>'" />
           </div>`
        : `<div style="width: 100%; height: 80px; background: linear-gradient(135deg, #eff6ff, #ede9fe); display: flex; align-items: center; justify-content: center; font-size: 36px;">🚗</div>`;

      const ratingStars = car.rating ? `⭐ ${car.rating}` : "⭐ 5.0";
      const ratingCount = car.ratingCount ? `(${car.ratingCount})` : "";

      const driverBadge = car.hasDriverService
        ? `<span style="background: #ecfdf5; color: #059669; padding: 2px 6px; border-radius: 6px; font-size: 10px; font-weight: 600;">🚘 Có tài xế</span>`
        : "";

      card.innerHTML = `
        ${thumbnailHtml}
        <div style="padding: 10px 12px;">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 4px;">
            <div style="font-weight: 700; font-size: 13px; color: #1e293b; line-height: 1.3;">${escapeHtml(car.name || '')}</div>
            ${driverBadge}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">
            ${car.seats || '?'} chỗ • ${escapeHtml(car.transmission || '')} • ${escapeHtml(car.fuelType || '')}
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <div style="font-weight: 700; font-size: 14px; color: #2563eb;">${escapeHtml(car.priceFormatted || '')}<span style="font-weight: 400; font-size: 11px; color: #94a3b8;">/ngày</span></div>
            <div style="font-size: 11px; color: #f59e0b;">${ratingStars} <span style="color: #94a3b8;">${ratingCount}</span></div>
          </div>
          ${car.address ? `<div style="font-size: 11px; color: #64748b; margin-bottom: 8px;">📍 ${escapeHtml(car.address)}</div>` : ''}
          ${car.hasDriverService && car.driverFeeFormatted ? `<div style="font-size: 11px; color: #059669; margin-bottom: 8px;">🚘 Phí tài xế: ${escapeHtml(car.driverFeeFormatted)}/ngày</div>` : ''}
          <a href="${escapeHtml(car.bookingUrl || '#')}" class="ai-book-btn" style="
            display: block;
            text-align: center;
            background: #2563eb;
            color: white;
            padding: 7px 12px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            text-decoration: none;
          ">Xem chi tiết & Đặt xe →</a>
        </div>
      `;

      cardsContainer.appendChild(card);
    });

    box.appendChild(cardsContainer);
    box.scrollTop = box.scrollHeight;
  }

  // =========================================================================
  // DEPOSIT CALCULATION BOX RENDERING
  // =========================================================================

  function renderDepositBox(deposit) {
    const box = document.getElementById("ai-messages-box");
    const depositDiv = document.createElement("div");
    depositDiv.className = "ai-deposit-box";
    depositDiv.style.cssText = "padding-left: 36px;";

    let driverRow = "";
    if (deposit.withDriver && deposit.totalDriverFee > 0) {
      driverRow = `
        <div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; color: #475569;">
          <span>👨‍✈️ Phí tài xế (${deposit.rentalDays} ngày)</span>
          <span>${escapeHtml(formatVND(deposit.totalDriverFee))}</span>
        </div>
      `;
    }

    depositDiv.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
        border: 1px solid #bbf7d0;
        border-radius: 14px;
        padding: 14px;
        margin-top: 4px;
      ">
        <div style="font-weight: 700; font-size: 13px; color: #166534; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
          💳 Bảng tính chi phí
        </div>
        <div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; color: #475569;">
          <span>🚗 ${escapeHtml(deposit.carName || '')} × ${deposit.rentalDays || 0} ngày</span>
          <span>${escapeHtml(formatVND(deposit.totalRentalFee))}</span>
        </div>
        ${driverRow}
        <div style="border-top: 1px dashed #d1d5db; margin: 6px 0;"></div>
        <div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; font-weight: 700; color: #1e293b;">
          <span>Tổng cộng</span>
          <span>${escapeHtml(deposit.grandTotalFormatted || '')}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; font-weight: 700; color: #2563eb;">
          <span>💳 Đặt cọc 30% VietQR</span>
          <span>${escapeHtml(deposit.depositFormatted || '')}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; color: #64748b;">
          <span>Còn lại khi nhận xe</span>
          <span>${escapeHtml(deposit.remainingFormatted || '')}</span>
        </div>
      </div>
    `;

    box.appendChild(depositDiv);
    box.scrollTop = box.scrollHeight;
  }

  // =========================================================================
  // CORE CHAT FUNCTIONS
  // =========================================================================

  function toggleChat() {
    isOpen = !isOpen;
    const win = document.getElementById("ai-chat-window");
    const icon = document.getElementById("ai-trigger-icon");
    win.style.display = isOpen ? "flex" : "none";
    icon.textContent = isOpen ? "✕" : "🤖";
    if (isOpen) {
      document.getElementById("ai-user-input").focus();
    }
  }

  function appendMessage(role, text) {
    const box = document.getElementById("ai-messages-box");
    const isUser = role === "user" || role === "USER";

    const msgDiv = document.createElement("div");
    msgDiv.style.cssText = isUser
      ? "display: flex; justify-content: flex-end;"
      : "display: flex; gap: 8px; align-items: flex-start;";

    if (isUser) {
      msgDiv.innerHTML = `
        <div style="background: linear-gradient(135deg, #2563eb, #4f46e5); color: white; padding: 10px 14px; border-radius: 14px 14px 2px 14px; font-size: 13px; line-height: 1.45; max-width: 82%; word-break: break-word;">
          ${escapeHtml(text)}
        </div>
      `;
    } else {
      // Render markdown-like formatting for assistant messages
      msgDiv.innerHTML = `
        <div style="width: 28px; height: 28px; border-radius: 50%; background: #ede9fe; color: #7c3aed; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0;">🤖</div>
        <div style="background: #f1f5f9; color: #1e293b; padding: 10px 14px; border-radius: 14px 14px 14px 2px; font-size: 13px; line-height: 1.55; max-width: 82%; word-break: break-word;">
          ${renderSimpleMarkdown(text)}
        </div>
      `;
    }

    box.appendChild(msgDiv);
    box.scrollTop = box.scrollHeight;
  }

  function appendLoading() {
    const box = document.getElementById("ai-messages-box");
    const id = "loading-" + Date.now();
    const div = document.createElement("div");
    div.id = id;
    div.style.cssText = "display: flex; gap: 8px; align-items: flex-start;";
    div.innerHTML = `
      <div style="width: 28px; height: 28px; border-radius: 50%; background: #ede9fe; color: #7c3aed; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0;">🤖</div>
      <div style="background: #f1f5f9; color: #64748b; padding: 10px 14px; border-radius: 14px 14px 14px 2px; font-size: 13px;">
        <span style="display: inline-flex; gap: 4px;">
          <span style="animation: aiDot 1.4s infinite 0s;">●</span>
          <span style="animation: aiDot 1.4s infinite 0.2s;">●</span>
          <span style="animation: aiDot 1.4s infinite 0.4s;">●</span>
        </span>
        Đang tìm kiếm xe phù hợp...
      </div>
    `;

    // Add dot animation style if not exists
    if (!document.getElementById("ai-dot-style")) {
      const style = document.createElement("style");
      style.id = "ai-dot-style";
      style.textContent = `@keyframes aiDot { 0%, 60%, 100% { opacity: 0.3; } 30% { opacity: 1; } }`;
      document.head.appendChild(style);
    }

    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
    return id;
  }

  function removeLoading(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  async function loadHistory() {
    try {
      const baseUrl = getBaseUrl();
      const res = await fetch(`${baseUrl}/chat/${sessionId}/history`, {
        headers: { "Authorization": getAuthHeader() }
      });
      const data = await res.json();
      if (data.success && data.data && data.data.messages && data.data.messages.length > 0) {
        const box = document.getElementById("ai-messages-box");
        box.innerHTML = "";
        data.data.messages.forEach(m => appendMessage(m.role, m.content || m.text));
      }
    } catch (e) {}
  }

  // =========================================================================
  // UTILITY FUNCTIONS
  // =========================================================================

  function getBaseUrl() {
    return (typeof API_CONFIG !== 'undefined' && API_CONFIG.BASE_URL) ? API_CONFIG.BASE_URL : 'http://localhost:8080/api/v1';
  }

  function getAuthHeader() {
    return localStorage.getItem("token") ? `Bearer ${localStorage.getItem("token")}` : "";
  }

  /**
   * Render simple Markdown: **bold**, \n → <br>, • bullet points
   */
  function renderSimpleMarkdown(text) {
    return escapeHtml(text)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>')
      .replace(/^• /gm, '&bull; ');
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatVND(amount) {
    if (amount == null) return "—";
    return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", () => {
  AiChatWidget.init();
});
