import json
import os
import re
import subprocess

log_path = r'C:\Users\rocks\.gemini\antigravity\brain\f82128de-e5b4-4f53-b576-0af890928e65\.system_generated\logs\transcript_full.jsonl'
workspace_dir = r"c:\Users\rocks\OneDrive\Desktop\SFI"
backup_dir = os.path.join(workspace_dir, "backup_original_code")

# Find all tool calls targeting our files
search_html_writes = []
martyrs_writes = []
press_writes = []
build_py_writes = []
original_search_html_source = ""

with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            step_idx = data.get('step_index')
            tool_calls = data.get('tool_calls', [])
            
            # Check for original search.html source in step 181
            if step_idx == 181:
                code = tool_calls[0]['args']['CodeContent']
                match = re.search(r'search_html = r"""(.*?)"""', code, re.DOTALL)
                if match:
                    original_search_html_source = match.group(1)
                else:
                    match = re.search(r'search_html = """(.*?)"""', code, re.DOTALL)
                    if match:
                        original_search_html_source = match.group(1)

            for tc in tool_calls:
                args = tc.get('args', {})
                target = args.get('TargetFile', '')
                if not target:
                    continue
                
                target_lower = target.lower()
                if target_lower.endswith('search.html'):
                    search_html_writes.append((step_idx, args))
                elif target_lower.endswith('martyrs_archive.js'):
                    martyrs_writes.append((step_idx, args))
                elif target_lower.endswith('press_handler.js'):
                    press_writes.append((step_idx, args))
                elif target_lower.endswith('build_search_system.py'):
                    build_py_writes.append((step_idx, args))
        except Exception:
            pass

print(f"Found search.html writes: {[x[0] for x in search_html_writes]}")
print(f"Found martyrs_archive.js writes: {[x[0] for x in martyrs_writes]}")
print(f"Found press_handler.js writes: {[x[0] for x in press_writes]}")
print(f"Found build_search_system.py writes: {[x[0] for x in build_py_writes]}")

# 1. Restore original search.html
if original_search_html_source:
    search_html_path = os.path.join(backup_dir, "search.html")
    with open(search_html_path, 'w', encoding='utf-8') as f:
        f.write(original_search_html_source)
    print("Restored original search.html.")
else:
    print("Error: Could not extract original search.html!")
    exit(1)

# 2. Apply search.html modifications in order of step index
search_html_writes.sort(key=lambda x: x[0])
for step_idx, args in search_html_writes:
    print(f"Applying search.html edits from step {step_idx}...")
    with open(search_html_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    if 'ReplacementChunks' in args:
        for i, chunk in enumerate(args['ReplacementChunks'], 1):
            target = chunk['TargetContent']
            replacement = chunk['ReplacementContent']
            if target in content:
                content = content.replace(target, replacement)
                print(f"  Applied Chunk {i}")
            else:
                print(f"  Warning: Chunk {i} target not found!")
    else:
        target = args.get('TargetContent')
        replacement = args.get('ReplacementContent')
        if target in content:
            content = content.replace(target, replacement)
            print("  Applied standard replacement")
        else:
            print("  Warning: Target not found!")
            
    with open(search_html_path, 'w', encoding='utf-8') as f:
        f.write(content)

# 3. Apply martyrs_archive.js modifications
martyrs_writes.sort(key=lambda x: x[0])
martyrs_js_path = os.path.join(backup_dir, "martyrs_archive.js")
for step_idx, args in martyrs_writes:
    print(f"Applying martyrs_archive.js edits from step {step_idx}...")
    with open(martyrs_js_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    target = args.get('TargetContent')
    replacement = args.get('ReplacementContent')
    if target in content:
        content = content.replace(target, replacement)
        print("  Applied martyrs_archive.js edits.")
    else:
        print("  Warning: martyrs_archive.js target not found!")
        
    with open(martyrs_js_path, 'w', encoding='utf-8') as f:
        f.write(content)

# 4. Apply press_handler.js modifications
press_writes.sort(key=lambda x: x[0])
press_js_path = os.path.join(backup_dir, "press_handler.js")
for step_idx, args in press_writes:
    print(f"Applying press_handler.js edits from step {step_idx}...")
    with open(press_js_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    target = args.get('TargetContent')
    replacement = args.get('ReplacementContent')
    if target in content:
        content = content.replace(target, replacement)
        print("  Applied press_handler.js edits.")
    else:
        print("  Warning: press_handler.js target not found!")
        
    with open(press_js_path, 'w', encoding='utf-8') as f:
        f.write(content)

# 5. Restore build_search_system.py
if build_py_writes:
    build_py_writes.sort(key=lambda x: x[0])
    # The last write to build_search_system.py contains the most up-to-date code
    last_write_args = build_py_writes[-1][1]
    build_py_path = os.path.join(workspace_dir, "build_search_system.py")
    with open(build_py_path, 'w', encoding='utf-8') as f:
        f.write(last_write_args['CodeContent'])
    print("Restored build_search_system.py.")
else:
    print("Warning: Could not find build_search_system.py writes!")

# 6. Rebuild and obfuscate
print("Re-running search index compilation...")
subprocess.run(["python", "build_search_system.py"], cwd=workspace_dir)

print("Re-running obfuscation build...")
subprocess.run(["python", "obfuscator.py"], cwd=workspace_dir)

print("Recovery successfully executed!")
