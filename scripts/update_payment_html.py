path = r'thueXe_Online\frontend\payment.html'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

old_nav = """      <div class="nav-actions" style="display: flex; gap: 0.75rem; align-items: center;">
        <a href="index.html" class="btn btn-outline btn-sm">Về trang chủ</a>
      </div>"""

new_nav = """      <div class="nav-actions" style="display: flex; gap: 0.75rem; align-items: center;">
        <a href="index.html#my-bookings" class="btn btn-outline btn-sm" style="font-weight: 700;">
          &larr; Chuyến của tôi
        </a>
        <a href="index.html" class="btn btn-ghost btn-sm">Trang chủ</a>
      </div>"""

text = text.replace('\r\n', '\n')
old_nav = old_nav.replace('\r\n', '\n')
new_nav = new_nav.replace('\r\n', '\n')

assert old_nav in text, 'old_nav not found'
text = text.replace(old_nav, new_nav, 1)

with open(path, 'w', encoding='utf-8', newline='\n') as f:
    f.write(text)

print('payment.html updated successfully!')

