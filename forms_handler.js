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
    apiKey: "AIzaSyD4Bm5t8V9gKAUiPhGq_hOw1lai_-8J3oc",
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

document.addEventListener("DOMContentLoaded", function() {
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
    const feedbackForm = document.getElementById('feedback-form');
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const nameInput = document.getElementById('name');
            const emailInput = document.getElementById('email');
            const subjectInput = document.getElementById('subject');
            const commentInput = document.getElementById('comment');
            const captchaWrapper = feedbackForm.querySelector('.captcha-placeholder');
            const captchaInput = captchaWrapper ? captchaWrapper.querySelector('input') : null;
            const submitBtn = feedbackForm.querySelector('button[type="submit"]');

            if (!nameInput || !emailInput || !subjectInput || !commentInput || !submitBtn) return;

            // Validate CAPTCHA
            if (captchaInput && captchaInput.value.trim().toUpperCase() !== 'R7P9') {
                captchaInput.style.setProperty('border-color', '#e31b23', 'important');
                captchaInput.focus();
                
                // Temporary warning animation / shake placeholder
                captchaWrapper.classList.add('shake-anim');
                setTimeout(() => {
                    captchaWrapper.classList.remove('shake-anim');
                    captchaInput.style.removeProperty('border-color');
                }, 2000);
                return;
            }

            const originalHtml = submitBtn.innerHTML;
            const originalStyles = captureStyles(submitBtn);

            setButtonLoading(submitBtn, originalHtml, "বার্তা পাঠানো হচ্ছে...");

            if (isConfigPlaceholder()) {
                console.warn("Using demo mode. Fill in Firebase and Apps Script details to connect live sheets/db.");
                setTimeout(() => {
                    setButtonSuccess(submitBtn, "বার্তা পাঠানো হয়েছে!");
                    feedbackForm.reset();
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
    const contactForm = document.getElementById('contact-form');
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

            const originalHtml = submitBtn.innerHTML;
            const originalStyles = captureStyles(submitBtn);

            setButtonLoading(submitBtn, originalHtml, "বার্তা পাঠানো হচ্ছে...");

            if (isConfigPlaceholder()) {
                console.warn("Using demo mode. Fill in Firebase and Apps Script details to connect live sheets/db.");
                setTimeout(() => {
                    setButtonSuccess(submitBtn, "বার্তা পাঠানো হয়েছে!");
                    contactForm.reset();
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
    const membershipForm = document.getElementById('membership-form');
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

            const originalHtml = submitBtn.innerHTML;
            const originalStyles = captureStyles(submitBtn);

            setButtonLoading(submitBtn, originalHtml, "আবেদনপত্র পাঠানো হচ্ছে...");

            if (isConfigPlaceholder()) {
                console.warn("Using demo mode. Fill in Firebase and Apps Script details to connect live sheets/db.");
                setTimeout(() => {
                    setButtonSuccess(submitBtn, "আবেদনপত্র পাঠানো হয়েছে!");
                    membershipForm.reset();
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
