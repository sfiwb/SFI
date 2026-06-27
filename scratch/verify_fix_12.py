import os

backup_dir = r"c:\Users\rocks\OneDrive\Desktop\SFI\backup_original_code"

def verify():
    # CSS check
    css_path = os.path.join(backup_dir, "style.css")
    with open(css_path, 'r', encoding='utf-8') as f:
        css = f.read()
        
    if "font-size: 1.65rem;" not in css:
        print("ERROR: stat-number font-size responsive override is missing in CSS!")
        return False
        
    if "padding: 24px 8px;" not in css:
        print("ERROR: stat-card padding override is missing in CSS!")
        return False
        
    print("OK: Responsive mobile style checks verified successfully!")
    return True

if __name__ == "__main__":
    if verify():
        print("Verification passed.")
    else:
        print("Verification failed.")
        exit(1)
