/**
 * SFI WEST BENGAL — PRESS RELEASE DYNAMIC LOADER & PDF VIEWER
 * Handles dynamic content population on index.html and press.html
 * Integrates a responsive pop-up PDF modal for all screen sizes.
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Verify pressData is loaded
    if (typeof pressData === 'undefined') {
        console.error('pressData is not defined. Make sure press_data.js is loaded first.');
        return;
    }

    // Sort pressData descending (latest first, based on ID)
    const sortedPressData = [...pressData].sort((a, b) => b.id - a.id);

    // Helpers
    function toBengaliNumerals(num) {
        if (num === undefined || num === null) return '';
        const numStr = num.toString();
        const bengaliDigits = {
            '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
            '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
        };
        return numStr.split('').map(d => bengaliDigits[d] || d).join('');
    }

    // ==========================================
    // 1.2 MOBILE NAV AUTO-CLOSE FIX
    // ==========================================
    const mobileNavToggleBtn = document.querySelector('.mobile-nav-toggle');
    const bodyElement = document.querySelector('body');
    if (bodyElement) {
        document.querySelectorAll('#navmenu a').forEach(link => {
            link.addEventListener('click', function() {
                // Ignore dropdown toggle clicks that expand submenus in mobile view
                if (window.innerWidth < 1200 && this.parentNode.classList.contains('dropdown')) {
                    return;
                }
                
                // Close menu if open
                if (bodyElement.classList.contains('mobile-nav-active')) {
                    bodyElement.classList.remove('mobile-nav-active');
                    if (mobileNavToggleBtn) {
                        mobileNavToggleBtn.classList.add('bi-list');
                        mobileNavToggleBtn.classList.remove('bi-x');
                    }
                }
            });
        });
    }

    // ==========================================
    // 2. MODAL INJECTION & LIFECYCLE
    // ==========================================
    function setupModal() {
        if (document.getElementById('pressModal')) return;

        // Create modal CSS styles
        const style = document.createElement('style');
        style.textContent = `
            .press-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                backdrop-filter: blur(12px);
                background: rgba(10, 10, 15, 0.85);
                padding: 20px;
            }
            .press-modal.open {
                opacity: 1;
                pointer-events: auto;
            }
            .press-modal-content {
                background: var(--bg-card, #15161c);
                border: 1px solid var(--border-color, rgba(255,255,255,0.12));
                border-radius: 16px;
                width: 100%;
                max-width: 1150px;
                height: 85vh;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                position: relative;
                box-shadow: 0 25px 60px rgba(0,0,0,0.65);
                transform: scale(0.95);
                transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            .press-modal.open .press-modal-content {
                transform: scale(1);
            }
            .press-modal-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 16px 24px;
                border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.12));
                background: rgba(255, 255, 255, 0.02);
            }
            .press-modal-title {
                font-size: 1.25rem;
                font-weight: 700;
                margin: 0;
                color: var(--text-primary, #ffffff);
                padding-right: 40px;
                display: -webkit-box;
                -webkit-line-clamp: 1;
                -webkit-box-orient: vertical;
                overflow: hidden;
                font-family: 'Noto Serif Bengali', 'Roboto', sans-serif;
            }
            .press-modal-close {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid var(--border-color, rgba(255,255,255,0.1));
                color: #ffffff;
                font-size: 1.6rem;
                width: 38px;
                height: 38px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.25s ease;
                line-height: 1;
            }
            .press-modal-close:hover {
                background: var(--color-primary, #ff2d3c);
                border-color: var(--color-primary, #ff2d3c);
                transform: rotate(90deg);
            }
            .press-modal-body {
                display: grid;
                grid-template-columns: 1.4fr 1fr;
                flex: 1;
                overflow: hidden;
            }
            .press-modal-pdf-panel {
                border-right: 1px solid var(--border-color, rgba(255,255,255,0.12));
                background: #0d0e11;
                display: flex;
                flex-direction: column;
                height: 100%;
                position: relative;
                overflow: hidden;
            }
            .press-modal-info-panel {
                padding: 30px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                height: 100%;
                background: var(--bg-card, #15161c);
            }
            .press-pdf-iframe {
                width: 1px;
                min-width: 100%;
                height: 100%;
                border: none;
                background: #0d0e11;
                display: block;
            }
            .press-modal-meta {
                font-size: 0.85rem;
                font-weight: 700;
                color: var(--color-primary, #ff2d3c);
                margin-bottom: 15px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .press-modal-meta i {
                font-size: 1rem;
            }
            .press-modal-intro-title {
                font-size: 1rem;
                font-weight: 600;
                margin-bottom: 10px;
                color: var(--text-primary, #ffffff);
            }
            .press-modal-desc {
                font-size: 0.95rem;
                line-height: 1.75;
                color: var(--text-muted, #d0d0d0);
                margin-bottom: 25px;
                flex: 1;
                font-family: 'Noto Serif Bengali', 'Roboto', sans-serif;
            }
            .press-modal-tags {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin-bottom: 25px;
            }
            .press-modal-tag {
                font-size: 0.72rem;
                font-weight: 600;
                padding: 3px 12px;
                border-radius: 20px;
                background: rgba(255, 255, 255, 0.04);
                border: 1px solid var(--border-color, rgba(255,255,255,0.1));
                color: var(--text-muted, #d0d0d0);
                text-transform: uppercase;
                letter-spacing: 0.04em;
            }
            .press-btn-container {
                display: flex;
                flex-direction: column;
                gap: 12px;
                border-top: 1px solid var(--border-color, rgba(255,255,255,0.12));
                padding-top: 20px;
            }
            .press-download-btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                padding: 12px 24px;
                border-radius: 8px;
                background: var(--color-primary, #ff2d3c);
                color: #ffffff;
                font-weight: 600;
                text-decoration: none;
                transition: all 0.25s ease;
                border: none;
                cursor: pointer;
                font-size: 0.95rem;
            }
            .press-download-btn:hover {
                background: #b8161f;
                transform: translateY(-2px);
                color: #ffffff;
                box-shadow: 0 4px 15px rgba(255, 45, 60, 0.4);
            }
            .press-mobile-open-bar {
                display: none;
                background: rgba(255, 45, 60, 0.1);
                border: 1px solid rgba(255, 45, 60, 0.2);
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 15px;
                align-items: center;
                justify-content: space-between;
                gap: 10px;
            }
            .press-mobile-open-bar span {
                font-size: 0.85rem;
                color: #ffffff;
                font-weight: 500;
            }
            .press-mobile-btn {
                background: var(--color-primary, #ff2d3c);
                color: white;
                border: none;
                padding: 6px 14px;
                border-radius: 6px;
                font-size: 0.8rem;
                font-weight: 600;
                text-decoration: none;
                white-space: nowrap;
                transition: all 0.2s ease;
            }
            .press-mobile-btn:hover {
                background: #b8161f;
                color: white;
            }

            /* Hide mobile nav toggle when PDF modal is open */
            .press-modal-open .mobile-nav-toggle {
                display: none !important;
            }

            @media (max-width: 992px) {
                .press-modal-content {
                    height: 90vh;
                    max-width: 700px;
                }
                .press-modal-body {
                    grid-template-columns: 1fr;
                    overflow-y: auto;
                }
                .press-modal-pdf-panel {
                    height: 480px;
                    border-right: none;
                    border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.12));
                }
                .press-modal-info-panel {
                    height: auto;
                    padding: 24px;
                }
                .press-mobile-open-bar {
                    display: flex;
                }
            }
            @media (max-width: 768px) {
                .press-modal-pdf-panel {
                    display: none !important;
                }
            }
            @media (max-width: 576px) {
                .press-modal {
                    padding: 10px;
                }
                .press-modal-content {
                    height: 95vh;
                }
                .press-modal-pdf-panel {
                    height: 320px;
                }
                .press-modal-info-panel {
                    padding: 16px;
                }
                .press-modal-title {
                    font-size: 1.1rem;
                }
            }
        `;
        document.head.appendChild(style);

        // Inject Modal HTML structure
        const modalHTML = `
            <div class="press-modal" id="pressModal">
                <div class="press-modal-content">
                    <div class="press-modal-header">
                        <h2 class="press-modal-title" id="pressModalTitle">প্রেস বিবৃতি</h2>
                        <button class="press-modal-close" id="pressModalClose" aria-label="Close">&times;</button>
                    </div>
                    <div class="press-modal-body">
                        <div class="press-modal-pdf-panel">
                            <iframe class="press-pdf-iframe" id="pressModalIframe" src="" title="PDF Viewer"></iframe>
                        </div>
                        <div class="press-modal-info-panel">
                            <div>
                                <div class="press-mobile-open-bar">
                                    <span>মোবাইলে PDF ফাইলটি সরাসরি দেখতে এখানে ক্লিক করুন:</span>
                                    <a class="press-mobile-btn" id="pressMobileOpenBtn" href="" target="_blank">ওপেন PDF</a>
                                </div>
                                <div class="press-modal-meta">
                                    <i class="bi bi-calendar-event"></i>
                                    <span id="pressModalDate"></span>
                                </div>
                                <div class="press-modal-tags" id="pressModalTags"></div>
                                <h4 class="press-modal-intro-title">বিবৃতি সারসংক্ষেপ:</h4>
                                <div class="press-modal-desc" id="pressModalDesc"></div>
                            </div>
                            <div class="press-btn-container">
                                <a class="press-download-btn" id="pressDownloadBtn" href="" target="_blank">
                                    <i class="fa-solid fa-file-pdf"></i>
                                    PDF ডাউনলোড / সম্পূর্ণ স্ক্রিনে দেখুন
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const container = document.createElement('div');
        container.innerHTML = modalHTML;
        document.body.appendChild(container.firstElementChild);

        // Close listeners
        const modal = document.getElementById('pressModal');
        const closeBtn = document.getElementById('pressModalClose');

        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
        });
    }

    function openModal(id) {
        setupModal();
        const item = pressData.find(p => p.id === parseInt(id));
        if (!item) return;

        const modal = document.getElementById('pressModal');
        const iframe = document.getElementById('pressModalIframe');
        const title = document.getElementById('pressModalTitle');
        const date = document.getElementById('pressModalDate');
        const desc = document.getElementById('pressModalDesc');
        const tagsContainer = document.getElementById('pressModalTags');
        const downloadBtn = document.getElementById('pressDownloadBtn');
        const mobileOpenBtn = document.getElementById('pressMobileOpenBtn');

        // Populate fields
        title.textContent = item.title;
        date.textContent = `প্রকাশ: ${item.date}`;
        desc.textContent = item.intro;
        
        // Tags
        tagsContainer.innerHTML = '';
        if (item.tags && item.tags.length) {
            item.tags.forEach(tag => {
                const tagEl = document.createElement('span');
                tagEl.className = 'press-modal-tag';
                tagEl.textContent = tag;
                tagsContainer.appendChild(tagEl);
            });
        }

        // Setup PDF references
        // In local setups, #toolbar=0 prevents standard browser toolbar from cluttering
        iframe.src = `${item.pdf}#toolbar=0`;
        downloadBtn.href = item.pdf;
        mobileOpenBtn.href = item.pdf;

        // Close mobile nav menu if open
        const bodyElement = document.querySelector('body');
        const mobileNavToggleBtn = document.querySelector('.mobile-nav-toggle');
        if (bodyElement && bodyElement.classList.contains('mobile-nav-active')) {
            bodyElement.classList.remove('mobile-nav-active');
            if (mobileNavToggleBtn) {
                mobileNavToggleBtn.classList.add('bi-list');
                mobileNavToggleBtn.classList.remove('bi-x');
            }
        }

        // Open modal
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
        document.body.classList.add('press-modal-open');
    }

    function closeModal() {
        const modal = document.getElementById('pressModal');
        const iframe = document.getElementById('pressModalIframe');
        if (modal) {
            modal.classList.remove('open');
            document.body.style.overflow = '';
            document.body.classList.remove('press-modal-open');
            // Clear iframe src to stop loading PDF in background
            if (iframe) iframe.src = '';
        }
    }

    // Set up global event delegation for dynamic elements
    document.body.addEventListener('click', (e) => {
        // Target element with class view-pdf-btn or view-pdf-link or target closest parent
        const btn = e.target.closest('.view-pdf-btn, .view-pdf-link');
        if (btn) {
            e.preventDefault();
            const id = btn.getAttribute('data-id');
            if (id) openModal(id);
        }
    });

    // ==========================================
    // 3. INDEX PAGE LOADER
    // ==========================================
    const featuredContainer = document.getElementById('featured-press-container');
    const recentListContainer = document.getElementById('recent-press-list');

    if (featuredContainer && recentListContainer) {
        // Clear static items
        featuredContainer.innerHTML = '';
        recentListContainer.innerHTML = '';

        // Render Featured item (index 0, latest release)
        const featuredItem = sortedPressData[0];
        if (featuredItem) {
            const tagsHTML = featuredItem.tags.map(tag => 
                `<span class="badge bg-dark bg-opacity-50 text-light-body border border-secondary border-opacity-25 me-1">${tag}</span>`
            ).join('');

            featuredContainer.innerHTML = `
                <div class="steps-content glass-card p-4 h-100 d-flex flex-column justify-content-between" style="border: 1px solid var(--border-color); border-radius: var(--border-radius-md);">
                    <div>
                        <span class="badge bg-danger mb-3 px-3 py-1 text-uppercase">Featured Statement</span>
                        <h3 class="fw-bold text-header mb-3" style="font-family: 'Noto Serif Bengali', 'Roboto', sans-serif;">${featuredItem.title}</h3>
                        <div class="ratio ratio-21x9 mb-3 rounded overflow-hidden border border-secondary border-opacity-25">
                            <img src="${featuredItem.image || 'assets/images/protest.png'}" alt="Featured Press Image" class="img-fluid w-100 object-fit-cover">
                        </div>
                        <p class="text-body leading-relaxed mb-3" style="font-family: 'Noto Serif Bengali', sans-serif; font-size: 0.95rem;">${featuredItem.intro}</p>
                        <div class="small text-muted mb-2"><i class="bi bi-clock me-1"></i> <strong>প্রকাশ:</strong> ${featuredItem.date}</div>
                        <div class="tags mb-3">
                            ${tagsHTML}
                        </div>
                    </div>
                    <div class="border-top border-secondary border-opacity-25 pt-3 d-flex gap-2">
                        <button class="btn btn-neon-red px-4 py-2 btn-sm fw-semibold view-pdf-btn" data-id="${featuredItem.id}">সম্পূর্ণ পড়ুন</button>
                        <a href="press.html" class="btn btn-glass px-4 py-2 btn-sm fw-semibold ms-2 text-white">আরো প্রেস বিবৃতি</a>
                    </div>
                </div>
            `;
        }

        // Render Recent items (index 1, 2, 3)
        const recentItems = sortedPressData.slice(1, 4);
        recentItems.forEach((item, index) => {
            const stepNum = toBengaliNumerals(index + 2).padStart(2, '০');
            const tagsHTML = item.tags.map(tag => 
                `<span class="badge bg-dark bg-opacity-50 text-muted border border-secondary border-opacity-25">${tag}</span>`
            ).join(' ');

            const itemHTML = `
                <div class="step-item d-flex align-items-start ${index < recentItems.length - 1 ? 'border-bottom border-secondary border-opacity-25 pb-3 mb-3' : ''}">
                    <div class="step-number text-danger fw-bold fs-2 me-3">${stepNum}</div>
                    <div class="step-content flex-grow-1">
                        <h4 class="fw-semibold text-header mb-1" style="font-family: 'Noto Serif Bengali', 'Roboto', sans-serif; font-size: 1.1rem;">
                            <a href="#" class="text-header hover-text-danger view-pdf-link" data-id="${item.id}">${item.title}</a>
                        </h4>
                        <p class="small text-body mb-1" style="font-family: 'Noto Serif Bengali', sans-serif; line-height: 1.6;">${item.intro}</p>
                        <div class="small text-muted d-flex align-items-center justify-content-between flex-wrap gap-2 mt-2">
                            <div>
                                <i class="bi bi-clock me-1"></i> ${item.date} | <strong>ট্যাগ:</strong> ${tagsHTML}
                            </div>
                            <a href="#" class="view-pdf-link text-danger fw-semibold hover-opacity-100" data-id="${item.id}" style="text-decoration: none; font-size: 0.85rem; transition: opacity 0.2s;">
                                সম্পূর্ণ পড়ুন <i class="fa-solid fa-arrow-right ms-1" style="font-size: 0.75rem;"></i>
                            </a>
                        </div>
                    </div>
                </div>
            `;
            recentListContainer.innerHTML += itemHTML;
        });
    }

    // ==========================================
    // 4. PRESS PAGE LOADER (WITH PAGINATION)
    // ==========================================
    const pressGrid = document.getElementById('press-grid');
    const pressCountBadge = document.getElementById('press-count');
    const paginationContainer = document.getElementById('press-pagination');

    if (pressGrid) {
        const itemsPerPage = 6;
        let currentPage = 1;
        const totalItems = sortedPressData.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);

        // Update count badge
        if (pressCountBadge) {
            pressCountBadge.textContent = `মোট ${toBengaliNumerals(totalItems)}টি বিবৃতি`;
        }

        function renderPressGrid(page) {
            pressGrid.innerHTML = '';
            
            const startIdx = (page - 1) * itemsPerPage;
            const endIdx = Math.min(startIdx + itemsPerPage, totalItems);
            const itemsToRender = sortedPressData.slice(startIdx, endIdx);

            itemsToRender.forEach(item => {
                const tagsHTML = item.tags.map(tag => 
                    `<span class="press-tag me-1 mb-1">${tag}</span>`
                ).join('');

                const cardHTML = `
                    <article class="press-card view-pdf-btn" data-id="${item.id}" style="cursor: pointer;">
                        <span class="press-date-badge">
                            <svg fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24">
                                <rect height="18" rx="2" ry="2" width="18" x="3" y="4"></rect>
                                <line x1="16" x2="16" y1="2" y2="6"></line>
                                <line x1="8" x2="8" y1="2" y2="6"></line>
                                <line x1="3" x2="21" y1="10" y2="10"></line>
                            </svg>
                            ${item.date}
                        </span>
                        <div class="press-tags-wrapper d-flex flex-wrap mt-1">
                            ${tagsHTML}
                        </div>
                        <h3 class="press-card-title" style="font-family: 'Noto Serif Bengali', 'Roboto', sans-serif;">${item.title}</h3>
                        <p class="press-card-excerpt" style="font-family: 'Noto Serif Bengali', sans-serif;">${item.intro}</p>
                        <hr class="press-divider"/>
                        <button class="press-read-btn border-0 d-flex align-items-center" style="background: var(--color-primary); color: #fff;">
                            সম্পূর্ণ পড়ুন
                            <svg class="ms-1" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" viewBox="0 0 24 24" style="width: 14px; height: 14px;">
                                <line x1="5" x2="19" y1="12" y2="12"></line>
                                <polyline points="12 5 19 12 12 19"></polyline>
                            </svg>
                        </button>
                    </article>
                `;
                pressGrid.innerHTML += cardHTML;
            });
        }

        function renderPagination() {
            if (!paginationContainer) return;
            paginationContainer.innerHTML = '';

            // Previous button
            const prevBtn = document.createElement('button');
            prevBtn.className = `press-page-btn ${currentPage === 1 ? 'disabled opacity-50' : ''}`;
            prevBtn.textContent = '← পূর্ববর্তী';
            prevBtn.disabled = currentPage === 1;
            prevBtn.addEventListener('click', () => {
                if (currentPage > 1) {
                    currentPage--;
                    updateView();
                }
            });
            paginationContainer.appendChild(prevBtn);

            // Page numbers
            for (let i = 1; i <= totalPages; i++) {
                const pageBtn = document.createElement('button');
                pageBtn.className = `press-page-btn ${currentPage === i ? 'active' : ''}`;
                pageBtn.textContent = toBengaliNumerals(i);
                pageBtn.addEventListener('click', () => {
                    currentPage = i;
                    updateView();
                });
                paginationContainer.appendChild(pageBtn);
            }

            // Next button
            const nextBtn = document.createElement('button');
            nextBtn.className = `press-page-btn ${currentPage === totalPages ? 'disabled opacity-50' : ''}`;
            nextBtn.textContent = 'পরবর্তী →';
            nextBtn.disabled = currentPage === totalPages;
            nextBtn.addEventListener('click', () => {
                if (currentPage < totalPages) {
                    currentPage++;
                    updateView();
                }
            });
            paginationContainer.appendChild(nextBtn);
        }

        function updateView() {
            renderPressGrid(currentPage);
            renderPagination();
            window.scrollTo({
                top: document.querySelector('.press-section').offsetTop - 100,
                behavior: 'smooth'
            });
        }

        // Initialize grid rendering
        updateView();
    }

    // Check URL parameters to automatically open a specific press release modal
    const urlParams = new URLSearchParams(window.location.search);
    const pressId = urlParams.get('id');
    if (pressId) {
        setTimeout(() => {
            openModal(pressId);
        }, 100);
    }
});
