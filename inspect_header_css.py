with open(r'c:\Users\rocks\OneDrive\Desktop\SFI\style.css', 'r', encoding='utf-8') as f:
    content = f.read()

import re
matches = list(re.finditer(r'\bheader\b|#header', content))
print(f"Total matches: {len(matches)}")
for m in matches[:10]:
    start = max(0, m.start() - 50)
    end = min(len(content), m.end() + 150)
    print(f"  Context: {repr(content[start:end])}\n")
