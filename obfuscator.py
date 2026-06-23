import os
import shutil
import base64
import re
import random
import string

# Paths
WORKSPACE_DIR = r"c:\Users\rocks\OneDrive\Desktop\SFI"
BACKUP_DIR = os.path.join(WORKSPACE_DIR, "backup_original_code")

# Files to exclude from obfuscation
EXCLUDE_FILES = {
    "obfuscator.py",
    "inspect_js.py",
    "inspect_sticky.py",
    "inspect_zindex.py",
    "inspect_header_css.py",
}

def create_backup():
    """Create a backup of the original source code files if the backup folder doesn't exist."""
    if os.path.exists(BACKUP_DIR):
        print(f"Backup folder already exists at: {BACKUP_DIR}")
        return True
    
    print(f"Creating backup of original files at: {BACKUP_DIR}...")
    os.makedirs(BACKUP_DIR, exist_ok=True)
    
    for filename in os.listdir(WORKSPACE_DIR):
        file_path = os.path.join(WORKSPACE_DIR, filename)
        if os.path.isfile(file_path):
            if filename in EXCLUDE_FILES or filename.startswith("."):
                continue
            shutil.copy2(file_path, BACKUP_DIR)
            print(f"  Backed up: {filename}")
    print("Backup completed successfully.\n")
    return True

def restore_from_backup():
    """Restore clean original files from backup to the root folder before obfuscating."""
    if not os.path.exists(BACKUP_DIR):
        return False
        
    print("Restoring clean source files from backup to root...")
    for filename in os.listdir(BACKUP_DIR):
        src_path = os.path.join(BACKUP_DIR, filename)
        dest_path = os.path.join(WORKSPACE_DIR, filename)
        if os.path.isfile(src_path):
            try:
                # Remove file if it is blocked or locked by antivirus
                if os.path.exists(dest_path):
                    os.remove(dest_path)
                shutil.copy2(src_path, dest_path)
            except Exception as e:
                print(f"  Error restoring {filename}: {e}")
    print("Restored clean source files.\n")
    return True

def generate_random_key(length=16):
    """Generate a random alphanumeric key."""
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))

def xor_encrypt(content, key):
    """XOR encrypt string content with key and return base64 encoded string."""
    key_bytes = key.encode('utf-8')
    content_bytes = content.encode('utf-8')
    encrypted_bytes = bytearray()
    for i in range(len(content_bytes)):
        encrypted_bytes.append(content_bytes[i] ^ key_bytes[i % len(key_bytes)])
    return base64.b64encode(encrypted_bytes).decode('utf-8')

def inline_local_js(html_content):
    """Inline all local script tags into the HTML content to protect them inside the encrypted body."""
    # Matches <script src="script.js"></script> including tolerant end tags like </script > or </script foo="bar">
    script_pattern = r'<script\b[^>]*\bsrc\s*=\s*([\'"])([^\'"]+)\1[^>]*>\s*</\s*script(?:\s+[^>]*)?>'
    
    def replace_script(match):
        src = match.group(2)
        # Skip absolute/CDN links
        if src.startswith("http://") or src.startswith("https://") or src.startswith("//"):
            return match.group(0)
            
        js_file = src.split("?")[0]
        backup_js_path = os.path.join(BACKUP_DIR, js_file)
        
        if os.path.exists(backup_js_path):
            with open(backup_js_path, 'r', encoding='utf-8', errors='ignore') as f_js:
                js_content = f_js.read()
            # Escape </script> inside script code to prevent prematurely closing HTML tag
            js_content = js_content.replace("</script>", "<\\/script>")
            return f"<script>\n{js_content}\n</script>"
        else:
            return match.group(0)
            
    return re.sub(script_pattern, replace_script, html_content, flags=re.IGNORECASE)

def obfuscate_html_file(file_path):
    """Obfuscate HTML file by inlining local CSS/JS and encrypting the body."""
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        html = f.read()
    
    # 1. Inline local CSS files and remove their link tags
    local_css_contents = []
    for css_file in ["style.css", "home.css"]:
        pattern = rf'<link[^>]*href=["\'](?:assets/)?{css_file}["\'][^>]*>'
        matches = re.findall(pattern, html, re.IGNORECASE)
        for match in matches:
            html = html.replace(match, "")
            
        backup_css_path = os.path.join(BACKUP_DIR, css_file)
        if os.path.exists(backup_css_path):
            with open(backup_css_path, 'r', encoding='utf-8', errors='ignore') as f_css:
                local_css_contents.append(f_css.read())
        else:
            active_css_path = os.path.join(WORKSPACE_DIR, css_file)
            if os.path.exists(active_css_path):
                with open(active_css_path, 'r', encoding='utf-8', errors='ignore') as f_css:
                    local_css_contents.append(f_css.read())
                    
    # 2. Find body content
    body_match = re.search(r'(<body[^>]*>)(.*?)(</body>)', html, re.IGNORECASE | re.DOTALL)
    if not body_match:
        print(f"  Warning: No body found in {os.path.basename(file_path)}")
        return
    
    body_tag = body_match.group(1)
    body_inner_content = body_match.group(2)
    body_close_tag = body_match.group(3)
    
    # 3. Inline local JS scripts
    body_inner_content = inline_local_js(body_inner_content)
    
    # 4. Prepend local CSS inside <style> tags
    combined_css = "\n".join(local_css_contents)
    if combined_css.strip():
        body_inner_content = f"<style>\n{combined_css}\n</style>\n" + body_inner_content
    
    # 5. Generate key and XOR encrypt
    key = generate_random_key(16)
    encrypted_body = xor_encrypt(body_inner_content, key)
    
    # 6. Scramble decryptor JS variables
    obfuscated_body = (
        f"{body_tag}\n"
        f"    <script>\n"
        f"        (function(_0x5c1b, _0x3a4f) {{\n"
        f"            var _0x9e2d = atob(_0x5c1b);\n"
        f"            var _0x7f4a = \"\";\n"
        f"            var _0x1c3e = _0x3a4f.length;\n"
        f"            for (var _0x2b8c = 0; _0x2b8c < _0x9e2d.length; _0x2b8c++) {{\n"
        f"                _0x7f4a += String.fromCharCode(_0x9e2d.charCodeAt(_0x2b8c) ^ _0x3a4f.charCodeAt(_0x2b8c % _0x1c3e));\n"
        f"            }}\n"
        f"            document.write(decodeURIComponent(escape(_0x7f4a)));\n"
        f"        }})(\"{encrypted_body}\", \"{key}\");\n"
        f"    </script>\n"
        f"    <noscript>\n"
        f"        <div style=\"text-align:center; padding:50px; font-family:sans-serif; color:#ff2d3c;\">\n"
        f"            <h2>Please enable JavaScript to view this website.</h2>\n"
        f"        </div>\n"
        f"    </noscript>\n"
        f"    {body_close_tag}"
    )
    
    new_html = html[:body_match.start()] + obfuscated_body + html[body_match.end():]
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_html)
    print(f"  Obfuscated HTML (XOR): {os.path.basename(file_path)}")

def obfuscate_js_file(file_path):
    """Replace active JS files with a protection notice since the code is now fully embedded and encrypted inside the HTML."""
    protection_msg = "/* Source code is protected. Access Denied. */\n"
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(protection_msg)
    print(f"  Obfuscated JS: {os.path.basename(file_path)}")

def obfuscate_css_file(file_path):
    """Replace active CSS files with a protection notice."""
    protection_msg = "/* Source code is protected. Access Denied. */\n"
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(protection_msg)
    print(f"  Obfuscated CSS: {os.path.basename(file_path)}")

def main():
    # Step 1: Backup original code (first-time only)
    has_backup = os.path.exists(BACKUP_DIR)
    create_backup()
    
    # Step 2: If backup already existed, restore original source files first
    if has_backup:
        restore_from_backup()
    
    # Step 3: Obfuscate active files in root folder
    print("Starting XOR obfuscation of active workspace files...")
    for filename in os.listdir(WORKSPACE_DIR):
        file_path = os.path.join(WORKSPACE_DIR, filename)
        
        # Skip backup folder, directories, and excluded files
        if not os.path.isfile(file_path) or filename in EXCLUDE_FILES or filename.startswith("."):
            continue
            
        if filename.endswith(".html"):
            obfuscate_html_file(file_path)
        elif filename.endswith(".js"):
            obfuscate_js_file(file_path)
        elif filename.endswith(".css"):
            obfuscate_css_file(file_path)

    print("\nAll active files obfuscated with XOR encryption successfully!")
    print("Original human-readable source code is preserved in: \\backup_original_code\\")

if __name__ == "__main__":
    main()
