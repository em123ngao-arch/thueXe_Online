path_js = r'thueXe_Online\frontend\js\admin.js'
with open(path_js, 'r', encoding='utf-8') as f:
    text_js = f.read()

text_js = text_js.replace('\r\n', '\n')
old_switch = """  switchTab(tabName) {
    document.getElementById('adminTabCars')"""
new_switch = """  switchTab(tabName) {
    try {
      sessionStorage.setItem('admin_active_tab', tabName);
      history.replaceState(null, '', '#' + tabName.toLowerCase());
    } catch (_) {}
    document.getElementById('adminTabCars')"""

assert old_switch in text_js, "old_switch in admin.js not found"
text_js = text_js.replace(old_switch, new_switch, 1)

with open(path_js, 'w', encoding='utf-8', newline='\n') as f:
    f.write(text_js)

path_html = r'thueXe_Online\frontend\admin.html'
with open(path_html, 'r', encoding='utf-8') as f:
    text_html = f.read()

text_html = text_html.replace('\r\n', '\n')
old_html_tab = """          const params = new URLSearchParams(window.location.search);
          const tab = params.get('tab') || window.location.hash.replace('#', '').toUpperCase();"""

new_html_tab = """          const params = new URLSearchParams(window.location.search);
          const tab = params.get('tab') || window.location.hash.replace('#', '').toUpperCase() || sessionStorage.getItem('admin_active_tab') || 'CARS';"""

assert old_html_tab in text_html, "old_html_tab in admin.html not found"
text_html = text_html.replace(old_html_tab, new_html_tab, 1)

with open(path_html, 'w', encoding='utf-8', newline='\n') as f:
    f.write(text_html)

print("admin.js and admin.html updated successfully!")

