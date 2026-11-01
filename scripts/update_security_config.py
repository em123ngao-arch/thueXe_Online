sec_path = r'C:\Users\ChiTin\Downloads\ThueXe\thueXe_Online\backend\src\main\java\com\driveshare\security\SecurityConfig.java'
with open(sec_path, 'r', encoding='utf-8') as f:
    sec = f.read()

target = '"/api/v1/auth/change-email/confirm"'
repl = '"/api/v1/auth/change-email/confirm",\n                                "/api/v1/rentals/clear-all"'
if target in sec:
    sec = sec.replace(target, repl)
    with open(sec_path, 'w', encoding='utf-8') as f:
        f.write(sec)
    print("Updated SecurityConfig.java successfully")

