with open(r'c:\Users\rocks\OneDrive\Desktop\SFI\home.css', 'r', encoding='utf-8') as f:
    home_content = f.read()

with open(r'c:\Users\rocks\OneDrive\Desktop\SFI\style.css', 'r', encoding='utf-8') as f:
    style_content = f.read()

import re
pattern = r'z-index\s*:\s*(\d+)'

print("--- home.css z-index matches ---")
for m in re.finditer(pattern, home_content):
    print(f"Match: {m.group(0)} around context:\n{home_content[max(0, m.start()-50):min(len(home_content), m.end()+150)]!r}\n")

print("\n--- style.css z-index matches ---")
for m in re.finditer(pattern, style_content):
    print(f"Match: {m.group(0)} around context:\n{style_content[max(0, m.start()-50):min(len(style_content), m.end()+150)]!r}\n")
