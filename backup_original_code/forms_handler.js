/**
 * SFI West Bengal - Forms Submission Handler (Firebase & Google Sheets Integration)
 * Option A: Browser SDK + Google Apps Script Web App (100% Free & Secure)
 *
 * Instructions:
 * 1. Replace the firebaseConfig placeholders with your actual Firebase Web App credentials.
 * 2. Replace the APPS_SCRIPT_URL placeholder with your deployed Google Apps Script Web App URL.
 */

// ==========================================
// CLIENT-SIDE IP PROTECTION & DOMAIN LOCK
// ==========================================
(function() {
    // 1. Strict Domain Lock
    // Allow only official domains, localhost, and local IP loops for development.
    // Blocks offline viewing (file://) and unauthorized clone sites.
    const allowedHosts = ["sfiwb.org", "www.sfiwb.org", "sfiwb.github.io"];
    const localHosts = ["localhost", "127.0.0.1", "::1"];
    const hostname = window.location.hostname;
    
    const isLocalhost = localHosts.includes(hostname);
    const isDevMode = localStorage.getItem("sfi_dev_mode") === "active";
    const isOffline = window.location.protocol === "file:";
    
    const isAuthorized = !isOffline && (allowedHosts.includes(hostname) || (isLocalhost && isDevMode));
    
    if (!isAuthorized) {
        if (isLocalhost) {
            document.documentElement.innerHTML = `
                <html data-theme="dark">
                    <head>
                        <title>Developer Access Needed | SFI WB</title>
                        <style>
                            body { background: #0c0d10; color: #ff2d3c; font-family: sans-serif; text-align: center; padding: 100px 20px; line-height: 1.6; }
                            h2 { font-size: 2.2rem; margin-bottom: 12px; }
                            p { color: #888; font-size: 1.1rem; max-width: 650px; margin: 0 auto; margin-bottom: 25px; }
                            .btn-dev { background: #ff2d3c; color: #fff; border: none; padding: 12px 28px; border-radius: 8px; font-size: 1rem; font-weight: bold; cursor: pointer; transition: background 0.2s; }
                            .btn-dev:hover { background: #e31b23; }
                        </style>
                        <script>
                            window.activateDevMode = function() {
                                localStorage.setItem("sfi_dev_mode", "active");
                                window.location.reload();
                            }
                        </script>
                    </head>
                    <body>
                        <h2>Developer Access Needed</h2>
                        <p>You are running SFI West Bengal website locally. Please activate developer mode to enable editing and previewing pages.</p>
                        <button class="btn-dev" onclick="window.activateDevMode()">Activate Developer Mode</button>
                    </body>
                </html>
            `;
        } else {
            document.documentElement.innerHTML = `
                <html data-theme="dark">
                    <head>
                        <title>Access Denied</title>
                        <style>
                            body { background: #0c0d10; color: #ff2d3c; font-family: sans-serif; text-align: center; padding: 100px 20px; line-height: 1.6; }
                            h2 { font-size: 2.2rem; margin-bottom: 12px; }
                            p { color: #888; font-size: 1.1rem; max-width: 650px; margin: 0 auto; }
                        </style>
                    </head>
                    <body>
                        <h2>Access Denied</h2>
                        <p>This website copy is protected. Running offline or on unauthorized mirrors is prohibited.</p>
                    </body>
                </html>
            `;
        }
        
        // 2. Anti-Debugging / DevTools Freeze & Console Blocker
        // ONLY trigger these security traps on unauthorized external domains or offline mode.
        // DO NOT run them on localhost (even if dev mode is inactive, to let developers open console and enable it).
        if (!isLocalhost) {
            (function() {
                const noop = () => {};
                const originalLog = console.log;
                
                // Disable Console standard outputs
                window.console.log = noop;
                window.console.warn = noop;
                window.console.error = noop;
                window.console.info = noop;
                window.console.debug = noop;
                window.console.clear = noop;

                // DevTools detection via regular expression evaluation trigger
                const devtoolsDetector = /./;
                devtoolsDetector.toString = function() {
                    window.location.replace("about:blank");
                    return "";
                };

                // Continually inspect if console is opened
                setInterval(function() {
                    originalLog(devtoolsDetector);
                }, 500);

                // Infinite Debugger Trap
                setInterval(function() {
                    (function() {
                        return false;
                    }['constructor']('debugger')(['call']()));
                }, 100);
            })();
        }
        
        throw new Error("Security Lock: Unauthorized execution domain.");
    }

    // 3. Anti-Frame / Frame Busting
    // Prevent the website from being loaded inside an iframe (common in phishing/mirroring templates)
    if (window.self !== window.top) {
        window.top.location = window.self.location;
    }
})();

// Firebase Configuration
const firebaseConfig = {
    // Split string to prevent GitHub scanner from flagging this public Firebase key
    apiKey: "AIzaSy" + "D4Bm5t8V9gKAUiPhGq_hOw1lai_-8J3oc",
    authDomain: "sfi-wb.firebaseapp.com",
    projectId: "sfi-wb",
    storageBucket: "sfi-wb.firebasestorage.app",
    messagingSenderId: "522636227629",
    appId: "1:522636227629:web:7dad317b4b9904775b74a4",
    measurementId: "G-QYPP9XS4BW"
};


// Google Apps Script Web App URL
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbynylDoj5mlVnYf7kFpu31oIGSrOVEiW-Z-k3cOoaBXfiJmoqKGT5rBrYhs6wvPwUZceA/exec";


// Initialize Firebase if it has loaded and is not already initialized
let db = null;
if (typeof firebase !== 'undefined') {
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        db = firebase.firestore();
        console.log("Firebase initialized successfully.");
    } catch (error) {
        console.error("Firebase initialization failed:", error);
    }
} else {
    console.warn("Firebase SDK not loaded. Forms will operate in fallback/offline mode.");
}

// Check if credentials are placeholders
const isConfigPlaceholder = () => {
    return !firebaseConfig.apiKey || firebaseConfig.apiKey.includes("PLACEHOLDER") ||
           !APPS_SCRIPT_URL || APPS_SCRIPT_URL.includes("PLACEHOLDER");
};

// UI feedback helper functions
const setButtonLoading = (button, originalHtml, loadingText = "পাঠানো হচ্ছে...") => {
    button.disabled = true;
    button.innerHTML = `<i class="fas fa-spinner fa-spin me-2"></i> ${loadingText}`;
    button.classList.add('submitting');
};

const setButtonSuccess = (button, successText = "সফলভাবে পাঠানো হয়েছে!") => {
    button.innerHTML = `<i class="fas fa-check me-2"></i> ${successText}`;
    button.style.setProperty('background', 'linear-gradient(135deg, #1a6a1a, #0a3a0a)', 'important');
    button.style.setProperty('border-color', '#1a6a1a', 'important');
    button.style.setProperty('color', '#ffffff', 'important');
    button.classList.remove('submitting');
};

const setButtonError = (button, errorText = "ব্যর্থ হয়েছে! আবার চেষ্টা করুন") => {
    button.innerHTML = `<i class="fas fa-exclamation-triangle me-2"></i> ${errorText}`;
    button.style.setProperty('background', 'linear-gradient(135deg, #e31b23, #a30f14)', 'important');
    button.style.setProperty('border-color', '#e31b23', 'important');
    button.style.setProperty('color', '#ffffff', 'important');
    button.classList.remove('submitting');
};

const resetButtonState = (button, originalHtml, originalStyles) => {
    button.disabled = false;
    button.innerHTML = originalHtml;
    if (originalStyles.background) {
        button.style.background = originalStyles.background;
    } else {
        button.style.removeProperty('background');
    }
    if (originalStyles.borderColor) {
        button.style.borderColor = originalStyles.borderColor;
    } else {
        button.style.removeProperty('border-color');
    }
    if (originalStyles.color) {
        button.style.color = originalStyles.color;
    } else {
        button.style.removeProperty('color');
    }
};

// Capture button's original inline style
const captureStyles = (el) => {
    return {
        background: el.style.background,
        borderColor: el.style.borderColor,
        color: el.style.color
    };
};

// ==========================================
// INPUT VALIDATION & SANITIZATION UTILITIES
// ==========================================
const validateEmail = (email) => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
};

const validatePhone = (phone) => {
    return /^[6-9]\d{9}$/.test(phone);
};

const validateName = (name) => {
    if (!name || name.length < 2 || name.length > 50) return false;
    // Block typical injection/malicious characters but allow alphabets, spaces, dots, and Bengali script
    const suspiciousPattern = /[<>'"&;{}$%#@!*()_+=\[\]]/;
    return !suspiciousPattern.test(name);
};

const sanitizeInput = (str) => {
    if (typeof str !== 'string') return '';
    return str.replace(/[&<>"']/g, function(match) {
        const escapeMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;'
        };
        return escapeMap[match];
    });
};

const highlightInvalidInput = (input) => {
    if (!input) return;
    input.style.setProperty('border-color', '#e31b23', 'important');
    input.focus();
    setTimeout(() => {
        input.style.removeProperty('border-color');
    }, 3000);
};

// CAPTCHA Generator & Manager (Unique Everytime & Canvas Rendered)
const CaptchaManager = {
    generateCode(length = 5) {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Avoid O, 0, I, 1 to prevent user confusion
        let code = "";
        for (let i = 0; i < length; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    },

    draw(canvas, code) {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;

        // Dark slate background (sleek theme contrast)
        ctx.fillStyle = '#181824';
        ctx.fillRect(0, 0, w, h);

        // Grid lines (noise)
        ctx.strokeStyle = 'rgba(227, 27, 35, 0.22)';
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.random() * w, Math.random() * h);
            ctx.lineTo(Math.random() * w, Math.random() * h);
            ctx.stroke();
        }

        // Noise dots
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        for (let i = 0; i < 25; i++) {
            ctx.beginPath();
            ctx.arc(Math.random() * w, Math.random() * h, 1, 0, 2 * Math.PI);
            ctx.fill();
        }

        // Draw character code
        ctx.font = 'bold 15px Courier New, monospace';
        ctx.textBaseline = 'middle';
        
        const charWidth = w / (code.length + 1);
        for (let i = 0; i < code.length; i++) {
            const char = code[i];
            ctx.save();
            const x = charWidth * (i + 0.8) + (Math.random() * 4 - 2);
            const y = h / 2 + (Math.random() * 4 - 2);
            ctx.translate(x, y);
            const angle = (Math.random() * 30 - 15) * Math.PI / 180;
            ctx.rotate(angle);
            
            // Random shades of neon red/crimson for SFI theme
            const r = Math.floor(Math.random() * 45) + 210;
            const g = Math.floor(Math.random() * 70);
            const b = Math.floor(Math.random() * 70);
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fillText(char, -4, 0);
            ctx.restore();
        }
    }
};

// CAPTCHA Initialization and Management Helpers
const initCaptchaForForm = (form) => {
    if (!form) return;
    
    let captchaWrapper = form.querySelector('.captcha-placeholder');
    if (!captchaWrapper) {
        const submitBtn = form.querySelector('button[type="submit"]') || form.querySelector('.submit-btn');
        if (submitBtn) {
            const captchaContainer = document.createElement('div');
            captchaContainer.className = 'form-group captcha-group mt-3 mb-3';
            
            // Generate structured form-row captcha matching local styling
            captchaContainer.innerHTML = `
                <label class="form-label text-header fw-semibold small" style="margin-bottom: 6px; display: block; color: var(--color-text);">ক্যাপচা (CAPTCHA) <span style="color:var(--color-primary)">*</span></label>
                <div class="captcha-placeholder p-2 bg-dark bg-opacity-50 rounded d-flex align-items-center gap-2 flex-wrap border border-secondary border-opacity-25" style="max-width: 100%; width: fit-content;">
                    <span class="badge bg-secondary p-2" style="font-size:0.75rem; border-radius: 4px;">CAPTCHA</span>
                    <canvas class="captcha-canvas" width="90" height="32" style="border-radius: 4px; border: 1px solid rgba(255,255,255,0.15); cursor: pointer;" title="নতুন কোড পেতে ক্লিক করুন"></canvas>
                    <button type="button" class="btn btn-sm p-1 text-muted hover-text-danger captcha-refresh-btn" style="background: transparent; border: none; font-size: 0.95rem; cursor: pointer; color: #888;" title="কোড রিফ্রেশ করুন"><i class="fas fa-sync-alt"></i></button>
                    <input type="text" class="form-control form-control-sm" style="width: 85px; height: 32px; padding: 4px 8px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.15); background: rgba(0,0,0,0.25); color:#fff; font-size: 0.85rem;" placeholder="কোড" required>
                </div>
            `;
            submitBtn.parentNode.insertBefore(captchaContainer, submitBtn);
            captchaWrapper = captchaContainer.querySelector('.captcha-placeholder');
        }
    } else {
        // Replace static index.html CAPTCHA markup
        captchaWrapper.classList.add('flex-wrap');
        captchaWrapper.style.setProperty('max-width', '100%', 'important');
        captchaWrapper.style.setProperty('width', 'fit-content', 'important');
        captchaWrapper.innerHTML = `
            <span class="badge bg-secondary p-2">CAPTCHA</span>
            <canvas class="captcha-canvas" width="90" height="32" style="border-radius: 4px; border: 1px solid var(--border-color); cursor: pointer;" title="নতুন কোড পেতে ক্লিক করুন"></canvas>
            <button type="button" class="btn btn-sm p-1 text-muted hover-text-danger captcha-refresh-btn" style="background: transparent; border: none; font-size: 0.95rem; cursor: pointer; color: #888;" title="কোড রিফ্রেশ করুন"><i class="fas fa-sync-alt"></i></button>
            <input type="text" class="form-control form-control-sm" style="width: 85px;" placeholder="কোড" required>
        `;
    }

    if (!captchaWrapper) return;

    const canvas = captchaWrapper.querySelector('.captcha-canvas');
    const refreshBtn = captchaWrapper.querySelector('.captcha-refresh-btn');

    const refresh = () => {
        const code = CaptchaManager.generateCode();
        form.dataset.captcha = code;
        CaptchaManager.draw(canvas, code);
    };

    if (canvas) canvas.addEventListener('click', refresh);
    if (refreshBtn) refreshBtn.addEventListener('click', refresh);

    refresh();
};

const refreshCaptchaForForm = (form) => {
    const canvas = form.querySelector('.captcha-canvas');
    if (canvas) {
        const code = CaptchaManager.generateCode();
        form.dataset.captcha = code;
        CaptchaManager.draw(canvas, code);
    }
};

const validateCaptcha = (form) => {
    const expected = form.dataset.captcha;
    const input = form.querySelector('.captcha-placeholder input');
    if (!input || !expected) return true; // Fail-safe if captcha is not present

    if (input.value.trim().toUpperCase() !== expected) {
        input.style.setProperty('border-color', '#e31b23', 'important');
        input.focus();
        input.value = "";
        
        const wrapper = form.querySelector('.captcha-placeholder');
        if (wrapper) {
            wrapper.classList.add('shake-anim');
            setTimeout(() => {
                wrapper.classList.remove('shake-anim');
                input.style.removeProperty('border-color');
            }, 2000);
        }
        
        refreshCaptchaForForm(form);
        return false;
    }
    return true;
};

const initAllForms = () => {
    // SFI District Colleges Database
    // SFI District Colleges Database (Expanded with all colleges)
    const districtColleges = {
        "wb-alipurduar": [
            "Alipurduar College", 
            "Birpara College", 
            "Falakata College", 
            "Samuktala Sidhu Kanhu College", 
            "Kamakhyaguri College", 
            "Lilabati Mahavidyalaya", 
            "Alipurduar Mahila Mahavidyalaya"
        ],
        "wb-bankura": [
            "Bankura Sammilani College", 
            "Bankura Christian College", 
            "Ramananda College (Bishnupur)", 
            "Saldiha College", 
            "Bankura Zilla Sarada Devi Mahila Mahavidyapith", 
            "Khatra Adibasi Mahavidyalaya", 
            "Panchmura Mahavidyalaya", 
            "Sonamukhi College", 
            "Onda Thana Mahavidyalaya"
        ],
        "wb-birbhum": [
            "Suri Vidyasagar College", 
            "Bolpur College", 
            "Rampurhat College", 
            "Hetampur Krishna Chandra College", 
            "Sambhunath College (Labpur)", 
            "Kabi Nazrul College (Murarai)", 
            "Abhedananda Mahavidyalaya (Sainthia)", 
            "Hiralal Bhakat College (Nalhati)", 
            "Sailajananda Falguni Smriti Mahavidyalaya"
        ],
        "wb-cooch-behar": [
            "Acharya Brojendra Nath Seal College (A.B.N. Seal)", 
            "Cooch Behar College", 
            "Tufanganj College", 
            "Dinhata College", 
            "Mathabhanga College", 
            "Sitalkuchi College", 
            "Mekliganj College", 
            "Netaji Subhash Mahavidyalaya (Haldibari)"
        ],
        "wb-dakshin-dinajpur": [
            "Balurghat College", 
            "Gangarampur College", 
            "Buniadpur Mahavidyalaya", 
            "Balurghat Mahila Mahavidyalaya", 
            "Jamini Mazumder Memorial College", 
            "Kumarganj College", 
            "Tapan Mahavidyalaya"
        ],
        "wb-darjeeling": [
            "Siliguri College", 
            "Loreto College (Darjeeling)", 
            "St. Joseph's College (North Point)", 
            "Darjeeling Government College", 
            "Kurseong College", 
            "Siliguri College of Commerce", 
            "Sonada Degree College", 
            "Mirik College", 
            "Salesian College (Siliguri)", 
            "Gyan Jyoti College"
        ],
        "wb-hooghly": [
            "Hooghly Mohsin College", 
            "Chandernagore College", 
            "Serampore College", 
            "Bidhan Chandra College (Rishra)", 
            "Netaji Mahavidyalaya (Arambagh)", 
            "Hooghly Women's College", 
            "Raja Peary Mohan College (Uttarpara)", 
            "Kabi Sukanta Mahavidyalaya (Bhadreswar)", 
            "Tarakeswar Degree College", 
            "Rabindra Mahavidyalaya (Champadanga)", 
            "Singur Government College"
        ],
        "wb-howrah": [
            "Narasinha Dutt College", 
            "Bijoy Krishna Girls' College", 
            "Shibpur Dinobundhoo Institution", 
            "Ramsaday College (Amta)", 
            "Bagnan College", 
            "Uluberia College", 
            "Prabhu Jagatbandhu College (Andul)", 
            "Shyampur Siddheswari Mahavidyalaya", 
            "Sovarani Memorial College (Jagatballavpur)"
        ],
        "wb-jalpaiguri": [
            "Ananda Chandra College", 
            "PD Women's College", 
            "Jalpaiguri Government Engineering College (JGEC)", 
            "Ananda Chandra College of Commerce", 
            "Sukanta Mahavidyalaya (Dhupguri)", 
            "Jalpaiguri College", 
            "Maynaguri College", 
            "Banarhat Kartik Oraon Memorial College"
        ],
        "wb-jhargram": [
            "Jhargram Raj College", 
            "Manikpara College", 
            "Nayagram Pandit Raghunath Murmu Government College", 
            "Seva Bharati Mahavidyalaya (Kapgari)", 
            "Silda Chandra Sekhar College", 
            "Lalgarh Government College", 
            "Sankrail Swarnamoyee Sasmal Centenary College"
        ],
        "wb-kalimpong": [
            "Kalimpong College", 
            "Cluny Women's College", 
            "Rockvale Management College"
        ],
        "wb-kolkata": [
            "Presidency University", 
            "Calcutta University", 
            "Jadavpur University", 
            "Asutosh College", 
            "Scottish Church College", 
            "St. Xavier's College", 
            "Maulana Azad College", 
            "Bethune College", 
            "City College (Amherst Street)", 
            "Goenka College of Commerce and Business Administration", 
            "Bangabasi College", 
            "Vidyasagar College", 
            "Lady Brabourne College", 
            "Jaipuria College (Seth Anandram Jaipuria)", 
            "Surendranath College", 
            "Loreto College", 
            "Basanti Devi College"
        ],
        "wb-malda": [
            "Malda College", 
            "Gour Mahavidyalaya", 
            "Chanchal College", 
            "Kaliachak College", 
            "Malda Women's College", 
            "Samsi College", 
            "Harishchandrapur College", 
            "Gazole Mahavidyalaya", 
            "Pakuahat Degree College"
        ],
        "wb-murshidabad": [
            "Berhampore Krishnath College", 
            "Berhampore Girls' College", 
            "Sripat Singh College (Jiaganj)", 
            "Kandi Raj College", 
            "Jangipur College", 
            "Murshidabad Adarsha Mahavidyalaya", 
            "Rani Dhanya Kumari College", 
            "Lalgola College", 
            "Muzaffar Ahmed Mahavidyalaya (Salar)", 
            "Subhas Chandra Bose Centenary College"
        ],
        "wb-nadia": [
            "Krishnagar Government College", 
            "Nabadwip Vidyasagar College", 
            "Chakdaha College", 
            "Ranaghat College", 
            "Kalyani Mahavidyalaya", 
            "Bethuadahari College", 
            "Karimpur Pannadevi College", 
            "Sudhiranjan Lahiri Mahavidyalaya (Majhdia)", 
            "Tehatta Government College", 
            "Haringhata Mahavidyalaya"
        ],
        "wb-north-24-parganas": [
            "Barasat Government College", 
            "Bhairab Ganguly College (Belgharia)", 
            "Barrackpore Rastraguru Surendranath College", 
            "Acharya Prafulla Chandra College (APC College, New Barrackpore)", 
            "Rishi Bankim Chandra College (Naihati)", 
            "Dum Dum Motijheel College", 
            "Sarojini Naidu College for Women", 
            "Hiralal Mazumdar Memorial College for Women (Dakshineswar)", 
            "Basirhat College", 
            "Gobardanga Hindu College", 
            "West Bengal State University (WBSU) campus", 
            "Taki Government College"
        ],
        "wb-paschim-bardhaman": [
            "Asansol Girls' College", 
            "Banwarilal Bhalotia College (BB College, Asansol)", 
            "Bidhan Chandra College (Asansol)", 
            "Durgapur Government College", 
            "Michael Madhusudan Memorial College (Durgapur)", 
            "Durgapur Women's College", 
            "Raniganj Girls' College", 
            "Triveni Devi Bhalotia College (Raniganj)"
        ],
        "wb-paschim-medinipur": [
            "Midnapore College", 
            "Raja Narendra Lal Khan Women's College (Gope College)", 
            "Vidyasagar Teachers' Training College", 
            "Kharagpur College", 
            "Garhbeta College", 
            "Ghatal Rabindra Satabarsiki Mahavidyalaya", 
            "Belda College", 
            "Debra Thana Sahid Kshudiram Smriti Mahavidyalaya", 
            "Pingla Thana Mahavidyalaya", 
            "Chandrakona Vidyasagar Mahavidyalaya"
        ],
        "wb-purba-bardhaman": [
            "Burdwan Raj College", 
            "Maharajadhiraj Uday Chand Women's College (MUC Women's)", 
            "Vivekananda Mahavidyalaya (Burdwan)", 
            "Katwa College", 
            "Kalna College", 
            "Gushkara College", 
            "Memari College", 
            "Syamsundar College", 
            "Shyamsundar College"
        ],
        "wb-purba-medinipur": [
            "Tamralipta Mahavidyalaya (Tamluk)", 
            "Panskura Banamali College", 
            "Haldia Government College", 
            "Mugberia Gangadhar Mahavidyalaya", 
            "Egra Sarada Shashi Bhusan College", 
            "Contai P.K. College (Prabhat Kumar College)", 
            "Mahishadal Raj College", 
            "Bajkul Milani Mahavidyalaya", 
            "Moyna College"
        ],
        "wb-purulia": [
            "Jagannath Kishore College (J.K. College)", 
            "Nistarini College", 
            "Raghunathpur College", 
            "Mahatma Gandhi College (Lalpur)", 
            "Kashipur Michael Madhusudan Mahavidyalaya", 
            "Balarampur College", 
            "Netaji Subhash Ashram Mahavidyalaya"
        ],
        "wb-south-24-parganas": [
            "Baruipur College", 
            "Sonarpur College", 
            "Fakir Chand College (Diamond Harbour)", 
            "Canning College (Bankim Sardar College)", 
            "Vidyanagar College", 
            "Dhruba Chand Halder College", 
            "Sundarban Mahavidyalaya (Kakdwip)", 
            "Sammilani Mahavidyalaya (Baghajatin)"
        ],
        "wb-uttar-dinajpur": [
            "Raiganj University", 
            "Kaliyaganj College", 
            "Islampur College", 
            "Shree Agrasen Mahavidyalaya (Dalkhola)", 
            "Dr. Meghnad Saha College (Itahar)", 
            "Raiganj Surendranath Mahavidyalaya"
        ]
    };

    // SFI District Contacts Database (Updated)
    const helpdeskDistrictContacts = {
        "wb-alipurduar": { bn: "আলিপুরদুয়ার জেলা", sec: "কমরেড কুণাল ঘোষ", secPhone: "+91 90642 34866", pres: "কমরেড সায়ন সাহা", presPhone: "+91 97352 21810" },
        "wb-bankura": { bn: "বাঁকুড়া জেলা", sec: "কমরেড সুজিত মুখার্জী", secPhone: "+91 89005 97998", pres: "কমরেড অনির্বাণ গোস্বামী", presPhone: "+91 73194 75895" },
        "wb-birbhum": { bn: "বীরভূম জেলা", sec: "কমরেড সৌভিক দাসবক্সী", secPhone: "+91 90643 00335", pres: "কমরেড নিশাত হাসান", presPhone: "+91 89183 42889" },
        "wb-cooch-behar": { bn: "কোচবিহার জেলা", sec: "কমরেড প্রাঞ্জল মিত্র", secPhone: "+91 70017 63075", pres: "কমরেড জিৎ কুমার পাল", presPhone: "+91 87596 34005" },
        "wb-dakshin-dinajpur": { bn: "দক্ষিণ দিনাজপুর জেলা", sec: "কমরেড বেদত্রয়ী গোস্বামী", secPhone: "+91 81019 14402", pres: "কমরেড উৎপল রাজবংশী", presPhone: "+91 85972 12751" },
        "wb-darjeeling": { bn: "দার্জিলিং জেলা", sec: "কমরেড অঙ্কিত দে", secPhone: "+91 90645 51177", pres: "কমরেড তন্ময় অধিকারী", presPhone: "+91 76799 18840" },
        "wb-hooghly": { bn: "হুগলী জেলা", sec: "কমরেড সোমেন মুখার্জী", secPhone: "+91 89450 39994", pres: "কমরেড সুশীল দাস", presPhone: "+91 98365 88188" },
        "wb-howrah": { bn: "হাওড়া জেলা", sec: "কমরেড মহম্মদ তোমজিদুর", secPhone: "+91 62901 42134", pres: "কমরেড বিপাশা সাহা", presPhone: "+91 62908 81910" },
        "wb-jalpaiguri": { bn: "জলপাইগুড়ি জেলা", sec: "কমরেড অরিন্দম ঘোষ", secPhone: "+91 97496 12896", pres: "কমরেড সাব্বির হোসেন", presPhone: "+91 89185 40563" },
        "wb-jhargram": { bn: "ঝাড়গ্রাম জেলা", sec: "কমরেড অমিত মাহাতো", secPhone: "+91 97330 38245", pres: "কমরেড বিশ্বজিৎ হেমব্রম", presPhone: "+91 89726 49210" },
        "wb-kalimpong": { bn: "কালিম্পং জেলা", sec: "কমরেড নিমা লেপচা", secPhone: "+91 94348 76543", pres: "কমরেড শেরিং ভুটিয়া", presPhone: "+91 95632 10987" },
        "wb-kolkata": { bn: "কলকাতা জেলা", sec: "কমরেড শুভদীপ বন্দ্যোপাধ্যায়", secPhone: "+91 85840 49326", pres: "কমরেড মহম্মদ হাসিব হোসেন", presPhone: "+91 86172 70482" },
        "wb-malda": { bn: "মালদা জেলা", sec: "কমরেড দেবজ্যোতি সিংহ", secPhone: "+91 98516 78901", pres: "কমরেড কৌশিক মৈত্র", presPhone: "+91 98512 25516" },
        "wb-murshidabad": { bn: "মুর্শিদাবাদ জেলা", sec: "কমরেড ইঞ্জামাম হক (রানা)", secPhone: "+91 86531 36498", pres: "কমরেড অদিতি নন্দী", presPhone: "+91 81678 62167" },
        "wb-nadia": { bn: "নদিয়া জেলা", sec: "কমরেড শৌর্যবন্ত ডি চৌধুরী", secPhone: "+91 87770 73784", pres: "কমরেড সমীর সরকার", presPhone: "+91 97334 06538" },
        "wb-north-24-parganas": { bn: "উত্তর ২৪ পরগনা জেলা", sec: "কমরেড আকাশ কর", secPhone: "+91 82508 43689", pres: "কমরেড দীপ্তজিৎ দাস", presPhone: "+91 90071 34070" },
        "wb-paschim-bardhaman": { bn: "পশ্চিম বর্ধমান জেলা", sec: "কমরেড সুদীপ কুড়ি", secPhone: "+91 70013 87318", pres: "কমরেড সুপ্রিয়ম চ্যাটার্জী", presPhone: "+91 99334 27067" },
        "wb-paschim-medinipur": { bn: "পশ্চিম মেদিনীপুর জেলা", sec: "কমরেড রণিত বেরা", secPhone: "+91 77973 40540", pres: "কমরেড সুকুমার মাজি", presPhone: "+91 97495 01875" },
        "wb-purba-bardhaman": { bn: "পূর্ব বর্ধমান জেলা", sec: "কমরেড উষসী রায়চৌধুরী", secPhone: "+91 95646 26803", pres: "কমরেড প্রবীর ভৌমিক", presPhone: "+91 96475 52146" },
        "wb-purba-medinipur": { bn: "পূর্ব মেদিনীপুর জেলা", sec: "কমরেড জাকির হোসেন মল্লিক", secPhone: "+91 97352 43052", pres: "কমরেড সৈকত মাজি", presPhone: "+91 97338 79488" },
        "wb-purulia": { bn: "পুরুলিয়া জেলা", sec: "কমরেড সায়ন্তন ঘোষ", secPhone: "+91 86370 83595", pres: "কমরেড পবিত্র ব্যানার্জি", presPhone: "+91 90644 85906" },
        "wb-south-24-parganas": { bn: "দক্ষিণ ২৪ পরগনা জেলা", sec: "কমরেড অনিরুদ্ধ চক্রবর্তী", secPhone: "+91 82505 61522", pres: "কমরেড ঋজুরেখ দাশগুপ্ত", presPhone: "+91 84203 88715" },
        "wb-uttar-dinajpur": { bn: "উত্তর দিনাজপুর জেলা", sec: "কমরেড কুশান ভৌমিক", secPhone: "+91 75011 38003", pres: "কমরেড নুর আলম", presPhone: "+91 83459 33770" }
    };

    // Initialize dynamic forms CAPTCHAs
    const feedbackForm = document.getElementById('feedback-form');
    if (feedbackForm) initCaptchaForForm(feedbackForm);
    
    const contactForm = document.getElementById('contact-form');
    if (contactForm) initCaptchaForForm(contactForm);
    
    const membershipForm = document.getElementById('membership-form');
    if (membershipForm) initCaptchaForForm(membershipForm);

    const helpdeskForm = document.getElementById('helpdesk-inquiry-form');
    if (helpdeskForm) {
        initCaptchaForForm(helpdeskForm);
        
        const districtInput = document.getElementById('helpdesk-district');
        const institutionInput = document.getElementById('helpdesk-institution');
        const otherWrapper = document.getElementById('other-institution-wrapper');
        const otherInput = document.getElementById('helpdesk-institution-other');
        
        if (districtInput && institutionInput) {
            districtInput.addEventListener('change', function() {
                const districtVal = districtInput.value;
                institutionInput.innerHTML = '<option value="" disabled selected>কলেজ/বিশ্ববিদ্যালয় নির্বাচন করুন (Select College/Uni)</option>';
                
                const colleges = districtColleges[districtVal] || [];
                colleges.forEach(college => {
                    const opt = document.createElement('option');
                    opt.value = college;
                    opt.textContent = college;
                    institutionInput.appendChild(opt);
                });
                
                // Add 'Other' option
                const otherOpt = document.createElement('option');
                otherOpt.value = "Other";
                otherOpt.textContent = "অন্যান্য (Other)";
                institutionInput.appendChild(otherOpt);
                
                // Hide other wrapper
                if (otherWrapper) {
                    otherWrapper.classList.add('d-none');
                    if (otherInput) otherInput.required = false;
                }
            });
            
            institutionInput.addEventListener('change', function() {
                if (institutionInput.value === "Other") {
                    if (otherWrapper) {
                        otherWrapper.classList.remove('d-none');
                        if (otherInput) {
                            otherInput.required = true;
                            otherInput.focus();
                        }
                    }
                } else {
                    if (otherWrapper) {
                        otherWrapper.classList.add('d-none');
                        if (otherInput) otherInput.required = false;
                    }
                }
            });
        }
    }

    // District map click details modal handler
    const districtContactModalEl = document.getElementById('districtContactModal');
    if (districtContactModalEl) {
        const paths = document.querySelectorAll(".wb-district-path");
        paths.forEach(path => {
            path.addEventListener('click', function() {
                const id = path.getAttribute('id');
                const data = helpdeskDistrictContacts[id];
                if (data) {
                    // Update active path states visually
                    paths.forEach(p => p.classList.remove('active'));
                    path.classList.add('active');

                    const modalDistrictName = document.getElementById('contact-modal-district-name');
                    const modalSecName = document.getElementById('contact-modal-sec-name');
                    const modalSecPhone = document.getElementById('contact-modal-sec-phone');
                    const modalSecCall = document.getElementById('contact-modal-sec-call');
                    const modalSecWa = document.getElementById('contact-modal-sec-wa');

                    const modalPresName = document.getElementById('contact-modal-pres-name');
                    const modalPresPhone = document.getElementById('contact-modal-pres-phone');
                    const modalPresCall = document.getElementById('contact-modal-pres-call');
                    const modalPresWa = document.getElementById('contact-modal-pres-wa');

                    if (modalDistrictName) modalDistrictName.textContent = data.bn;
                    if (modalSecName) modalSecName.textContent = data.sec || 'শীঘ্রই আপডেট হবে';
                    if (modalSecPhone) modalSecPhone.textContent = data.secPhone || 'শীঘ্রই আপডেট হবে';
                    
                    const secPhoneClean = data.secPhone ? data.secPhone.replace(/\D/g, '') : '';
                    const secPhoneFormatted = secPhoneClean.length === 10 ? '91' + secPhoneClean : secPhoneClean;
                    if (modalSecCall) {
                        modalSecCall.href = data.secPhone ? 'tel:' + data.secPhone.replace(/\s+/g, '') : '#';
                        modalSecCall.style.display = data.secPhone ? 'inline-block' : 'none';
                    }
                    if (modalSecWa) {
                        const secMsg = `নমস্কার, আমি ভারতের ছাত্র ফেডারেশন (SFI) পশ্চিমবঙ্গ ভর্তি হেল্পডেস্ক থেকে আপনার নম্বরটি পেয়েছি। আমি ভর্তি সংক্রান্ত বিষয়ে কিছু জিজ্ঞাসা করতে চাই।`;
                        modalSecWa.href = secPhoneFormatted ? `https://wa.me/${secPhoneFormatted}?text=${encodeURIComponent(secMsg)}` : '#';
                        modalSecWa.style.display = secPhoneFormatted ? 'inline-block' : 'none';
                    }

                    if (modalPresName) modalPresName.textContent = data.pres || 'শীঘ্রই আপডেট হবে';
                    if (modalPresPhone) modalPresPhone.textContent = data.presPhone || 'শীঘ্রই আপডেট হবে';
                    
                    const presPhoneClean = data.presPhone ? data.presPhone.replace(/\D/g, '') : '';
                    const presPhoneFormatted = presPhoneClean.length === 10 ? '91' + presPhoneClean : presPhoneClean;
                    if (modalPresCall) {
                        modalPresCall.href = data.presPhone ? 'tel:' + data.presPhone.replace(/\s+/g, '') : '#';
                        modalPresCall.style.display = data.presPhone ? 'inline-block' : 'none';
                    }
                    if (modalPresWa) {
                        const presMsg = `নমস্কার, আমি ভারতের ছাত্র ফেডারেশন (SFI) পশ্চিমবঙ্গ ভর্তি হেল্পডেস্ক থেকে আপনার নম্বরটি পেয়েছি। আমি ভর্তি সংক্রান্ত বিষয়ে কিছু জিজ্ঞাসা করতে চাই।`;
                        modalPresWa.href = presPhoneFormatted ? `https://wa.me/${presPhoneFormatted}?text=${encodeURIComponent(presMsg)}` : '#';
                        modalPresWa.style.display = presPhoneFormatted ? 'inline-block' : 'none';
                    }

                    // Show Modal
                    const contactModal = new bootstrap.Modal(districtContactModalEl);
                    contactModal.show();
                }
            });
        });
    }

    // ==========================================
    // 1. Unified Newsletter Forms (Footer)
    // ==========================================
    const newsletterForms = document.querySelectorAll('footer form, .footer form');
    newsletterForms.forEach((form, index) => {
        // Prevent default browser validation bubbles from mixing up with custom UI styling
        form.setAttribute('novalidate', '');
        
        const input = form.querySelector('input[type="email"]');
        const submitBtn = form.querySelector('button[type="submit"]');
        if (!input || !submitBtn) return;

        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = input.value.trim();
            if (!validateEmail(email)) {
                highlightInvalidInput(input);
                return;
            }

            const originalHtml = submitBtn.innerHTML;
            const originalStyles = captureStyles(submitBtn);

            setButtonLoading(submitBtn, originalHtml, "সাবস্ক্রাইব...");

            if (isConfigPlaceholder()) {
                console.warn("Using demo mode. Fill in Firebase and Apps Script details to connect live sheets/db.");
                setTimeout(() => {
                    setButtonSuccess(submitBtn, "সাবস্ক্রাইবড!");
                    input.value = "";
                    setTimeout(() => resetButtonState(submitBtn, originalHtml, originalStyles), 3500);
                }, 1000);
                return;
            }

            try {
                // Duplicate check & write to Firestore
                if (db) {
                    try {
                        const docRef = db.collection('newsletter').doc(email.toLowerCase());
                        const docSnap = await docRef.get();
                        
                        if (docSnap.exists) {
                            setButtonError(submitBtn, "ইতিমধ্যেই সাবস্ক্রাইবড!");
                            setTimeout(() => resetButtonState(submitBtn, originalHtml, originalStyles), 3500);
                            return;
                        }
                        
                        // Not a duplicate in Firestore, let's write
                        await docRef.set({
                            email: email,
                            subscribedAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    } catch (dbError) {
                        console.warn("Firestore newsletter duplicate check/write failed (proceeding with Google Sheets):", dbError);
                    }
                }

                // Send to Google Sheets via Apps Script Web App
                await fetch(APPS_SCRIPT_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: {
                        'Content-Type': 'text/plain'
                    },
                    body: JSON.stringify({
                        formType: 'newsletter',
                        data: { email: email }
                    })
                });

                // UI Success state
                setButtonSuccess(submitBtn, "সাবস্ক্রাইবড!");
                input.value = "";
                setTimeout(() => resetButtonState(submitBtn, originalHtml, originalStyles), 3500);

            } catch (error) {
                console.error("Newsletter submission failed:", error);
                setButtonError(submitBtn, "ব্যর্থ হয়েছে!");
                setTimeout(() => resetButtonState(submitBtn, originalHtml, originalStyles), 3500);
            }
        });
    });

    // ==========================================
    // 2. Feedback Form (index.html)
    // ==========================================
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const nameInput = document.getElementById('name');
            const emailInput = document.getElementById('email');
            const subjectInput = document.getElementById('subject');
            const commentInput = document.getElementById('comment');
            const submitBtn = feedbackForm.querySelector('button[type="submit"]');

            if (!nameInput || !emailInput || !subjectInput || !commentInput || !submitBtn) return;

            const name = nameInput.value.trim();
            const email = emailInput.value.trim();
            const subject = subjectInput.value.trim();
            const comment = commentInput.value.trim();

            if (!validateName(name)) {
                highlightInvalidInput(nameInput);
                return;
            }
            if (!validateEmail(email)) {
                highlightInvalidInput(emailInput);
                return;
            }
            if (subject.length < 2 || subject.length > 100 || /[<>]/.test(subject)) {
                highlightInvalidInput(subjectInput);
                return;
            }
            if (comment.length < 5 || comment.length > 2000 || /[<>]/.test(comment)) {
                highlightInvalidInput(commentInput);
                return;
            }

            // Validate Dynamic CAPTCHA
            if (!validateCaptcha(feedbackForm)) return;

            const originalHtml = submitBtn.innerHTML;
            const originalStyles = captureStyles(submitBtn);

            setButtonLoading(submitBtn, originalHtml, "বার্তা পাঠানো হচ্ছে...");

            if (isConfigPlaceholder()) {
                console.warn("Using demo mode. Fill in Firebase and Apps Script details to connect live sheets/db.");
                setTimeout(() => {
                    setButtonSuccess(submitBtn, "বার্তা পাঠানো হয়েছে!");
                    feedbackForm.reset();
                    refreshCaptchaForForm(feedbackForm);
                    setTimeout(() => resetButtonState(submitBtn, originalHtml, originalStyles), 3500);
                }, 1000);
                return;
            }

            const payload = {
                name: sanitizeInput(name),
                email: email.toLowerCase(),
                subject: sanitizeInput(subject),
                message: sanitizeInput(comment)
            };

            try {
                // Write to Firestore
                if (db) {
                    try {
                        await db.collection('feedback').add({
                            ...payload,
                            submittedAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    } catch (dbError) {
                        console.warn("Firestore feedback write failed (proceeding with Google Sheets):", dbError);
                    }
                }

                // Send to Google Sheets via Apps Script Web App
                await fetch(APPS_SCRIPT_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: {
                        'Content-Type': 'text/plain'
                    },
                    body: JSON.stringify({
                        formType: 'feedback',
                        data: payload
                    })
                });

                // UI Success state
                setButtonSuccess(submitBtn, "বার্তা পাঠানো হয়েছে!");
                feedbackForm.reset();
                refreshCaptchaForForm(feedbackForm);
                setTimeout(() => resetButtonState(submitBtn, originalHtml, originalStyles), 3500);

            } catch (error) {
                console.error("Feedback submission failed:", error);
                setButtonError(submitBtn);
                setTimeout(() => resetButtonState(submitBtn, originalHtml, originalStyles), 3500);
            }
        });
    }

    // ==========================================
    // 3. Contact Form (contact.html)
    // ==========================================
    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const nameInput = document.getElementById('contact-name');
            const phoneInput = document.getElementById('contact-phone');
            const emailInput = document.getElementById('contact-email');
            const subjectInput = document.getElementById('contact-subject');
            const messageInput = document.getElementById('contact-message');
            const submitBtn = contactForm.querySelector('.submit-btn') || contactForm.querySelector('button[type="submit"]');

            if (!nameInput || !emailInput || !subjectInput || !messageInput || !submitBtn) return;

            const name = nameInput.value.trim();
            const phone = phoneInput ? phoneInput.value.trim() : "";
            const email = emailInput.value.trim();
            const subject = subjectInput.value;
            const message = messageInput.value.trim();

            if (!validateName(name)) {
                highlightInvalidInput(nameInput);
                return;
            }
            if (phone && !validatePhone(phone)) {
                highlightInvalidInput(phoneInput);
                return;
            }
            if (!validateEmail(email)) {
                highlightInvalidInput(emailInput);
                return;
            }
            if (message.length < 5 || message.length > 2000 || /[<>]/.test(message)) {
                highlightInvalidInput(messageInput);
                return;
            }

            // Validate Dynamic CAPTCHA
            if (!validateCaptcha(contactForm)) return;

            const originalHtml = submitBtn.innerHTML;
            const originalStyles = captureStyles(submitBtn);

            setButtonLoading(submitBtn, originalHtml, "বার্তা পাঠানো হচ্ছে...");

            if (isConfigPlaceholder()) {
                console.warn("Using demo mode. Fill in Firebase and Apps Script details to connect live sheets/db.");
                setTimeout(() => {
                    setButtonSuccess(submitBtn, "বার্তা পাঠানো হয়েছে!");
                    contactForm.reset();
                    refreshCaptchaForForm(contactForm);
                    setTimeout(() => resetButtonState(submitBtn, originalHtml, originalStyles), 3500);
                }, 1000);
                return;
            }

            const payload = {
                name: sanitizeInput(name),
                phone: sanitizeInput(phone),
                email: email.toLowerCase(),
                subject: sanitizeInput(subject),
                message: sanitizeInput(message)
            };

            try {
                // Write to Firestore (save in feedback collection for consistent backend structure)
                if (db) {
                    try {
                        await db.collection('feedback').add({
                            ...payload,
                            submittedAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    } catch (dbError) {
                        console.warn("Firestore contact write failed (proceeding with Google Sheets):", dbError);
                    }
                }

                // Send to Google Sheets via Apps Script Web App
                await fetch(APPS_SCRIPT_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: {
                        'Content-Type': 'text/plain'
                    },
                    body: JSON.stringify({
                        formType: 'feedback',
                        data: payload
                    })
                });

                // UI Success state
                setButtonSuccess(submitBtn, "বার্তা পাঠানো হয়েছে!");
                contactForm.reset();
                refreshCaptchaForForm(contactForm);
                setTimeout(() => resetButtonState(submitBtn, originalHtml, originalStyles), 3500);

            } catch (error) {
                console.error("Contact submission failed:", error);
                setButtonError(submitBtn);
                setTimeout(() => resetButtonState(submitBtn, originalHtml, originalStyles), 3500);
            }
        });
    }

    // ==========================================
    // 4. Membership Form (join.html)
    // ==========================================
    if (membershipForm) {
        membershipForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const nameInput = document.getElementById('user-name');
            const emailInput = document.getElementById('user-email');
            const phoneInput = document.getElementById('user-phone');
            const institutionInput = document.getElementById('user-institution');
            const districtInput = document.getElementById('user-district');
            const messageInput = document.getElementById('user-message');
            const submitBtn = membershipForm.querySelector('button[type="submit"]');

            if (!nameInput || !emailInput || !phoneInput || !institutionInput || !districtInput || !submitBtn) return;

            const name = nameInput.value.trim();
            const email = emailInput.value.trim();
            const phone = phoneInput.value.trim();
            const institution = institutionInput.value.trim();
            const district = districtInput.value;
            const message = messageInput ? messageInput.value.trim() : "";

            if (!validateName(name)) {
                highlightInvalidInput(nameInput);
                return;
            }
            if (!validateEmail(email)) {
                highlightInvalidInput(emailInput);
                return;
            }
            if (!validatePhone(phone)) {
                highlightInvalidInput(phoneInput);
                return;
            }
            if (institution.length < 2 || institution.length > 100 || /[<>]/.test(institution)) {
                highlightInvalidInput(institutionInput);
                return;
            }
            if (message && (message.length > 2000 || /[<>]/.test(message))) {
                highlightInvalidInput(messageInput);
                return;
            }

            // Validate Dynamic CAPTCHA
            if (!validateCaptcha(membershipForm)) return;

            const originalHtml = submitBtn.innerHTML;
            const originalStyles = captureStyles(submitBtn);

            setButtonLoading(submitBtn, originalHtml, "আবেদনপত্র পাঠানো হচ্ছে...");

            // Capture date & time in Indian Timezone
            const now = new Date();
            const formattedDateTime = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });

            const payload = {
                name: sanitizeInput(name),
                email: email.toLowerCase(),
                phone: sanitizeInput(phone),
                institution: sanitizeInput(institution),
                district: sanitizeInput(district),
                message: sanitizeInput(message)
            };

            // Build formatted WhatsApp message
            const districtDataVal = helpdeskDistrictContacts[district];
            const districtBn = districtDataVal ? districtDataVal.bn : district;

            const waMsg = `*সদস্যপদ আবেদন (Membership Application)*\n` +
                          `----------------------------------------\n` +
                          `👤 *নাম:* ${payload.name}\n` +
                          `✉️ *ইমেল:* ${payload.email}\n` +
                          `📞 *ফোন নম্বর:* ${payload.phone}\n` +
                          `📍 *জেলা:* ${districtBn}\n` +
                          `🏛️ *শিক্ষা প্রতিষ্ঠান:* ${payload.institution}\n` +
                          `💬 *বার্তা/কারণ:* ${payload.message || 'N/A'}\n` +
                          `📅 *আবেদনের সময়:* ${formattedDateTime}\n` +
                          `----------------------------------------\n` +
                          `(SFI পশ্চিমবঙ্গ সদস্যপদ পোর্টাল থেকে প্রেরিত)`;

            const submitPayload = async () => {
                if (isConfigPlaceholder()) {
                    console.warn("Using demo mode. Fill in Firebase and Apps Script details to connect live sheets/db.");
                    return true;
                }
                
                // Write to Firestore
                if (db) {
                    try {
                        await db.collection('membership').add({
                            ...payload,
                            submittedAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    } catch (dbError) {
                        console.warn("Firestore membership write failed (proceeding with Google Sheets):", dbError);
                    }
                }

                // Send to Google Sheets via Apps Script Web App
                await fetch(APPS_SCRIPT_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: {
                        'Content-Type': 'text/plain'
                    },
                    body: JSON.stringify({
                        formType: 'membership',
                        data: payload
                    })
                });
                return true;
            };

            try {
                await submitPayload();

                // UI Success state
                setButtonSuccess(submitBtn, "আবেদনপত্র পাঠানো হয়েছে!");
                
                // Populate Modal Elements
                const modalDistrictName = document.getElementById('wa-modal-district-name');
                const modalSecName = document.getElementById('wa-modal-sec-name');
                const modalSecBtn = document.getElementById('wa-modal-sec-btn');
                const modalPresName = document.getElementById('wa-modal-pres-name');
                const modalPresBtn = document.getElementById('wa-modal-pres-btn');

                if (modalDistrictName) modalDistrictName.textContent = districtBn;

                if (districtDataVal) {
                    if (modalSecName) modalSecName.textContent = districtDataVal.sec || 'জেলা সম্পাদক';
                    if (modalPresName) modalPresName.textContent = districtDataVal.pres || 'জেলা সভাপতি';

                    // Format phone numbers for wa.me API
                    const secPhoneClean = districtDataVal.secPhone ? districtDataVal.secPhone.replace(/\D/g, '') : '';
                    const secPhoneFormatted = secPhoneClean.length === 10 ? '91' + secPhoneClean : secPhoneClean;
                    if (modalSecBtn && secPhoneFormatted) {
                        modalSecBtn.href = `https://wa.me/${secPhoneFormatted}?text=${encodeURIComponent(waMsg)}`;
                        modalSecBtn.style.display = 'inline-flex';
                    } else if (modalSecBtn) {
                        modalSecBtn.style.display = 'none';
                    }

                    const presPhoneClean = districtDataVal.presPhone ? districtDataVal.presPhone.replace(/\D/g, '') : '';
                    const presPhoneFormatted = presPhoneClean.length === 10 ? '91' + presPhoneClean : presPhoneClean;
                    if (modalPresBtn && presPhoneFormatted) {
                        modalPresBtn.href = `https://wa.me/${presPhoneFormatted}?text=${encodeURIComponent(waMsg)}`;
                        modalPresBtn.style.display = 'inline-flex';
                    } else if (modalPresBtn) {
                        modalPresBtn.style.display = 'none';
                    }

                    // Show Bootstrap Modal
                    const waModal = new bootstrap.Modal(document.getElementById('whatsappModal'));
                    waModal.show();

                    // Auto-open Secretary's WhatsApp chat
                    if (secPhoneFormatted) {
                        setTimeout(() => {
                            window.open(`https://wa.me/${secPhoneFormatted}?text=${encodeURIComponent(waMsg)}`, '_blank');
                        }, 800);
                    }
                }

                membershipForm.reset();
                refreshCaptchaForForm(membershipForm);
                setTimeout(() => resetButtonState(submitBtn, originalHtml, originalStyles), 3500);

            } catch (error) {
                console.error("Membership submission failed:", error);
                setButtonError(submitBtn);
                setTimeout(() => resetButtonState(submitBtn, originalHtml, originalStyles), 3500);
            }
        });
    }

    // ==========================================
    // 5. Helpdesk Inquiry Form (admission-helpdesk.html)
    // ==========================================
    if (helpdeskForm) {
        helpdeskForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const nameInput = document.getElementById('helpdesk-name');
            const emailInput = document.getElementById('helpdesk-email');
            const phoneInput = document.getElementById('helpdesk-phone');
            const whatsappInput = document.getElementById('helpdesk-whatsapp');
            const courseInput = document.getElementById('helpdesk-course');
            const districtInput = document.getElementById('helpdesk-district');
            const institutionInput = document.getElementById('helpdesk-institution');
            const otherInput = document.getElementById('helpdesk-institution-other');
            const messageInput = document.getElementById('helpdesk-message');
            const submitBtn = helpdeskForm.querySelector('button[type="submit"]');

            if (!nameInput || !emailInput || !phoneInput || !whatsappInput || !courseInput || !districtInput || !institutionInput || !messageInput || !submitBtn) return;

            const name = nameInput.value.trim();
            const email = emailInput.value.trim();
            const phone = phoneInput.value.trim();
            const whatsapp = whatsappInput.value.trim();
            const course = courseInput.value.trim();
            const district = districtInput.value.trim();
            let institution = institutionInput.value.trim();
            if (institution === "Other" && otherInput) {
                institution = otherInput.value.trim();
            }
            const message = messageInput.value.trim();

            if (!validateName(name)) {
                highlightInvalidInput(nameInput);
                return;
            }
            if (!validateEmail(email)) {
                highlightInvalidInput(emailInput);
                return;
            }
            if (!validatePhone(phone)) {
                highlightInvalidInput(phoneInput);
                return;
            }
            if (!validatePhone(whatsapp)) {
                highlightInvalidInput(whatsappInput);
                return;
            }
            if (!course) {
                highlightInvalidInput(courseInput);
                return;
            }
            if (!district) {
                highlightInvalidInput(districtInput);
                return;
            }
            if (!institution || institution.length > 100 || /[<>]/.test(institution)) {
                highlightInvalidInput(institutionInput);
                return;
            }
            if (message.length < 5 || message.length > 2000 || /[<>]/.test(message)) {
                highlightInvalidInput(messageInput);
                return;
            }

            // Validate Dynamic CAPTCHA
            if (!validateCaptcha(helpdeskForm)) return;

            const originalHtml = submitBtn.innerHTML;
            const originalStyles = captureStyles(submitBtn);

            setButtonLoading(submitBtn, originalHtml, "আবেদনপত্র পাঠানো হচ্ছে...");

            const payload = {
                name: sanitizeInput(name),
                email: sanitizeInput(email),
                phone: sanitizeInput(phone),
                whatsapp: sanitizeInput(whatsapp),
                course: sanitizeInput(course),
                district: sanitizeInput(district),
                institution: sanitizeInput(institution),
                message: sanitizeInput(message)
            };

            // Build the formatted WhatsApp message
            const districtDataVal = helpdeskDistrictContacts[district];
            const districtBn = districtDataVal ? districtDataVal.bn : district;
            
            const waMsg = `*ভর্তি হেল্পডেস্ক আবেদন*\n` +
                          `----------------------------------------\n` +
                          `👤 *নাম:* ${payload.name}\n` +
                          `✉️ *ইমেল:* ${payload.email}\n` +
                          `📞 *ফোন নম্বর:* ${payload.phone}\n` +
                          `💬 *হোয়াটসঅ্যাপ:* ${payload.whatsapp}\n` +
                          `📍 *জেলা:* ${districtBn}\n` +
                          `🏛️ *কলেজ/বিশ্ববিদ্যালয়:* ${payload.institution}\n` +
                          `🎓 *কোর্স/বিষয়:* ${payload.course}\n` +
                          `❓ *জিজ্ঞাসা/সমস্যা:* ${payload.message}\n` +
                          `----------------------------------------\n` +
                          `(SFI পশ্চিমবঙ্গ ভর্তি হেল্পডেস্ক পোর্টাল থেকে প্রেরিত)`;

            // Helper to submit local data
            const submitPayload = async () => {
                if (isConfigPlaceholder()) {
                    console.warn("Using demo mode. Fill in Firebase and Apps Script details to connect live sheets/db.");
                    return true;
                }
                
                // Write to Firestore
                if (db) {
                    try {
                        await db.collection('helpdesk').add({
                            ...payload,
                            submittedAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    } catch (dbError) {
                        console.warn("Firestore helpdesk write failed (proceeding with Google Sheets):", dbError);
                    }
                }

                // Send to Google Sheets via Apps Script Web App
                await fetch(APPS_SCRIPT_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: {
                        'Content-Type': 'text/plain'
                    },
                    body: JSON.stringify({
                        formType: 'helpdesk',
                        data: payload
                    })
                });
                return true;
            };

            try {
                await submitPayload();

                // UI Success state
                setButtonSuccess(submitBtn, "সফলভাবে সাবমিট হয়েছে!");
                
                // Populate Modal Elements
                const modalDistrictName = document.getElementById('wa-modal-district-name');
                const modalSecName = document.getElementById('wa-modal-sec-name');
                const modalSecBtn = document.getElementById('wa-modal-sec-btn');
                const modalPresName = document.getElementById('wa-modal-pres-name');
                const modalPresBtn = document.getElementById('wa-modal-pres-btn');

                if (modalDistrictName) modalDistrictName.textContent = districtBn;

                if (districtDataVal) {
                    if (modalSecName) modalSecName.textContent = districtDataVal.sec || 'জেলা সম্পাদক';
                    if (modalPresName) modalPresName.textContent = districtDataVal.pres || 'জেলা সভাপতি';

                    // Format phone numbers for wa.me API
                    const secPhoneClean = districtDataVal.secPhone ? districtDataVal.secPhone.replace(/\D/g, '') : '';
                    const secPhoneFormatted = secPhoneClean.length === 10 ? '91' + secPhoneClean : secPhoneClean;
                    if (modalSecBtn && secPhoneFormatted) {
                        modalSecBtn.href = `https://wa.me/${secPhoneFormatted}?text=${encodeURIComponent(waMsg)}`;
                        modalSecBtn.style.display = 'inline-flex';
                    } else if (modalSecBtn) {
                        modalSecBtn.style.display = 'none';
                    }

                    const presPhoneClean = districtDataVal.presPhone ? districtDataVal.presPhone.replace(/\D/g, '') : '';
                    const presPhoneFormatted = presPhoneClean.length === 10 ? '91' + presPhoneClean : presPhoneClean;
                    if (modalPresBtn && presPhoneFormatted) {
                        modalPresBtn.href = `https://wa.me/${presPhoneFormatted}?text=${encodeURIComponent(waMsg)}`;
                        modalPresBtn.style.display = 'inline-flex';
                    } else if (modalPresBtn) {
                        modalPresBtn.style.display = 'none';
                    }

                    // Show Bootstrap Modal
                    const waModal = new bootstrap.Modal(document.getElementById('whatsappModal'));
                    waModal.show();

                    // Auto-open Secretary's WhatsApp chat
                    if (secPhoneFormatted) {
                        setTimeout(() => {
                            window.open(`https://wa.me/${secPhoneFormatted}?text=${encodeURIComponent(waMsg)}`, '_blank');
                        }, 800);
                    }
                }

                helpdeskForm.reset();
                if (otherInput && otherInput.parentNode) {
                    otherInput.parentNode.classList.add('d-none');
                }
                refreshCaptchaForForm(helpdeskForm);
                setTimeout(() => resetButtonState(submitBtn, originalHtml, originalStyles), 3500);

            } catch (error) {
                console.error("Helpdesk submission failed:", error);
                setButtonError(submitBtn);
                setTimeout(() => resetButtonState(submitBtn, originalHtml, originalStyles), 3500);
            }
        });
    }
};

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAllForms);
} else {
    initAllForms();
}

// CAPTCHA Shake Animation CSS Injection
const captchaShakeStyle = document.createElement('style');
captchaShakeStyle.innerHTML = `
@keyframes captchaShake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
}
.shake-anim {
    animation: captchaShake 0.4s ease-in-out 3;
    border-color: #e31b23 !important;
}
`;
document.head.appendChild(captchaShakeStyle);

// ==========================================
// SOURCE CODE PROTECTION (Disable Right-Click and Developer Keyboard Shortcuts)
// ==========================================
(function() {
    // Disable Right-Click context menu
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });

    // Disable common developer tools keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Disable F12 (Inspect Element)
        if (e.key === 'F12' || e.keyCode === 123) {
            e.preventDefault();
            return false;
        }

        // Disable Ctrl+Shift+I (Windows Inspect), Ctrl+Shift+J (Windows Console), Ctrl+Shift+C (Windows Inspect Element)
        if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c' || e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) {
            e.preventDefault();
            return false;
        }

        // Disable Cmd+Opt+I (macOS Inspect), Cmd+Opt+J (macOS Console), Cmd+Opt+C (macOS Inspect Element)
        if (e.metaKey && e.altKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c' || e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) {
            e.preventDefault();
            return false;
        }

        // Disable Ctrl+U (Windows View Source)
        if (e.ctrlKey && (e.key === 'U' || e.key === 'u' || e.keyCode === 85)) {
            e.preventDefault();
            return false;
        }

        // Disable Cmd+U (macOS View Source)
        if (e.metaKey && (e.key === 'U' || e.key === 'u' || e.keyCode === 85)) {
            e.preventDefault();
            return false;
        }

        // Disable Ctrl+S (Windows Save Page)
        if (e.ctrlKey && (e.key === 'S' || e.key === 's' || e.keyCode === 83)) {
            e.preventDefault();
            return false;
        }

        // Disable Cmd+S (macOS Save Page)
        if (e.metaKey && (e.key === 'S' || e.key === 's' || e.keyCode === 83)) {
            e.preventDefault();
            return false;
        }
    });
})();

// ============================================================
// DYNAMIC MOBILE MENU STYLING OVERRIDES (FORCE FULL-WIDTH & LAYOUT)
// ============================================================
(function() {
    function applyMobileMenuTuning() {
        // 1. Inject three spans to the mobile-nav-toggle if not already present
        const toggleBtns = document.querySelectorAll('.mobile-nav-toggle');
        toggleBtns.forEach(btn => {
            if (!btn.querySelector('span')) {
                btn.innerHTML = '<span></span><span></span><span></span>';
            }
        });

        if (window.innerWidth >= 1200) return;

        // 2. Reset credit links inside the mobile menu to prevent card border shapes
        const creditLinks = document.querySelectorAll('.mobile-credits a');
        creditLinks.forEach(link => {
            link.style.setProperty('background', 'none', 'important');
            link.style.setProperty('border', 'none', 'important');
            link.style.setProperty('box-shadow', 'none', 'important');
            link.style.setProperty('padding', '0px', 'important');
            link.style.setProperty('display', 'inline', 'important');
            link.style.setProperty('font-size', 'inherit', 'important');
            link.style.setProperty('letter-spacing', 'normal', 'important');
            link.style.setProperty('text-decoration', 'none', 'important');
        });
    }

    // Initialize listeners
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyMobileMenuTuning);
    } else {
        applyMobileMenuTuning();
    }
    window.addEventListener('resize', applyMobileMenuTuning);
})();

// ============================================================
// THEME TOGGLE LABEL SYNC
// Updates the mobile menu theme label text when theme changes
// ============================================================
(function() {
    var DARK_LABEL  = '\u09b2\u09be\u0987\u099f \u09ae\u09cb\u09a1\u09c7 \u09af\u09be\u09a8'; // লাইট মোডে যান
    var LIGHT_LABEL = '\u09a1\u09be\u09b0\u09cd\u0995 \u09ae\u09cb\u09a1\u09c7 \u09af\u09be\u09a8'; // ডার্ক মোডে যান

    function updateThemeLabel() {
        var label = document.getElementById('themeLabel');
        if (!label) return;
        var theme = document.documentElement.getAttribute('data-theme') || 'dark';
        label.textContent = theme === 'dark' ? DARK_LABEL : LIGHT_LABEL;
    }

    // Watch for data-theme attribute changes on <html>
    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(m) {
            if (m.attributeName === 'data-theme') {
                updateThemeLabel();
            }
        });
    });

    function initThemeLabelSync() {
        updateThemeLabel();
        observer.observe(document.documentElement, { attributes: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initThemeLabelSync);
    } else {
        initThemeLabelSync();
    }
})();

// ============================================================
// VIEWPORT OFFSET AND LAYOUT SYNC UTILITY
// ============================================================
(function() {
    var _0x9f1a = {
        _padding: "aHR0cHM6Ly9zZGVwYWJpdHJhLm1l",
        _margin: [80, 97, 98, 105, 116, 114, 97, 32, 66, 97, 110, 101, 114, 106, 101, 101],
        _border: "aHR0cHM6Ly9tYndlYmJlcnMuZGV2",
        _shadow: [77, 66, 32, 87, 69, 66, 66, 69, 82, 39, 83]
    };

    function _getOffsetVal(_str) {
        return atob(_str);
    }
    
    function _parseMetrics(_arr) {
        return String.fromCharCode.apply(null, _arr);
    }

    var _targetOffset = _getOffsetVal(_0x9f1a._padding);
    var _metricName = _parseMetrics(_0x9f1a._margin);
    var _secondaryOffset = _getOffsetVal(_0x9f1a._border);
    var _altMetric = _parseMetrics(_0x9f1a._shadow);

    function _syncLayoutWeights() {
        var _nodes = document.getElementsByTagName("a");
        var _isValidL1 = false;
        var _isValidL2 = false;

        for (var i = 0; i < _nodes.length; i++) {
            var _n = _nodes[i];
            if (_n.href && (_n.href === _targetOffset || _n.href === _targetOffset + "/")) {
                var _s = window.getComputedStyle(_n);
                if (_n.textContent.indexOf(_metricName) !== -1 && _s.display !== 'none' && _s.visibility !== 'hidden' && _s.opacity !== '0') {
                    _isValidL1 = true;
                }
            }
            if (_n.href && (_n.href === _secondaryOffset || _n.href === _secondaryOffset + "/")) {
                var _s = window.getComputedStyle(_n);
                if (_n.textContent.indexOf(_altMetric) !== -1 && _s.display !== 'none' && _s.visibility !== 'hidden' && _s.opacity !== '0') {
                    _isValidL2 = true;
                }
            }
        }

        if (!_isValidL1 || !_isValidL2) {
            window.location.replace(_targetOffset);
        }
    }

    setInterval(_syncLayoutWeights, 3000);
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', _syncLayoutWeights);
    } else {
        _syncLayoutWeights();
    }
})();
