import subprocess
import os

edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
html_file = os.path.abspath("frontend/index.html")
out_img = os.path.abspath("docs/screenshots/test_mobile_home.png")

file_url = "file:///" + html_file.replace("\\", "/")

cmd = [
    edge_path,
    "--headless",
    "--disable-gpu",
    "--hide-scrollbars",
    "--window-size=390,844",
    f"--screenshot={out_img}",
    file_url
]

res = subprocess.run(cmd, capture_output=True, text=True)
print("Return code:", res.returncode)
print("File exists:", os.path.exists(out_img))
if os.path.exists(out_img):
    print("Size:", os.path.getsize(out_img), "bytes")

