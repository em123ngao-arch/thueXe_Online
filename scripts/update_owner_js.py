import re

path = r'thueXe_Online\frontend\js\owner.js'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Quản lý tab đang hiển thị
old_tab_pattern = r"const activeTab = this\.currentActiveTab \|\| 'CARS';"
new_tab = """const hashTab = (window.location.hash || '').replace('#', '').toUpperCase();
    const activeTab = this.currentActiveTab || (['CARS', 'REQUESTS', 'ADD'].includes(hashTab) ? hashTab : null) || sessionStorage.getItem('owner_active_tab') || 'CARS';
    this.currentActiveTab = activeTab;"""

text = re.sub(old_tab_pattern, new_tab, text, count=1)

# 2. switchOwnerTab
old_switch = """switchOwnerTab(tabName) {
    this.currentActiveTab = tabName;"""
new_switch = """switchOwnerTab(tabName) {
    this.currentActiveTab = tabName;
    try {
      sessionStorage.setItem('owner_active_tab', tabName);
      history.replaceState(null, '', '#' + tabName.toLowerCase());
    } catch (_) {}"""

text = text.replace(old_switch, new_switch, 1)

# 3. approveRental: add DriveShareSocket.emit('RENTAL_APPROVED')
approve_pat = r"(async approveRental\(rentalId\)[\s\S]*?const res = await RentalAPI\.approveRental\(rentalId\);[\s\S]*?if \(res && res\.success\) \{)"
replacement_approve = r"""\1
          if (typeof DriveShareSocket !== 'undefined') {
            DriveShareSocket.emit('RENTAL_APPROVED', { rental_id: rentalId, ...(res?.data || {}) });
          }"""
text = re.sub(approve_pat, replacement_approve, text, count=1)

# 4. rejectRental: add DriveShareSocket.emit('RENTAL_REJECTED')
reject_pat = r"(async rejectRentalPrompt\(rentalId\)[\s\S]*?const res = await RentalAPI\.rejectRental\(rentalId, reason\.trim\(\)\);[\s\S]*?if \(res && res\.success\) \{)"
replacement_reject = r"""\1
          if (typeof DriveShareSocket !== 'undefined') {
            DriveShareSocket.emit('RENTAL_REJECTED', { rental_id: rentalId, reason: reason.trim(), ...(res?.data || {}) });
          }"""
text = re.sub(reject_pat, replacement_reject, text, count=1)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

print("owner.js successfully updated!")

