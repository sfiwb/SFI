with open(r'c:\Users\rocks\OneDrive\Desktop\SFI\home.js', 'r', encoding='utf-8', errors='ignore') as f:
    home_js = f.read()

with open(r'c:\Users\rocks\OneDrive\Desktop\SFI\script.js', 'r', encoding='utf-8', errors='ignore') as f:
    script_js = f.read()

import re
terms = ['scroll', 'scrolled', 'sticky']

print("--- home.js search ---")
for t in terms:
    matches = list(re.finditer(re.escape(t), home_js))
    print(f"Term '{t}': {len(matches)} matches")
    for m in matches[:3]:
        print(f"  {home_js[max(0, m.start()-50):min(len(home_js), m.end()+150)]!r}")

print("\n--- script.js search ---")
for t in terms:
    matches = list(re.finditer(re.escape(t), script_js))
    print(f"Term '{t}': {len(matches)} matches")
    for m in matches[:3]:
        print(f"  {script_js[max(0, m.start()-50):min(len(script_js), m.end()+150)]!r}")
