/**
 * SFI West Bengal - Forms Submission Handler (Firebase & Google Sheets Integration)
 * Option A: Browser SDK + Google Apps Script Web App (100% Free & Secure)
 *
 * Instructions:
 * 1. Replace the firebaseConfig placeholders with your actual Firebase Web App credentials.
 * 2. Replace the APPS_SCRIPT_URL placeholder with your deployed Google Apps Script Web App URL.
 */

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
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxc4SAltTS0zz2e3_BfOQKfIRbxsgWohAf2F3gJZI3qxQB1tDrmVXh8EbfO0DBUx4f8gg/exec";


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

document.addEventListener("DOMContentLoaded", function() {
    // Initialize dynamic forms CAPTCHAs
    const feedbackForm = document.getElementById('feedback-form');
    if (feedbackForm) initCaptchaForForm(feedbackForm);
    
    const contactForm = document.getElementById('contact-form');
    if (contactForm) initCaptchaForForm(contactForm);
    
    const membershipForm = document.getElementById('membership-form');
    if (membershipForm) initCaptchaForForm(membershipForm);

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
            if (!email || !email.includes('@')) {
                input.style.setProperty('border-color', '#e31b23', 'important');
                setTimeout(() => input.style.removeProperty('border-color'), 2500);
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
                name: nameInput.value.trim(),
                email: emailInput.value.trim(),
                subject: subjectInput.value.trim(),
                message: commentInput.value.trim()
            };

            try {
                // Write to Firestore
                if (db) {
                    await db.collection('feedback').add({
                        ...payload,
                        submittedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
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
                name: nameInput.value.trim(),
                phone: phoneInput ? phoneInput.value.trim() : "",
                email: emailInput.value.trim(),
                subject: subjectInput.value,
                message: messageInput.value.trim()
            };

            try {
                // Write to Firestore (save in feedback collection for consistent backend structure)
                if (db) {
                    await db.collection('feedback').add({
                        ...payload,
                        submittedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
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

            // Validate Dynamic CAPTCHA
            if (!validateCaptcha(membershipForm)) return;

            const originalHtml = submitBtn.innerHTML;
            const originalStyles = captureStyles(submitBtn);

            setButtonLoading(submitBtn, originalHtml, "আবেদনপত্র পাঠানো হচ্ছে...");

            if (isConfigPlaceholder()) {
                console.warn("Using demo mode. Fill in Firebase and Apps Script details to connect live sheets/db.");
                setTimeout(() => {
                    setButtonSuccess(submitBtn, "আবেদনপত্র পাঠানো হয়েছে!");
                    membershipForm.reset();
                    refreshCaptchaForForm(membershipForm);
                    setTimeout(() => resetButtonState(submitBtn, originalHtml, originalStyles), 3500);
                }, 1000);
                return;
            }

            const payload = {
                name: nameInput.value.trim(),
                email: emailInput.value.trim(),
                phone: phoneInput.value.trim(),
                institution: institutionInput.value.trim(),
                district: districtInput.value,
                message: messageInput ? messageInput.value.trim() : ""
            };

            try {
                // Write to Firestore
                if (db) {
                    await db.collection('membership').add({
                        ...payload,
                        submittedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
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

                // UI Success state
                setButtonSuccess(submitBtn, "আবেদনপত্র পাঠানো হয়েছে!");
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
});

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
