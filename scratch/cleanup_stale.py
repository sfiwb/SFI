"""Remove stale duplicate function code from card-generator.html backup.
   Delete lines 2016..2177 (0-indexed: 2015..2176) inclusive.
"""
path = r"c:\Users\rocks\OneDrive\Desktop\SFI\backup_original_code\card-generator.html"

with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"Total lines before cleanup: {len(lines)}")

# 1-indexed: delete lines 2016 to 2177
del_start = 2016 - 1   # inclusive, 0-indexed
del_end   = 2177 - 1   # inclusive, 0-indexed

cleaned = lines[:del_start] + lines[del_end + 1:]

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(cleaned)

print(f"Removed lines 2016-2177. New total: {len(cleaned)}")
print(f"Line at position 2016 now: {cleaned[del_start].rstrip() if len(cleaned) > del_start else '<EOF>'}")
