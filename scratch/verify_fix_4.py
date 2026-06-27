import os

backup_dir = r"c:\Users\rocks\OneDrive\Desktop\SFI\backup_original_code"

def verify():
    # 1. HTML checks
    html_path = os.path.join(backup_dir, "index.html")
    with open(html_path, 'r', encoding='utf-8') as f:
        html = f.read()
        
    if "homepage-video-gallery-card" not in html:
        print("ERROR: homepage-video-gallery-card not found in HTML!")
        return False
        
    if "video-gallery-wrapper" in html:
        print("ERROR: video-gallery-wrapper is still in HTML!")
        return False
        
    # 2. CSS checks
    css_path = os.path.join(backup_dir, "style.css")
    with open(css_path, 'r', encoding='utf-8') as f:
        css = f.read()
        
    if ".homepage-video-gallery-card" not in css:
        print("ERROR: .homepage-video-gallery-card not found in CSS!")
        return False
        
    print("OK: Verification successful!")
    return True

if __name__ == "__main__":
    if verify():
        print("Verification passed.")
    else:
        print("Verification failed.")
        exit(1)
