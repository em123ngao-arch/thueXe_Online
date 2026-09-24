/**
 * DriveShare AI Chat Assistant Widget
 * Integrates with /api/v1/chat endpoint powered by Spring AI
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
        width: 380px;
        height: 520px;
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
                Hỗ trợ tư vấn thuê xe 24/7
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
          <button class="ai-chip" data-query="Tôi muốn thuê xe 7 chỗ đi Đà Lạt cuối tuần" style="background: white; border: 1px solid #cbd5e1; border-radius: 12px; padding: 4px 10px; font-size: 11px; cursor: pointer; color: #475569;">🚗 Xe 7 chỗ đi chơi</button>
          <button class="ai-chip" data-query="Gợi ý xe điện VinFast chạy trong nội thành" style="background: white; border: 1px solid #cbd5e1; border-radius: 12px; padding: 4px 10px; font-size: 11px; cursor: pointer; color: #475569;">⚡ Xe điện VinFast</button>
          <button class="ai-chip" data-query="Tìm xe số tự động giá rẻ dưới 800k một ngày" style="background: white; border: 1px solid #cbd5e1; border-radius: 12px; padding: 4px 10px; font-size: 11px; cursor: pointer; color: #475569;">💰 Xe tiết kiệm &lt;800k</button>
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
              Xin chào! Tôi là Trợ lý AI DriveShare. Bạn đang tìm xe đi đâu, bao nhiêu chỗ ngồi hay ngân sách bao nhiêu? Cứ nói với tôi nhé!
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
        #ai-chat-trigger:hover { transform: scale(1.08); }
        .ai-chip:hover { background: #eff6ff !important; border-color: #93c5fd !important; color: #1d4ed8 !important; }
        #ai-user-input:focus { border-color: #6366f1; box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15); }
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
          await fetch(`/api/v1/chat/${sessionId}`, { method: "DELETE" });
        } catch (e) {}
        const box = document.getElementById("ai-messages-box");
        box.innerHTML = `
          <div style="display: flex; gap: 8px; align-items: flex-start;">
            <div style="width: 28px; height: 28px; border-radius: 50%; background: #ede9fe; color: #7c3aed; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0;">🤖</div>
            <div style="background: #f1f5f9; color: #1e293b; padding: 10px 14px; border-radius: 14px 14px 14px 2px; font-size: 13px; line-height: 1.45; max-width: 82%;">
              Đã làm mới cuộc hội thoại! Bạn đang cần tìm xe gì hôm nay?
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
        const res = await fetch("/api/v1/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": localStorage.getItem("token") ? `Bearer ${localStorage.getItem("token")}` : ""
          },
          body: JSON.stringify({ sessionId, message: text })
        });

        const data = await res.json();
        removeLoading(loadingId);

        if (data.success && data.data && data.data.message) {
          appendMessage("assistant", data.data.message);
        } else if (data.data && data.data.message) {
          appendMessage("assistant", data.data.message);
        } else {
          appendMessage("assistant", "Xin lỗi, hiện tại tôi chưa phản hồi được. Vui lòng thử lại sau giây lát!");
        }
      } catch (err) {
        removeLoading(loadingId);
        appendMessage("assistant", "Không thể kết nối đến máy chủ AI. Vui lòng kiểm tra lại backend!");
      }
    });
  }

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
      msgDiv.innerHTML = `
        <div style="width: 28px; height: 28px; border-radius: 50%; background: #ede9fe; color: #7c3aed; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0;">🤖</div>
        <div style="background: #f1f5f9; color: #1e293b; padding: 10px 14px; border-radius: 14px 14px 14px 2px; font-size: 13px; line-height: 1.45; max-width: 82%; word-break: break-word;">
          ${escapeHtml(text)}
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
        Đang suy nghĩ câu trả lời...
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
      const res = await fetch(`/api/v1/chat/${sessionId}/history`, {
        headers: {
          "Authorization": localStorage.getItem("token") ? `Bearer ${localStorage.getItem("token")}` : ""
        }
      });
      const data = await res.json();
      if (data.success && data.data && data.data.messages && data.data.messages.length > 0) {
        const box = document.getElementById("ai-messages-box");
        box.innerHTML = "";
        data.data.messages.forEach(m => appendMessage(m.role, m.text));
      }
    } catch (e) {}
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", () => {
  AiChatWidget.init();
});
