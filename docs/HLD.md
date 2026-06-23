# 🏛️ High Level Documentation (HLD) — SFI West Bengal Web Portal

This document outlines the high-level architecture, content distribution lifecycle, build workflows, and deployment model for the SFI West Bengal Web Portal.

---

## 🗺️ System Architecture Overview

The portal is a client-side, offline-first static website. It relies on a local build pipeline that compiles content into a search database and encrypts deployment assets.

Below is the **System Architecture Diagram** showing the separation between development source code, the compilation pipeline, and the browser runtime.

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450" width="100%" style="background-color:#1e1e24; border-radius:12px; font-family:'Segoe UI', sans-serif;">
  <!-- Grid Background -->
  <defs>
    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
    </pattern>
    <linearGradient id="primary-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff4d4d"/>
      <stop offset="100%" stop-color="#cc0000"/>
    </linearGradient>
    <linearGradient id="build-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4d94ff"/>
      <stop offset="100%" stop-color="#0066ff"/>
    </linearGradient>
    <linearGradient id="client-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#33cc33"/>
      <stop offset="100%" stop-color="#1f801f"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="#121214"/>
  <rect width="100%" height="100%" fill="url(#grid)"/>

  <!-- Title -->
  <text x="30" y="40" fill="#ffffff" font-size="20" font-weight="bold">SFI WB High-Level Architecture</text>
  <text x="30" y="60" fill="#a0a0a8" font-size="12">Structural separation of Source, Build Tools, and client-side Runtime</text>

  <!-- Box: Developer Workspace (Source Files) -->
  <rect x="30" y="100" width="220" height="280" rx="10" fill="rgba(255,255,255,0.05)" stroke="url(#primary-grad)" stroke-width="1.5"/>
  <text x="45" y="125" fill="#ff4d4d" font-size="14" font-weight="bold">1. Developer Workspace</text>
  <text x="45" y="145" fill="#ffffff" font-size="11" font-style="italic">backup_original_code/</text>
  
  <rect x="45" y="170" width="190" height="35" rx="5" fill="rgba(255,255,255,0.08)" stroke="#ff4d4d" stroke-dasharray="3 3"/>
  <text x="55" y="192" fill="#ffffff" font-size="12">HTML Pages (index, etc.)</text>
  
  <rect x="45" y="215" width="190" height="35" rx="5" fill="rgba(255,255,255,0.08)" stroke="#ff4d4d" stroke-dasharray="3 3"/>
  <text x="55" y="237" fill="#ffffff" font-size="12">Stylesheets (style, home)</text>

  <rect x="45" y="260" width="190" height="85" rx="5" fill="rgba(255,255,255,0.08)" stroke="#ff4d4d" stroke-dasharray="3 3"/>
  <text x="55" y="280" fill="#ffffff" font-size="12" font-weight="bold">Datasets &amp; Modules</text>
  <text x="55" y="298" fill="#e0e0e0" font-size="10">martyrs_data.js (JSON list)</text>
  <text x="55" y="315" fill="#e0e0e0" font-size="10">press_data.js (JSON list)</text>
  <text x="55" y="332" fill="#e0e0e0" font-size="10">script.js (Interactions)</text>

  <!-- Box: Build Pipeline -->
  <rect x="300" y="100" width="200" height="280" rx="10" fill="rgba(255,255,255,0.05)" stroke="url(#build-grad)" stroke-width="1.5"/>
  <text x="315" y="125" fill="#4d94ff" font-size="14" font-weight="bold">2. Build &amp; Security</text>
  
  <rect x="315" y="160" width="170" height="60" rx="8" fill="url(#build-grad)" opacity="0.85"/>
  <text x="325" y="182" fill="#ffffff" font-size="12" font-weight="bold">build_search_system.py</text>
  <text x="325" y="198" fill="#e6f2ff" font-size="10">Compiles text indexes to</text>
  <text x="325" y="210" fill="#e6f2ff" font-size="10">search_data.js</text>

  <rect x="315" y="280" width="170" height="60" rx="8" fill="url(#build-grad)" opacity="0.85"/>
  <text x="325" y="302" fill="#ffffff" font-size="12" font-weight="bold">obfuscator.py</text>
  <text x="325" y="318" fill="#e6f2ff" font-size="10">XOR base64 encryption</text>
  <text x="325" y="330" fill="#e6f2ff" font-size="10">Inlines JS &amp; CSS styles</text>

  <!-- Box: Production Distribution & Client Runtime -->
  <rect x="550" y="100" width="220" height="280" rx="10" fill="rgba(255,255,255,0.05)" stroke="url(#client-grad)" stroke-width="1.5"/>
  <text x="565" y="125" fill="#33cc33" font-size="14" font-weight="bold">3. Client Runtime</text>
  <text x="565" y="145" fill="#ffffff" font-size="11" font-style="italic">Project Root (Distribution)</text>

  <rect x="565" y="170" width="190" height="40" rx="6" fill="rgba(255,255,255,0.08)" stroke="#33cc33"/>
  <text x="575" y="195" fill="#ffffff" font-size="12">Encrypted Root HTML Pages</text>

  <rect x="565" y="225" width="190" height="35" rx="6" fill="rgba(255,255,255,0.08)" stroke="#33cc33"/>
  <text x="575" y="247" fill="#ffffff" font-size="12">48-Byte Protected JS/CSS</text>

  <rect x="565" y="275" width="190" height="85" rx="6" fill="#1f801f" stroke="#33cc33"/>
  <text x="575" y="295" fill="#ffffff" font-size="12" font-weight="bold">Browser Rendering Flow</text>
  <text x="575" y="312" fill="#e0f5e0" font-size="10">1. Loader decrypts XOR content</text>
  <text x="575" y="327" fill="#e0f5e0" font-size="10">2. Injected styles render layout</text>
  <text x="575" y="342" fill="#e0f5e0" font-size="10">3. Interactive scripts initialize</text>

  <!-- Connector Lines -->
  <!-- Line 1: Source to Build Search System -->
  <path d="M 250 200 L 290 200 L 290 190 L 315 190" fill="none" stroke="#ff4d4d" stroke-width="1.5"/>
  <polygon points="315,190 307,186 307,194" fill="#ff4d4d"/>

  <!-- Line 2: Source to Obfuscator -->
  <path d="M 250 200 L 285 200 L 285 310 L 315 310" fill="none" stroke="#ff4d4d" stroke-width="1.5"/>
  <polygon points="315,310 307,306 307,314" fill="#ff4d4d"/>

  <!-- Line 3: Search compiler output -->
  <path d="M 400 220 L 400 280" fill="none" stroke="#4d94ff" stroke-width="1.5" stroke-dasharray="4 4"/>
  <polygon points="400,280 396,272 404,272" fill="#4d94ff"/>

  <!-- Line 4: Obfuscator outputs to Root -->
  <path d="M 485 310 L 530 310 L 530 240 L 565 240" fill="none" stroke="#4d94ff" stroke-width="1.5"/>
  <polygon points="565,240 557,236 557,244" fill="#4d94ff"/>

  <path d="M 485 310 L 530 310 L 530 190 L 565 190" fill="none" stroke="#4d94ff" stroke-width="1.5"/>
  <polygon points="565,190 557,186 557,194" fill="#4d94ff"/>
</svg>
```

---

## 🔄 Complete Development & Compilation Workflow

To publish updates to the web portal, developers use the following cycle:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 260" width="100%" style="background-color:#1e1e24; border-radius:12px; font-family:'Segoe UI', sans-serif;">
  <!-- Grid Background -->
  <rect width="100%" height="100%" fill="#121214"/>
  <circle cx="50" cy="50" r="150" fill="#cc0000" opacity="0.04" filter="blur(50px)"/>
  <circle cx="700" cy="200" r="120" fill="#0066ff" opacity="0.04" filter="blur(40px)"/>

  <!-- Phase Nodes -->
  <!-- Phase 1 -->
  <circle cx="100" cy="120" r="40" fill="#2d2d35" stroke="#ff4d4d" stroke-width="2"/>
  <text x="100" y="115" fill="#ffffff" font-weight="bold" font-size="20" text-anchor="middle">01</text>
  <text x="100" y="132" fill="#ff4d4d" font-size="10" font-weight="bold" text-anchor="middle">EDIT</text>
  <text x="100" y="190" fill="#ffffff" font-weight="bold" font-size="13" text-anchor="middle">Edit Clean Code</text>
  <text x="100" y="208" fill="#a0a0a8" font-size="10" text-anchor="middle">Inside backup_original_code/</text>

  <!-- Phase 2 -->
  <circle cx="300" cy="120" r="40" fill="#2d2d35" stroke="#4d94ff" stroke-width="2"/>
  <text x="300" y="115" fill="#ffffff" font-weight="bold" font-size="20" text-anchor="middle">02</text>
  <text x="300" y="132" fill="#4d94ff" font-size="10" font-weight="bold" text-anchor="middle">INDEX</text>
  <text x="300" y="190" fill="#ffffff" font-weight="bold" font-size="13" text-anchor="middle">Compile Search Data</text>
  <text x="300" y="208" fill="#a0a0a8" font-size="10" text-anchor="middle">python build_search_system.py</text>

  <!-- Phase 3 -->
  <circle cx="500" cy="120" r="40" fill="#2d2d35" stroke="#a366ff" stroke-width="2"/>
  <text x="500" y="115" fill="#ffffff" font-weight="bold" font-size="20" text-anchor="middle">03</text>
  <text x="500" y="132" fill="#a366ff" font-size="10" font-weight="bold" text-anchor="middle">ENCRYPT</text>
  <text x="500" y="190" fill="#ffffff" font-weight="bold" font-size="13" text-anchor="middle">XOR Obfuscation</text>
  <text x="500" y="208" fill="#a0a0a8" font-size="10" text-anchor="middle">python obfuscator.py</text>

  <!-- Phase 4 -->
  <circle cx="700" cy="120" r="40" fill="#2d2d35" stroke="#33cc33" stroke-width="2"/>
  <text x="700" y="115" fill="#ffffff" font-weight="bold" font-size="20" text-anchor="middle">04</text>
  <text x="700" y="132" fill="#33cc33" font-size="10" font-weight="bold" text-anchor="middle">DEPLOY</text>
  <text x="700" y="190" fill="#ffffff" font-weight="bold" font-size="13" text-anchor="middle">Static Server Publish</text>
  <text x="700" y="208" fill="#a0a0a8" font-size="10" text-anchor="middle">Commit root files to hosting</text>

  <!-- Connections -->
  <path d="M 140 120 L 260 120" fill="none" stroke="#a0a0a8" stroke-width="2" stroke-dasharray="5 5"/>
  <polygon points="260,120 252,116 252,124" fill="#a0a0a8"/>

  <path d="M 340 120 L 460 120" fill="none" stroke="#a0a0a8" stroke-width="2" stroke-dasharray="5 5"/>
  <polygon points="460,120 452,116 452,124" fill="#a0a0a8"/>

  <path d="M 540 120 L 660 120" fill="none" stroke="#a0a0a8" stroke-width="2" stroke-dasharray="5 5"/>
  <polygon points="660,120 652,116 652,124" fill="#a0a0a8"/>
</svg>
```

### Step 1: Modifying Clean Source Files
All development is isolated to [backup_original_code](file:///c:/Users/rocks/OneDrive/Desktop/SFI/backup_original_code). 
- Modifying JS scripts and style templates here protects them from unintended data loss. 
- Editing pages in the project root directly is an anti-pattern, as any execution of `obfuscator.py` will overwrite root files with encrypted builds.

### Step 2: Running Content Parsing & Search Indexing
- Run `build_search_system.py`. 
- This script processes all HTML pages in [backup_original_code](file:///c:/Users/rocks/OneDrive/Desktop/SFI/backup_original_code).
- It extracts text titles, headings, and description tags.
- It loads raw JSON list datasets like `martyrs_data.js` and `press_data.js`.
- It saves the combined token data into a client-side search index file: `search_data.js` in the backup directory.

### Step 3: Run Layout Crypter & Obfuscator
- Run `obfuscator.py`.
- Copies clean CSS and JS assets from the backup directory into the root, replacing stylesheet links in HTML files with inline `<style>` and `<script>` blocks.
- XOR-encrypts the inlined payload using a random, 16-character alphanumeric key.
- Base64-encodes the encrypted payload.
- Injects a self-decrypting runtime JS bootloader into the `<body>` of the page.
- Replaces original root JS/CSS files with stub denial messages (`/* Source code is protected. Access Denied. */`) to prevent asset leakage.

---

## 🔒 Security Architecture: Client-Side Obfuscation

The SFI portal relies on client-side compilation to protect visual assets and HTML hierarchy from generic web crawlers, scrapers, and quick source copying.

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 220" width="100%" style="background-color:#1e1e24; border-radius:12px; font-family:'Segoe UI', sans-serif;">
  <rect width="100%" height="100%" fill="#121214"/>
  <!-- Decorative background shapes -->
  <rect x="50" y="40" width="200" height="140" rx="8" fill="rgba(255,255,255,0.03)" stroke="#ff4d4d" stroke-opacity="0.3"/>
  <rect x="550" y="40" width="200" height="140" rx="8" fill="rgba(255,255,255,0.03)" stroke="#33cc33" stroke-opacity="0.3"/>

  <!-- Left: Obfuscated HTML Document Payload -->
  <text x="65" y="70" fill="#ff4d4d" font-size="12" font-weight="bold">Obfuscated Page Content</text>
  <rect x="65" y="85" width="170" height="8" rx="2" fill="#505058"/>
  <rect x="65" y="100" width="140" height="8" rx="2" fill="#505058"/>
  <text x="65" y="130" fill="#ffb3b3" font-size="10" font-family="monospace">&lt;script&gt;(XOR Decryptor)&lt;/script&gt;</text>
  <text x="65" y="145" fill="#a0a0a8" font-size="9" font-family="monospace">Encrypted payload = "aZ87xKs9L..."</text>

  <!-- Right: Decrypted Runtime DOM in Browser -->
  <text x="565" y="70" fill="#33cc33" font-size="12" font-weight="bold">Decrypted Document Object Model</text>
  <rect x="565" y="85" width="170" height="8" rx="2" fill="#33cc33" opacity="0.8"/>
  <rect x="565" y="100" width="150" height="8" rx="2" fill="#33cc33" opacity="0.8"/>
  <text x="565" y="130" fill="#e0f5e0" font-size="10" font-family="monospace">&lt;body&gt; (Fully Rendered)</text>
  <text x="565" y="145" fill="#a0a0a8" font-size="9" font-family="monospace">Styles &amp; scripts active</text>

  <!-- Middle Action -->
  <path d="M 280 110 L 520 110" fill="none" stroke="#4d94ff" stroke-width="2"/>
  <polygon points="520,110 512,106 512,114" fill="#4d94ff"/>
  <text x="400" y="90" fill="#4d94ff" font-size="11" font-weight="bold" text-anchor="middle">Runtime Decryption Cycle</text>
  <text x="400" y="135" fill="#ffffff" font-size="10" text-anchor="middle">document.write() injection</text>
  <text x="400" y="150" fill="#a0a0a8" font-size="9" font-style="italic" text-anchor="middle">Triggered immediately in body script</text>
</svg>
```

### Security Considerations for Developers:
1. **Design Boundary**: The XOR obfuscation pipeline is **not** a secure sandbox. Because the decryption key is bundled inside the HTML source script, any experienced user can read the key and extract the raw, readable layout and JS logic.
2. **Data Policy**: **Never** hardcode authorization tokens, backend API database passwords, or personal identification keys in the static pages or local JavaScript.
3. **No-JS Fallback**: If JavaScript is disabled in the browser, the decryptor block will not run, and the `<noscript>` tag will present a message prompting the user to enable JavaScript.

---

## ⚡ Performance Optimization Guidelines

To keep page load speeds fast, follow these layout rules:
* **Minimize Third-Party Dependencies**: Keep styling built on native Bootstrap 5 grid utility definitions and vanilla CSS.
* **Canvas Refresh Rates**: The interactive background particle script uses `requestAnimationFrame()` to sync frame refreshes with browser repaint cycles. Avoid complex loops or blocking tasks inside [Particles.animate](file:///c:/Users/rocks/OneDrive/Desktop/SFI/backup_original_code/script.js#L145-L224) to prevent frame drops.
* **Static Search Overhead**: Because client-side queries parse local search data, the compiled file `search_data.js` is loaded once. Keep data clean and avoid duplicate text fields to prevent file bloat.
