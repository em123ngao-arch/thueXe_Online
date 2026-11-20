import os
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

controllers = []
for root, dirs, files in os.walk('backend/src/main/java'):
    for f in files:
        if f.endswith('Controller.java'):
            controllers.append(os.path.join(root, f))

print(f"Total controllers: {len(controllers)}\n")

all_endpoints = []

for c in sorted(controllers):
    rel = os.path.relpath(c, 'backend/src/main/java/com/driveshare/modules')
    with open(c, 'r', encoding='utf-8', errors='ignore') as fp:
        lines = fp.readlines()
    
    base_url = ""
    for line in lines:
        m = re.search(r'@RequestMapping\(\s*\"([^\"]+)\"', line)
        if m:
            base_url = m.group(1)
            break
            
    print(f"=== {os.path.basename(c)} (Base: '{base_url}') ===")
    
    current_method = None
    for i, line in enumerate(lines):
        m = re.search(r'@(GetMapping|PostMapping|PutMapping|PatchMapping|DeleteMapping)(?:\(\s*(?:(?:value|path)\s*=\s*)?\"?([^\",\)]*)\"?\s*\))?', line)
        if m:
            verb = m.group(1).replace('Mapping', '').upper()
            subpath = m.group(2) if m.group(2) else ""
            subpath = subpath.strip('\"')
            if subpath and not subpath.startswith('/'):
                subpath = '/' + subpath
            full = (base_url + subpath) if base_url else subpath
            if not full.startswith('/'):
                full = '/' + full
            full = full.replace('//', '/')
            # check function name in next few lines
            func_name = ""
            for j in range(i+1, min(i+5, len(lines))):
                fn = re.search(r'public\s+(?:ResponseEntity<[^\>]+>|ApiResponse<[^\>]+>|[A-Za-z0-9_<>]+)\s+([A-Za-z0-9_]+)\s*\(', lines[j])
                if fn:
                    func_name = fn.group(1)
                    break
            print(f"  {verb:<6} {full:<50} -> {func_name}()")
            all_endpoints.append((verb, full, os.path.basename(c), func_name))

print(f"\nTotal extracted endpoints: {len(all_endpoints)}")

