/**
 * DriveShare Toast Notification System (BR-01-2)
 * Export: showToast(message, type, durationMs)
 * Type: 'success' | 'error' | 'warning' | 'info'
 * Default duration: 2000ms (2s)
 */

(function () {
  const TOAST_CONTAINER_ID = 'ds-toast-container';

  // Đảm bảo stylesheet cho toast được nhúng
  function ensureToastStyles() {
    if (document.getElementById('ds-toast-styles')) return;
    const style = document.createElement('style');
    style.id = 'ds-toast-styles';
    style.textContent = `
      #${TOAST_CONTAINER_ID} {
        position: fixed;
        top: 24px;
        right: 24px;
        z-index: 999999;
        display: flex;
        flex-direction: column;
        gap: 12px;
        pointer-events: none;
        max-width: 380px;
        width: calc(100vw - 48px);
      }
      .ds-toast {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 14px 18px;
        background: #ffffff;
        color: #1e293b;
        border-radius: 12px;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08);
        border: 1px solid #e2e8f0;
        pointer-events: auto;
        opacity: 0;
        transform: translateX(40px) scale(0.96);
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 0.9rem;
        line-height: 1.45;
        overflow: hidden;
        position: relative;
      }
      .ds-toast.show {
        opacity: 1;
        transform: translateX(0) scale(1);
      }
      .ds-toast.hide {
        opacity: 0;
        transform: translateX(40px) scale(0.92);
      }
      .ds-toast-icon {
        flex-shrink: 0;
        width: 22px;
        height: 22px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-top: 1px;
      }
      .ds-toast-content {
        flex: 1;
        font-weight: 500;
        word-break: break-word;
      }
      .ds-toast-close {
        flex-shrink: 0;
        background: transparent;
        border: none;
        color: #94a3b8;
        cursor: pointer;
        padding: 2px;
        font-size: 16px;
        line-height: 1;
        border-radius: 4px;
        transition: color 0.15s ease;
      }
      .ds-toast-close:hover {
        color: #475569;
      }
      .ds-toast-progress {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 3px;
        width: 100%;
        background: rgba(0, 0, 0, 0.08);
      }
      .ds-toast-progress-bar {
        height: 100%;
        width: 100%;
        transform-origin: left;
        animation: dsToastProgress linear forwards;
      }
      @keyframes dsToastProgress {
        from { transform: scaleX(1); }
        to { transform: scaleX(0); }
      }

      /* Loại Toast */
      .ds-toast-success {
        border-left: 4px solid #10b981;
      }
      .ds-toast-success .ds-toast-icon {
        color: #10b981;
      }
      .ds-toast-success .ds-toast-progress-bar {
        background: #10b981;
      }

      .ds-toast-error {
        border-left: 4px solid #ef4444;
      }
      .ds-toast-error .ds-toast-icon {
        color: #ef4444;
      }
      .ds-toast-error .ds-toast-progress-bar {
        background: #ef4444;
      }

      .ds-toast-warning {
        border-left: 4px solid #f59e0b;
      }
      .ds-toast-warning .ds-toast-icon {
        color: #f59e0b;
      }
      .ds-toast-warning .ds-toast-progress-bar {
        background: #f59e0b;
      }

      .ds-toast-info {
        border-left: 4px solid #3b82f6;
      }
      .ds-toast-info .ds-toast-icon {
        color: #3b82f6;
      }
      .ds-toast-info .ds-toast-progress-bar {
        background: #3b82f6;
      }
    `;
    document.head.appendChild(style);
  }

  function getToastContainer() {
    let container = document.getElementById(TOAST_CONTAINER_ID);
    if (!container) {
      container = document.createElement('div');
      container.id = TOAST_CONTAINER_ID;
      document.body.appendChild(container);
    }
    return container;
  }

  const ICONS = {
    success: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
    error: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></polyline><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
    warning: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
    info: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`
  };

  /**
   * Hiển thị thông báo Toast
   * @param {string} message Nội dung hiển thị
   * @param {'success'|'error'|'warning'|'info'} type Loại thông báo (mặc định: 'info')
   * @param {number} durationMs Thời gian hiển thị tính bằng milliseconds (mặc định 2000ms = 2s)
   */
  function showToast(message, type = 'info', durationMs = 2000) {
    if (typeof document === 'undefined') return;

    ensureToastStyles();
    const container = getToastContainer();

    const normalizedType = ['success', 'error', 'warning', 'info'].includes(type) ? type : 'info';
    const icon = ICONS[normalizedType];

    const toast = document.createElement('div');
    toast.className = `ds-toast ds-toast-${normalizedType}`;
    toast.innerHTML = `
      <div class="ds-toast-icon">${icon}</div>
      <div class="ds-toast-content">${message}</div>
      <button class="ds-toast-close" title="Đóng">&times;</button>
      <div class="ds-toast-progress">
        <div class="ds-toast-progress-bar" style="animation-duration: ${durationMs}ms"></div>
      </div>
    `;

    let timer = null;

    const removeToast = () => {
      if (timer) clearTimeout(timer);
      toast.classList.remove('show');
      toast.classList.add('hide');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    };

    toast.querySelector('.ds-toast-close').addEventListener('click', removeToast);

    container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    timer = setTimeout(removeToast, durationMs);
  }

  // Gắn vào window để dùng toàn cục
  window.showToast = showToast;

  // Hỗ trợ nếu App đã tồn tại
  if (typeof window.App !== 'undefined') {
    window.App.showToast = showToast;
  }
})();

// Xuất cho ES Module nếu cần
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { showToast: window.showToast };
}
