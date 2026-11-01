import re

path = r'thueXe_Online\frontend\js\trip-tracker.js'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Track currentRentalId in openTrackerModal and reset in closeTrackerModal
old_open = """async openTrackerModal(rentalId) {
    let rental = null;"""
new_open = """async openTrackerModal(rentalId) {
    this.currentRentalId = rentalId;
    let rental = null;"""

text = text.replace(old_open, new_open, 1)

old_close = """closeTrackerModal() {
    const modalEl = document.getElementById('tripTrackerModal');"""
new_close = """closeTrackerModal() {
    this.currentRentalId = null;
    const modalEl = document.getElementById('tripTrackerModal');"""

text = text.replace(old_close, new_close, 1)

# 2. Add Payment Button in modal footer when currentStep === 2
old_footer = """          <!-- FOOTER ACTIONS -->
          <div class="trip-tracker-footer">"""

new_footer = """          <!-- FOOTER ACTIONS -->
          <div class="trip-tracker-footer">
            ${currentStep === 2 ? `
              <a href="payment.html?rental_id=${id}" class="btn btn-primary" style="background:#0f766e; border-color:#0f766e; font-weight:700; display:inline-flex; align-items:center; gap:6px; text-decoration:none;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                Thanh Toán Cọc 30% Ngay
              </a>
            ` : ''}"""

text = text.replace(old_footer, new_footer, 1)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

print("trip-tracker.js updated successfully!")

