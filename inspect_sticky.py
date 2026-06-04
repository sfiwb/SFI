with open(r'c:\Users\rocks\OneDrive\Desktop\SFI\home.css', 'r', encoding='utf-8') as f:
    home_content = f.read()

with open(r'c:\Users\rocks\OneDrive\Desktop\SFI\style.css', 'r', encoding='utf-8') as f:
    style_content = f.read()

import re
terms = ['scrolled', 'index-page', 'sticky']

print("--- home.css search ---")
for t in terms:
    matches = list(re.finditer(re.escape(t), home_content))
    print(f"Term '{t}': {len(matches)} matches")
    for m in matches[:5]:
        print(f"  {home_content[max(0, m.start()-50):min(len(home_content), m.end()+150)]!r}")

print("\n--- style.css search ---")
for t in terms:
    matches = list(re.finditer(re.escape(t), style_content))
    print(f"Term '{t}': {len(matches)} matches")
    for m in matches[:5]:
        print(f"  {style_content[max(0, m.start()-50):min(len(style_content), m.end()+150)]!r}")
