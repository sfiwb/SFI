import os

backup_dir = r"c:\Users\rocks\OneDrive\Desktop\SFI\backup_original_code"

# Replacements for old social links
replacements = {
    "https://www.youtube.com/@sfiwestbengalofficial": "https://www.youtube.com/@sfiwestbengal",
    "https://www.instagram.com/sfi_west_bengal/": "https://www.instagram.com/sfiwb/",
    "https://twitter.com/SFI_WestBengal": "https://x.com/sfi_westbengal",
    "https://www.facebook.com/sfiwestbengalofficial/": "https://www.facebook.com/sfiwb/",
}

# Replacements for placeholders (specific to files)
placeholder_replacements = {
    "contact.html": {
        'href="https://www.facebook.com/"': 'href="https://www.facebook.com/sfiwb/"',
        'href="https://twitter.com/"': 'href="https://x.com/sfi_westbengal"',
        'href="https://instagram.com/"': 'href="https://www.instagram.com/sfiwb/"',
        'href="https://www.youtube.com/"': 'href="https://www.youtube.com/@sfiwestbengal"',
    },
    "videos.html": {
        'href="https://www.youtube.com/"': 'href="https://www.youtube.com/@sfiwestbengal"',
    }
}

print("Starting social media links update...")

for filename in os.listdir(backup_dir):
    if filename.endswith(".html"):
        filepath = os.path.join(backup_dir, filename)
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
        
        modified = False
        
        # 1. Apply global old link replacements
        for old, new in replacements.items():
            if old in content:
                content = content.replace(old, new)
                modified = True
                print(f"  Replaced {old} -> {new} in {filename}")
        
        # 2. Apply placeholder replacements for specific files
        if filename in placeholder_replacements:
            for old, new in placeholder_replacements[filename].items():
                if old in content:
                    content = content.replace(old, new)
                    modified = True
                    print(f"  Replaced placeholder {old} -> {new} in {filename}")
                    
        if modified:
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(content)

print("Update completed!")
