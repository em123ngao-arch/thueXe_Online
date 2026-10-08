/**
 * DriveShare AI Chat Assistant Widget (Sprint 3)
 * Integrates with /api/v1/chat endpoint powered by Spring AI
 * Supports Interactive Mini Car Cards (Issue #28)
 */
const AiChatWidget = (() => {
  let sessionId = localStorage.getItem("driveshare_ai_session_id");
  if (!sessionId) {
    sessionId = "session_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
    localStorage.setItem("driveshare_ai_session_id", sessionId);
  }

  let isOpen = false;

  const FEATURED_CARS = [
    {
      id: 1,
      name: "VinFast VF8 Plus 2024",
      brand: "VinFast",
      seats: 5,
      transmission: "Tự động",
      fuelType: "Điện",
      price: 1100000,
      rating: 4.9,
      hasDriver: true,
      image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80",
      tags: ["vinfast", "vf8", "dien", "thong minh", "5 cho"]
    },
    {
      id: 2,
      name: "Toyota Fortuner Legender 2023",
      brand: "Toyota",
      seats: 7,
      transmission: "Tự động",
      fuelType: "Dầu",
      price: 1350000,
      rating: 5.0,
      hasDriver: true,
      image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=600&q=80",
      tags: ["7 cho", "fortuner", "toyota", "da lat", "suv", "gia dinh"]
    },
    {
      id: 3,
      name: "Mitsubishi Xpander Premium",
      brand: "Mitsubishi",
      seats: 7,
      transmission: "Tự động",
      fuelType: "Xăng",
      price: 850000,
      rating: 4.8,
      hasDriver: true,
      image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&q=80",
      tags: ["7 cho", "xpander", "mitsubishi", "da lat", "tiet kiem", "gia dinh"]
    },
    {
      id: 4,
      name: "Hyundai Accent 1.4 AT",
      brand: "Hyundai",
      seats: 5,
      transmission: "Tự động",
      fuelType: "Xăng",
      price: 650000,
      rating: 4.9,
      hasDriver: false,
      image: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=600&q=80",
      tags: ["accent", "hyundai", "gia re", "800k", "tiet kiem", "sedan", "5 cho"]
    },
    {
      id: 5,
      name: "VinFast VF e34",
      brand: "VinFast",
      seats: 5,
      transmission: "Tự động",
      fuelType: "Điện",
      price: 750000,
      rating: 4.8,
      hasDriver: false,
      image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=600&q=80",
      tags: ["vinfast", "e34", "dien", "noi thanh", "tiet kiem", "5 cho"]
    }
  ];

  function formatCurrency(amount) {
    if (typeof FormatUtils !== 'undefined' && FormatUtils.formatCurrency) {
      return FormatUtils.formatCurrency(amount);
    }
    return new Intl.NumberFormat('vi-VN').format(amount || 0) + ' đ';
  }

  function getMatchingCars(query = "") {
    let localCars = [];
    try {
      if (typeof StorageService !== 'undefined' && StorageService.getCars) {
        localCars = StorageService.getCars() || [];
      }
    } catch (_) {}

    const mappedLocal = localCars.map(c => ({
      id: c.id,
      name: c.model || c.name || `${c.brand || ''} ${c.model || ''}`,
      brand: c.brand || '',
      seats: c.seats || c.seatCapacity || 5,
      transmission: c.transmission === 'MANUAL' ? 'Số sàn' : 'Tự động',
      fuelType: c.fuelType === 'ELECTRIC' ? 'Điện' : (c.fuelType === 'DIESEL' ? 'Dầu' : 'Xăng'),
      price: c.pricePerDay || c.price_per_day || c.price || 800000,
      rating: c.rating || c.averageRating || 4.9,
      hasDriver: Boolean(c.has_driver_service || c.hasDriverService),
      image: c.thumb || c.mainImageUrl || c.image || (c.images && c.images[0]) || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80',
      tags: [(c.brand || '').toLowerCase(), (c.model || '').toLowerCase(), `${c.seats || 5} cho`]
    }));

    const pool = [...FEATURED_CARS, ...mappedLocal];
    const seen = new Set();
    const uniquePool = pool.filter(c => {
      const key = (c.name || '').toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const q = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    if (q.includes("7 cho") || q.includes("da lat") || q.includes("gia dinh")) {
      return uniquePool.filter(c => c.seats >= 7).slice(0, 2);
    }
    if (q.includes("vinfast") || q.includes("dien") || q.includes("noi thanh")) {
      return uniquePool.filter(c => c.fuelType === 'Điện' || (c.brand && c.brand.toLowerCase().includes('vinfast'))).slice(0, 2);
    }
    if (q.includes("re") || q.includes("800") || q.includes("tiet kiem")) {
      return uniquePool.filter(c => c.price <= 850000).slice(0, 2);
    }
    if (q.includes("xe") || q.includes("thue") || q.includes("tim") || q.includes("chuyen") || q.includes("goi y")) {
      return uniquePool.slice(0, 2);
    }
    return [];
  }

  function init() {
    renderWidgetHtml();
    attachEvents();
    loadHistory();
  }

  function renderWidgetHtml() {
    if (document.getElementById("driveshare-ai-widget")) return;

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
        width: 390px;
        height: 560px;
        max-width: calc(100vw - 32px);
        max-height: calc(100vh - 120px);
        background: #ffffff;
        border-radius: 20px;
        box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.06);
        display: none;
        flex-direction: column;
        overflow: hidden;
        z-index: 9999;
        font-family: inherit;
        animation: aiPopIn 0.25s ease-out;
      ">
        <!-- Header -->
        <div style="
          padding: 14px 18px;
          background: linear-gradient(135deg, #1e40af, #6d28d9);
          color: white;
          display: flex;
          align-items: center;
          justify-content: space-between;
        ">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 19px;">
              ✨
            </div>
            <div>
              <div style="font-weight: 700; font-size: 15px; letter-spacing: -0.2px;">Trợ Lý AI DriveShare</div>
              <div style="font-size: 11px; opacity: 0.9; display: flex; align-items: center; gap: 4px;">
                <span style="width: 6px; height: 6px; border-radius: 50%; background: #10b981; display: inline-block;"></span>
                Gợi ý xe & tính giá tự động
              </div>
            </div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button id="ai-clear-btn" title="Xóa đoạn chat" style="background: none; border: none; color: white; opacity: 0.8; cursor: pointer; font-size: 15px; padding: 4px;">🗑️</button>
            <button id="ai-close-btn" title="Đóng" style="background: none; border: none; color: white; cursor: pointer; font-size: 18px; font-weight: bold; padding: 4px;">✕</button>
          </div>
        </div>

        <!-- Suggestions Banner -->
        <div style="padding: 10px 14px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; gap: 6px; overflow-x: auto; white-space: nowrap; scrollbar-width: none;">
          <button class="ai-chip" data-query="Tôi muốn thuê xe 7 chỗ đi Đà Lạt cuối tuần" style="background: white; border: 1px solid #cbd5e1; border-radius: 12px; padding: 5px 11px; font-size: 11px; cursor: pointer; color: #475569; font-weight: 600;">🚗 Xe 7 chỗ đi chơi</button>
          <button class="ai-chip" data-query="Gợi ý xe điện VinFast chạy trong nội thành" style="background: white; border: 1px solid #cbd5e1; border-radius: 12px; padding: 5px 11px; font-size: 11px; cursor: pointer; color: #475569; font-weight: 600;">⚡ Xe điện VinFast</button>
          <button class="ai-chip" data-query="Tìm xe số tự động giá rẻ dưới 800k một ngày" style="background: white; border: 1px solid #cbd5e1; border-radius: 12px; padding: 5px 11px; font-size: 11px; cursor: pointer; color: #475569; font-weight: 600;">💰 Xe tiết kiệm &lt;800k</button>
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
            <div style="background: #f1f5f9; color: #1e293b; padding: 10px 14px; border-radius: 14px 14px 14px 2px; font-size: 13px; line-height: 1.45; max-width: 85%;">
              Xin chào! Tôi là Trợ lý AI DriveShare. Bạn đang tìm xe đi đâu, bao nhiêu chỗ ngồi hoặc cần xe kèm tài xế không? Hãy cho tôi biết nhé!
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
          <input id="ai-user-input" type="text" placeholder="Nhập câu hỏi (VD: xe 7 chỗ, VinFast, kèm tài...)" autocomplete="off" style="
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
        #ai-chat-trigger:hover { transform: scale(1.08); }
        .ai-chip:hover { background: #eff6ff !important; border-color: #93c5fd !important; color: #1d4ed8 !important; }
        #ai-user-input:focus { border-color: #6366f1; box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15); }
        .ai-car-card { transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
        .ai-car-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12) !important; }
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

    if (trigger) trigger.addEventListener("click", toggleChat);
    if (closeBtn) closeBtn.addEventListener("click", toggleChat);

    if (clearBtn) {
      clearBtn.addEventListener("click", async () => {
        if (confirm("Bạn có muốn xóa toàn bộ lịch sử trò chuyện này không?")) {
          try {
            await fetch(`/api/v1/chat/${sessionId}`, { method: "DELETE" });
          } catch (e) {}
          const box = document.getElementById("ai-messages-box");
          box.innerHTML = `
            <div style="display: flex; gap: 8px; align-items: flex-start;">
              <div style="width: 28px; height: 28px; border-radius: 50%; background: #ede9fe; color: #7c3aed; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0;">🤖</div>
              <div style="background: #f1f5f9; color: #1e293b; padding: 10px 14px; border-radius: 14px 14px 14px 2px; font-size: 13px; line-height: 1.45; max-width: 85%;">
                Đã làm mới cuộc hội thoại! Bạn đang cần tìm xe gì hôm nay?
              </div>
            </div>
          `;
        }
      });
    }

    chips.forEach(chip => {
      chip.addEventListener("click", () => {
        const query = chip.getAttribute("data-query");
        const input = document.getElementById("ai-user-input");
        if (input) {
          input.value = query;
          form.dispatchEvent(new Event("submit"));
        }
      });
    });

    if (form) {
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
          const baseUrl = (typeof API_CONFIG !== 'undefined' && API_CONFIG.BASE_URL) ? API_CONFIG.BASE_URL : 'http://localhost:8080/api/v1';
          const res = await fetch(`${baseUrl}/chat`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": localStorage.getItem("token") ? `Bearer ${localStorage.getItem("token")}` : ""
            },
            body: JSON.stringify({ sessionId, message: text })
          });

          const data = await res.json();
          removeLoading(loadingId);

          let replyText = "";
          let suggestedCars = [];

          if (data && data.success && data.data) {
            replyText = data.data.message || data.data.reply || data.data.text || "Dưới đây là các gợi ý xe tốt nhất:";
            suggestedCars = data.data.suggested_cars || data.data.cars || data.data.cars_suggested || [];
          } else if (data && data.data && data.data.message) {
            replyText = data.data.message;
            suggestedCars = data.data.suggested_cars || data.data.cars || [];
          } else {
            replyText = "Dưới đây là một số dòng xe nổi bật phù hợp với yêu cầu của bạn:";
          }

          if (!suggestedCars || suggestedCars.length === 0) {
            suggestedCars = getMatchingCars(text + " " + replyText);
          }

          appendMessage("assistant", replyText, suggestedCars);
        } catch (err) {
          removeLoading(loadingId);
          // Thông minh gợi ý xe kể cả khi offline
          let fallbackReply = `Tôi đã tìm thấy những dòng xe phù hợp nhất với yêu cầu "${text}" của bạn:`;
          const matchingCars = getMatchingCars(text);
          appendMessage("assistant", fallbackReply, matchingCars.length > 0 ? matchingCars : FEATURED_CARS.slice(0, 2));
        }
      });
    }
  }

  function toggleChat() {
    isOpen = !isOpen;
    const win = document.getElementById("ai-chat-window");
    const icon = document.getElementById("ai-trigger-icon");
    if (!win) return;
    win.style.display = isOpen ? "flex" : "none";
    if (icon) icon.textContent = isOpen ? "✕" : "🤖";
    if (isOpen) {
      const input = document.getElementById("ai-user-input");
      if (input) input.focus();
    }
  }

  /**
   * Render tin nhắn kèm thẻ xe sinh động (Car Card)
   */
  function appendMessage(role, text, suggestedCars = []) {
    const box = document.getElementById("ai-messages-box");
    if (!box) return;

    const isUser = role === "user" || role === "USER";
    const msgDiv = document.createElement("div");
    msgDiv.style.cssText = isUser
      ? "display: flex; justify-content: flex-end;"
      : "display: flex; gap: 8px; align-items: flex-start;";

    let cardsHtml = "";
    if (!isUser && Array.isArray(suggestedCars) && suggestedCars.length > 0) {
      cardsHtml = suggestedCars.map(c => {
        const carId = c.id || c.carId;
        const carName = c.name || c.model || `${c.brand || ''} ${c.model || ''}`;
        const carImg = c.image || c.thumb || c.mainImageUrl || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80';
        const carPrice = c.price || c.pricePerDay || c.price_per_day || 800000;
        const carRating = c.rating || c.averageRating || '4.9';
        const seats = c.seats || c.seatCapacity || 5;
        const trans = c.transmission === 'MANUAL' ? 'Số sàn' : (c.transmission || 'Tự động');
        const fuel = c.fuelType === 'ELECTRIC' ? 'Điện' : (c.fuelType === 'DIESEL' ? 'Dầu' : (c.fuelType || 'Xăng'));
        const hasDriver = Boolean(c.hasDriver || c.has_driver_service || c.hasDriverService);

        return `
          <div class="ai-car-card" style="
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            overflow: hidden;
            box-shadow: 0 4px 14px rgba(15, 23, 42, 0.08);
            margin-top: 8px;
            display: flex;
            flex-direction: column;
          ">
            <div style="position: relative; height: 115px; background: #e2e8f0; overflow: hidden;">
              <img src="${carImg}" alt="${escapeHtml(carName)}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80'" />
              <span style="position: absolute; top: 6px; left: 6px; background: rgba(15,23,42,0.82); color: #fbbf24; font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 6px; backdrop-filter: blur(4px); display: flex; align-items: center; gap: 3px;">
                ⭐ <span>${carRating}</span>
              </span>
              ${hasDriver ? `<span style="position: absolute; top: 6px; right: 6px; background: #059669; color: white; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">Có tài xế</span>` : ''}
            </div>
            <div style="padding: 10px 12px;">
              <div style="font-weight: 700; font-size: 13px; color: #0f172a; margin-bottom: 3px; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${escapeHtml(carName)}
              </div>
              <div style="display: flex; align-items: center; gap: 6px; font-size: 11px; color: #64748b; margin-bottom: 8px;">
                <span>💺 ${seats} chỗ</span>
                <span>•</span>
                <span>⚙️ ${trans}</span>
                <span>•</span>
                <span>⛽ ${fuel}</span>
              </div>
              <div style="display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px dashed #e2e8f0;">
                <span style="font-size: 11px; color: #64748b;">Giá thuê:</span>
                <div>
                  <span style="color: #00a550; font-weight: 800; font-size: 13.5px;">${formatCurrency(carPrice)}</span>
                  <span style="font-size: 10.5px; color: #94a3b8;">/ngày</span>
                </div>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                <button onclick="AiChatWidget.viewCarDetail(${carId})" style="
                  padding: 6px 4px;
                  background: #f1f5f9;
                  color: #334155;
                  border: 1px solid #cbd5e1;
                  border-radius: 6px;
                  font-size: 11px;
                  font-weight: 600;
                  cursor: pointer;
                  transition: all 0.15s;
                ">
                  Xem chi tiết xe
                </button>
                <button onclick="AiChatWidget.bookCarNow(${carId})" style="
                  padding: 6px 4px;
                  background: #00a550;
                  color: #ffffff;
                  border: none;
                  border-radius: 6px;
                  font-size: 11px;
                  font-weight: 700;
                  cursor: pointer;
                  transition: all 0.15s;
                ">
                  Đặt xe ngay
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    if (isUser) {
      msgDiv.innerHTML = `
        <div style="background: linear-gradient(135deg, #2563eb, #4f46e5); color: white; padding: 10px 14px; border-radius: 14px 14px 2px 14px; font-size: 13px; line-height: 1.45; max-width: 82%; word-break: break-word;">
          ${escapeHtml(text)}
        </div>
      `;
    } else {
      msgDiv.innerHTML = `
        <div style="width: 28px; height: 28px; border-radius: 50%; background: #ede9fe; color: #7c3aed; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0;">🤖</div>
        <div style="max-width: 85%;">
          <div style="background: #f1f5f9; color: #1e293b; padding: 10px 14px; border-radius: 14px 14px 14px 2px; font-size: 13px; line-height: 1.45; word-break: break-word;">
            ${escapeHtml(text)}
          </div>
          ${cardsHtml}
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
      <div style="background: #f1f5f9; color: #64748b; padding: 10px 14px; border-radius: 14px 14px 14px 2px; font-size: 13px; font-style: italic;">
        Đang suy nghĩ câu trả lời và tìm xe phù hợp...
      </div>
    `;
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
      const baseUrl = (typeof API_CONFIG !== 'undefined' && API_CONFIG.BASE_URL) ? API_CONFIG.BASE_URL : 'http://localhost:8080/api/v1';
      const res = await fetch(`${baseUrl}/chat/${sessionId}/history`, {
        headers: {
          "Authorization": localStorage.getItem("token") ? `Bearer ${localStorage.getItem("token")}` : ""
        }
      });
      const data = await res.json();
      if (data.success && data.data && data.data.messages && data.data.messages.length > 0) {
        const box = document.getElementById("ai-messages-box");
        box.innerHTML = "";
        data.data.messages.forEach(m => appendMessage(m.role, m.content || m.text, m.cars || m.suggested_cars));
      }
    } catch (e) {}
  }

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Phương thức điều hướng khi người dùng nhấn xem hoặc đặt xe từ thẻ xe mini
  function viewCarDetail(carId) {
    if (typeof App !== 'undefined' && App.openCarDetailModal) {
      App.openCarDetailModal(carId);
    } else {
      window.location.href = `index.html?carId=${carId}`;
    }
  }

  function bookCarNow(carId) {
    if (typeof AuthService !== 'undefined' && typeof BookingService !== 'undefined') {
      AuthService.requireLoginThen(() => {
        BookingService.startBookingFlow(carId);
      });
    } else {
      window.location.href = `index.html?bookCarId=${carId}`;
    }
  }

  return {
    init,
    viewCarDetail,
    bookCarNow
  };
})();

document.addEventListener("DOMContentLoaded", () => {
  AiChatWidget.init();
});
