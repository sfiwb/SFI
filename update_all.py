import os
import re

backup_dir = r"c:\Users\rocks\OneDrive\Desktop\SFI\backup_original_code"

# 1. Regex pattern to match the footer block
old_footer_pattern = re.compile(
    r'<!--\s*Col 1:\s*Address\s*-->\s*<div class="col-lg-3 col-md-6">\s*<h5[^>]*>ঠিকানা</h5>\s*<p[^>]*>\s*<strong>ভারতের ছাত্র ফেডারেশন</strong><br>\s*পশ্চিমবঙ্গ রাজ্য কমিটি<br>\s*৩১ আলিমুদ্দিন স্ট্রিট, মুজফ্ফর আহমদ ভবন<br>\s*কলকাতা\s*-\s*৭০০০১৬\s*</p>\s*</div>',
    re.DOTALL
)

new_footer_content = """<!-- Col 1: Address -->
                <div class="col-lg-3 col-md-6">
                    <h5 class="fw-bold text-header border-bottom border-danger border-2 pb-2 mb-3">ঠিকানা</h5>
                    <p class="text-body leading-relaxed mb-0">
                        <strong>ভারতের ছাত্র ফেডারেশন</strong><br>
                        পশ্চিমবঙ্গ রাজ্য কমিটি<br>
                        দীনেশ মজুমদার ভবন, ৭৯/৩এ, এ. জে. সি. বোস রোড, কলকাতা, পশ্চিমবঙ্গ, ভারত — পিনকোড: ৭০০০১৪<br>
                        <span class="small d-block mt-2">
                            <strong>ফোন:</strong> +৯১-৮৯১০০৪৪১৩৮ (সম্পাদক) &amp;<br>+৯১-৯৯৩৩৬৪৬৫৫৬ (সভাপতি)<br>
                            <strong>ইমেল:</strong> state.committee.sfi.wb@gmail.com
                        </span>
                        <a href="https://maps.app.goo.gl/MaNQfj5qRgNooBDEA" target="_blank" class="text-danger hover-underline small d-inline-block mt-2"><i class="fas fa-map-marker-alt me-1"></i>গুগল ম্যাপে দেখুন ↗</a>
                    </p>
                </div>"""

# 2. Regex for index.html contact section
old_index_contact_pattern = re.compile(
    r'<div class="d-flex align-items-start mb-4">\s*<div[^>]*>\s*<i class="bi bi-geo-alt[^"]*"></i>\s*</div>\s*<div>\s*<h5[^>]*>ঠিকানা \(Address\):</h5>\s*<p[^>]*>.*?</p>\s*</div>\s*</div>\s*<div class="d-flex align-items-start mb-4">\s*<div[^>]*>\s*<i class="bi bi-telephone[^"]*"></i>\s*</div>\s*<div>\s*<h5[^>]*>ফোন \(Phone\):</h5>\s*<p[^>]*>.*?</p>\s*</div>\s*</div>\s*<div class="d-flex align-items-start">\s*<div[^>]*>\s*<i class="bi bi-envelope[^"]*"></i>\s*</div>\s*<div>\s*<h5[^>]*>ই-মেইল \(Email\):</h5>\s*<p[^>]*>.*?</p>\s*</div>\s*</div>',
    re.DOTALL
)

new_index_contact_content = """<div class="d-flex align-items-start mb-4">
                                        <div
                                            class="contact-icon bg-danger bg-opacity-25 text-danger rounded-circle p-3 me-3">
                                            <i class="bi bi-geo-alt fs-5"></i>
                                        </div>
                                        <div>
                                            <h5 class="fw-bold text-header mb-1">ঠিকানা (Address):</h5>
                                            <p class="text-body small mb-0">দীনেশ মজুমদার ভবন, ৭৯/৩এ, এ. জে. সি. বোস রোড,<br>কলকাতা, পশ্চিমবঙ্গ, ভারত — পিনকোড: ৭০০০১৪</p>
                                        </div>
                                    </div>

                                    <div class="d-flex align-items-start mb-4">
                                        <div
                                            class="contact-icon bg-danger bg-opacity-25 text-danger rounded-circle p-3 me-3">
                                            <i class="bi bi-telephone fs-5"></i>
                                        </div>
                                        <div>
                                            <h5 class="fw-bold text-header mb-1">ফোন (Phone):</h5>
                                            <p class="text-body small mb-0"><a href="tel:+918910044138" class="text-danger">+৯১-৮৯১০০৪৪১৩৮</a> (সম্পাদক) / <a href="tel:+919933646556" class="text-danger">+৯১-৯৯৩৩৬৪৬৫৫৬</a> (সভাপতি)</p>
                                        </div>
                                    </div>

                                    <div class="d-flex align-items-start">
                                        <div
                                            class="contact-icon bg-danger bg-opacity-25 text-danger rounded-circle p-3 me-3">
                                            <i class="bi bi-envelope fs-5"></i>
                                        </div>
                                        <div>
                                            <h5 class="fw-bold text-header mb-1">ই-মেইল (Email):</h5>
                                            <p class="text-body small mb-0"><a href="mailto:state.committee.sfi.wb@gmail.com"
                                                    class="text-danger">state.committee.sfi.wb@gmail.com</a></p>
                                        </div>
                                    </div>"""

# 3. Regex for contact.html contact info block
old_contact_info_pattern = re.compile(
    r'<h2>আমাদের ঠিকানা</h2>\s*<div class="divider-line"></div>\s*<div class="info-item">\s*<div class="info-icon">🏢</div>\s*<div class="info-text">\s*<h4>অফিস</h4>\s*<p>এসএফআই পশ্চিমবঙ্গ রাজ্য কমিটি<br\s*/?>মুজাফ্ফর আহমেদ ভবন<br\s*/?>১ ইন্দিরা বিদ্যাপীঠ\s*রোড<br\s*/?>কলকাতা\s*—\s*৭০০\s*০৭৩</p>\s*</div>\s*</div>\s*<div class="info-item">\s*<div class="info-icon">📞</div>\s*<div class="info-text">\s*<h4>ফোন</h4>\s*<p><a href="tel:\+91-33-0000-0000">\+৯১ ৩৩ ০০০০ ০০০০</a></p>\s*</div>\s*</div>\s*<div class="info-item">\s*<div class="info-icon">✉️</div>\s*<div class="info-text">\s*<h4>ইমেল</h4>\s*<p><a href="mailto:sfiwb@example.com">sfiwb@example.com</a></p>\s*</div>\s*</div>',
    re.DOTALL
)

new_contact_info_content = """<h2>আমাদের ঠিকানা</h2>
                        <div class="divider-line"></div>
                        <div class="info-item">
                            <div class="info-icon">🏢</div>
                            <div class="info-text">
                                <h4>অফিস</h4>
                                <p>এসএফআই পশ্চিমবঙ্গ রাজ্য কমিটি<br />দীনেশ মজুমদার ভবন<br />৭৯/৩এ, এ. জে. সি. বোস রোড<br />কলকাতা — ৭০০০১৪</p>
                            </div>
                        </div>
                        <div class="info-item">
                            <div class="info-icon">📞</div>
                            <div class="info-text">
                                <h4>ফোন</h4>
                                <p><a href="tel:+918910044138">+৯১-৮৯১০০৪৪১৩৮</a> (সম্পাদক)<br><a href="tel:+919933646556">+৯১-৯৯৩৩৬৪৬৫৫৬</a> (সভাপতি)</p>
                            </div>
                        </div>
                        <div class="info-item">
                            <div class="info-icon">✉️</div>
                            <div class="info-text">
                                <h4>ইমেল</h4>
                                <p><a href="mailto:state.committee.sfi.wb@gmail.com">state.committee.sfi.wb@gmail.com</a></p>
                            </div>
                        </div>"""

print("Starting replacements in backup folder...")

# Modify HTML files
for filename in os.listdir(backup_dir):
    if filename.endswith(".html"):
        filepath = os.path.join(backup_dir, filename)
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
        
        modified = False
        
        # Replace footer address
        if old_footer_pattern.search(content):
            content, count = old_footer_pattern.subn(new_footer_content, content)
            if count > 0:
                print(f"  Updated footer in {filename}")
                modified = True
        
        # Replace index.html contact details
        if filename == "index.html" and old_index_contact_pattern.search(content):
            content, count = old_index_contact_pattern.subn(new_index_contact_content, content)
            if count > 0:
                print(f"  Updated main contact section in {filename}")
                modified = True
                
        # Replace contact.html contact details
        if filename == "contact.html" and old_contact_info_pattern.search(content):
            content, count = old_contact_info_pattern.subn(new_contact_info_content, content)
            if count > 0:
                print(f"  Updated info block in {filename}")
                modified = True
                
        if modified:
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(content)

# Add CSS padding in home.css
css_filepath = os.path.join(backup_dir, "home.css")
if os.path.exists(css_filepath):
    with open(css_filepath, "r", encoding="utf-8", errors="ignore") as f:
        css_content = f.read()
    
    css_addition = """
/* Footer social links padding for mobile screens */
@media (max-width: 767px) {
  .footer .social-links {
    margin-bottom: 24px;
    padding-bottom: 12px;
  }
}
"""
    if "Footer social links padding for mobile screens" not in css_content:
        with open(css_filepath, "a", encoding="utf-8") as f:
            f.write(css_addition)
        print("  Added CSS padding to home.css")
    else:
        print("  CSS padding already present in home.css")

print("All replacements done!")
