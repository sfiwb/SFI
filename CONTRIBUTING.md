# Contributing to SFI West Bengal Web Portal

Thank you for your interest in contributing to the portal. We welcome contributions to enhance styling, functionality, search performance, and documentation.

## Development Workflow

This codebase uses a dual-folder structure:
1. **`backup_original_code/`**: Contains the raw, clean, readable HTML, JS, and CSS files.
2. **Project Root (`./`)**: Contains the active files, which are compiled and XOR-obfuscated for final delivery.

> [!IMPORTANT]
> **Never** edit the HTML, CSS, or JS files directly in the root folder. They are overwritten automatically by the build scripts. All changes must be made to the files inside [backup_original_code](file:///c:/Users/rocks/OneDrive/Desktop/SFI/backup_original_code).

### Step-by-Step Contribution Process

1. **Locate the file** you want to change inside [backup_original_code](file:///c:/Users/rocks/OneDrive/Desktop/SFI/backup_original_code).
2. **Make your modifications** (e.g., editing `script.js` or `style.css` in the backup directory).
3. **Compile the Search Index** (if modifying content pages or martyrs/press data) by running:
   ```bash
   python build_search_system.py
   ```
4. **Obfuscate and Sync** your changes to the root folder:
   ```bash
   python obfuscator.py
   ```
5. **Test locally** by opening the HTML files in your browser to verify the changes decrypt and render correctly.

## Code Standards

- **Semantic HTML**: Maintain clean HTML structure with proper accessibility standards.
- **Vanilla Performance**: Avoid external libraries unless absolutely necessary. Keep interactions responsive and lightweight.
- **Bilingual Content**: Standard content pages utilize Bengali (Primary) and English (Secondary) where appropriate. Maintain proper localization.

## Testing Changes

Before committing your changes, ensure that:
- The Python scripts `build_search_system.py` and `obfuscator.py` execute without syntax errors.
- Visual elements (particles, cards, slider) render correctly in both **Light** and **Dark** themes.
- Form submissions and search functions work correctly.
