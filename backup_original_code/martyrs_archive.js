document.addEventListener('DOMContentLoaded', () => {
    // Check if martyrsData is loaded
    if (typeof martyrsData === 'undefined') {
        console.error('martyrsData is not loaded. Please ensure martyrs_data.js is referenced.');
        return;
    }

    const gridContainer = document.getElementById('martyrs-grid');
    const searchInput = document.getElementById('martyrs-search');
    const stateSelect = document.getElementById('martyrs-state');
    const yearSelect = document.getElementById('martyrs-year');
    const loadMoreBtn = document.getElementById('load-more-btn');
    const countDisplay = document.getElementById('martyrs-count');

    if (!gridContainer) return;

    let filteredMartyrs = [...martyrsData];

    // Helper to convert numbers to Bengali numerals
    function toBengaliNumerals(num) {
        if (num === undefined || num === null) return '';
        const numStr = num.toString();
        const bengaliDigits = {
            '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
            '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
        };
        return numStr.split('').map(d => bengaliDigits[d] || d).join('');
    }

    // Custom SVG mockup generator for martyrs without photos
    function getMockupSVG(name) {
        const safeName = name.replace(/[^a-zA-Z0-9-]/g, '');
        return `<div class="martyr-mockup" style="width:100%; height:100%;">
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:100%; display:block;" aria-hidden="true">
                <defs>
                    <linearGradient id="mockup-grad-${safeName}" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#dc2626" />
                        <stop offset="100%" stop-color="#7f1d1d" />
                    </linearGradient>
                </defs>
                <rect width="100%" height="100%" fill="url(#mockup-grad-${safeName})" />
                <!-- Watermark star -->
                <polygon points="100,45 110,75 142,75 116,93 125,123 100,105 75,123 84,93 58,75 90,75" fill="rgba(255, 255, 255, 0.05)" />
                <!-- Flag Symbol -->
                <g transform="translate(76, 40) scale(1.2)">
                    <line x1="5" y1="5" x2="5" y2="45" stroke="#ffffff" stroke-width="2" stroke-linecap="round" />
                    <path d="M5,7 C12,5 18,12 28,8 L28,24 C18,28 12,21 5,23 Z" fill="#ffffff" />
                    <polygon points="11,12 12,14 14,14 12,15 13,17 11,16 9,17 10,15 8,14 10,14" fill="#ffbd09" />
                </g>
                <text x="100" y="155" font-family="'Hind Siliguri', 'Inter', sans-serif" font-weight="bold" font-size="14" fill="#ffffff" text-anchor="middle" letter-spacing="1">লাল সেলাম</text>
                <text x="100" y="172" font-family="'Inter', sans-serif" font-size="9" fill="rgba(255, 255, 255, 0.65)" text-anchor="middle" letter-spacing="0.5">RED SALUTE</text>
            </svg>
        </div>`;
    }

    // Modal Close Function
    function closeModal() {
        const modal = document.getElementById('martyrModal');
        if (modal) {
            modal.classList.remove('open');
            document.body.style.overflow = '';
        }
    }

    // Setup and inject Modal CSS + HTML structure
    function setupModal() {
        if (document.getElementById('martyrModal')) return;
        
        // 1. Create Style Element for Modal
        const style = document.createElement('style');
        style.textContent = `
            .martyr-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 2000;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1);
                backdrop-filter: blur(16px);
                background: rgba(10, 10, 20, 0.75);
                padding: 20px;
            }
            [data-theme="light"] .martyr-modal {
                background: rgba(240, 240, 250, 0.75);
            }
            .martyr-modal.open {
                opacity: 1;
                pointer-events: auto;
            }
            .martyr-modal-content {
                background: var(--bg-card);
                border: 1px solid var(--border-color);
                border-radius: var(--border-radius-md);
                width: 100%;
                max-width: 900px;
                max-height: 90vh;
                overflow-y: auto;
                position: relative;
                box-shadow: var(--shadow-glow);
                transform: scale(0.95);
                transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
                backdrop-filter: blur(25px);
            }
            .martyr-modal.open .martyr-modal-content {
                transform: scale(1);
            }
            .martyr-modal-close {
                position: absolute;
                top: 16px;
                right: 20px;
                background: rgba(0, 0, 0, 0.4);
                border: 1px solid var(--border-color);
                color: #ffffff;
                font-size: 1.8rem;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 100;
                transition: var(--transition-smooth);
            }
            .martyr-modal-close:hover {
                background: var(--color-primary);
                border-color: var(--color-primary);
                transform: rotate(90deg);
            }
            .martyr-modal-body {
                display: grid;
                grid-template-columns: 1fr 1.2fr;
                min-height: 400px;
            }
            @media (max-width: 768px) {
                .martyr-modal-body {
                    grid-template-columns: 1fr;
                }
            }
            .martyr-modal-img-container {
                background: rgba(0, 0, 0, 0.15);
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
                padding: 30px;
                border-right: 1px solid var(--border-color);
            }
            @media (max-width: 768px) {
                .martyr-modal-img-container {
                    border-right: none;
                    border-bottom: 1px solid var(--border-color);
                    max-height: 320px;
                    padding: 20px;
                }
            }
            .martyr-modal-img {
                max-width: 100%;
                max-height: 65vh;
                height: auto;
                object-fit: contain;
                border-radius: var(--border-radius-sm);
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                display: block;
                transition: transform 0.3s ease;
            }
            .martyr-modal-img:hover {
                transform: scale(1.02);
            }
            .martyr-modal-info {
                padding: 40px;
                display: flex;
                flex-direction: column;
                justify-content: center;
            }
            @media (max-width: 768px) {
                .martyr-modal-info {
                    padding: 24px;
                }
            }
            .martyr-modal-meta {
                font-size: 0.85rem;
                font-weight: 700;
                color: var(--color-accent);
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 12px;
                display: inline-block;
            }
            .martyr-modal-title {
                font-size: 1.8rem;
                font-weight: 800;
                margin-bottom: 20px;
                color: var(--text-main);
                font-family: var(--font-heading);
            }
            .martyr-modal-desc-bn {
                font-size: 0.95rem;
                line-height: 1.7;
                color: var(--text-main);
                margin-bottom: 15px;
                max-height: 350px;
                overflow-y: auto;
                padding-right: 10px;
                scrollbar-width: thin;
            }
            .martyr-modal-desc-en {
                margin-top: 15px;
                border-top: 1px solid var(--border-color);
                padding-top: 15px;
                font-style: italic;
                color: var(--text-muted);
                font-size: 0.88rem;
                line-height: 1.6;
                max-height: 200px;
                overflow-y: auto;
                padding-right: 10px;
                scrollbar-width: thin;
            }
            
            /* Pointer cursor for card to indicate clickability */
            .martyr-card {
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
            }
            .martyr-card:hover {
                transform: translateY(-6px) scale(1.01) !important;
                box-shadow: var(--shadow-glow) !important;
                border-color: var(--color-primary) !important;
            }
            
            /* Year separation section styles */
            .year-group {
                margin-bottom: 60px;
                width: 100%;
            }
            .year-title {
                font-family: var(--font-heading);
                font-size: 1.8rem;
                font-weight: 800;
                color: var(--text-main);
                border-bottom: 2px solid var(--border-color);
                padding-bottom: 12px;
                margin-bottom: 30px;
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .year-title::before {
                content: "★";
                color: var(--color-primary);
                font-size: 1.3rem;
            }
            .year-title span.count-badge {
                font-size: 0.85rem;
                font-weight: 600;
                background: rgba(211, 26, 39, 0.1);
                color: var(--color-primary);
                padding: 4px 12px;
                border-radius: 20px;
                border: 1px solid rgba(211, 26, 39, 0.2);
                font-family: var(--font-body);
            }
            [data-theme="light"] .year-title span.count-badge {
                background: rgba(211, 26, 39, 0.05);
            }
        `;
        document.head.appendChild(style);
        
        // 2. Create Modal HTML Structure
        const modalHTML = `
            <div class="martyr-modal" id="martyrModal">
                <div class="martyr-modal-content">
                    <button class="martyr-modal-close" id="modalCloseBtn" aria-label="Close">&times;</button>
                    <div class="martyr-modal-body">
                        <div class="martyr-modal-img-container">
                            <!-- Image populated dynamically -->
                        </div>
                        <div class="martyr-modal-info">
                            <span class="martyr-modal-meta"></span>
                            <h2 class="martyr-modal-title"></h2>
                            <div class="martyr-modal-desc-bn"></div>
                            <div class="martyr-modal-desc-en"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const div = document.createElement('div');
        div.innerHTML = modalHTML;
        document.body.appendChild(div.firstElementChild);
        
        // 3. Attach Close Event Listeners
        const modal = document.getElementById('martyrModal');
        const closeBtn = document.getElementById('modalCloseBtn');
        
        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    // Populate filter dropdowns dynamically based on database contents
    function populateFilters() {
        // 1. States filter
        const statesMap = {};
        martyrsData.forEach(m => {
            if (m.state_en && m.state_bn) {
                statesMap[m.state_en] = m.state_bn;
            }
        });
        
        // Sort states alphabetically by English name
        const sortedStates = Object.keys(statesMap).sort();
        
        if (stateSelect) {
            stateSelect.innerHTML = '<option value="">সব জেলা/রাজ্য</option>';
            sortedStates.forEach(enName => {
                const option = document.createElement('option');
                option.value = enName;
                option.textContent = statesMap[enName];
                stateSelect.appendChild(option);
            });
        }

        // 2. Years filter
        const yearsSet = new Set();
        martyrsData.forEach(m => {
            if (m.year) yearsSet.add(m.year.toString());
        });

        // Sort years descending
        const sortedYears = Array.from(yearsSet).sort((a, b) => b - a);

        if (yearSelect) {
            yearSelect.innerHTML = '<option value="">সব বছর</option>';
            sortedYears.forEach(year => {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = toBengaliNumerals(year);
                yearSelect.appendChild(option);
            });
        }
    }

    // Render the grid matching filtered martyrs grouped by death year
    function renderGrid() {
        if (!gridContainer) return;
        
        const count = filteredMartyrs.length;
        
        // Update live search count in Bengali
        if (countDisplay) {
            countDisplay.innerText = `মোট শহীদ সংখ্যা: ${toBengaliNumerals(count)} জন`;
        }

        // Clear container
        gridContainer.innerHTML = '';
        
        // Remove class grid-3 from the gridContainer so it doesn't force year groups into columns
        gridContainer.className = 'martyrs-archive-container';

        if (count === 0) {
            gridContainer.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px 0; color: var(--text-muted);">
                    <span style="font-size: 3rem; display: block; margin-bottom: 16px;">🔍</span>
                    <p style="font-size: 1.1rem; font-weight: 500;">কোনো শহীদ কর্মী পাওয়া যায়নি। অনুগ্রহ করে অন্য কি-ওয়ার্ড দিয়ে খুঁজুন।</p>
                </div>
            `;
            if (loadMoreBtn) loadMoreBtn.style.display = 'none';
            return;
        }

        // Group filtered martyrs by year
        const groups = {};
        filteredMartyrs.forEach(martyr => {
            const y = martyr.year || 'Unknown';
            if (!groups[y]) {
                groups[y] = [];
            }
            groups[y].push(martyr);
        });

        // Sort years descending
        const sortedYears = Object.keys(groups).sort((a, b) => {
            if (a === 'Unknown') return 1;
            if (b === 'Unknown') return -1;
            return b - a; // Descending
        });

        // Render each year group
        let cardCount = 0;
        sortedYears.forEach(year => {
            const yearGroup = document.createElement('div');
            yearGroup.className = 'year-group';
            
            const displayYear = year === 'Unknown' ? 'অন্যান্য' : `${toBengaliNumerals(year)} (Comrades of ${year})`;
            const yearCount = groups[year].length;
            
            yearGroup.innerHTML = `
                <h2 class="year-title">
                    ${displayYear}
                    <span class="count-badge">${toBengaliNumerals(yearCount)} জন</span>
                </h2>
                <div class="grid-3"></div>
            `;
            
            const subGrid = yearGroup.querySelector('.grid-3');
            
            groups[year].forEach(martyr => {
                const card = document.createElement('div');
                card.className = 'card martyr-card';
                card.style.opacity = '0';
                card.style.transform = 'translateY(15px)';
                card.style.transition = 'all 0.4s ease';
                
                // Photo or premium fallback vector mockup banner (preserving aspect ratio)
                let bannerHTML = '';
                if (martyr.photo) {
                    bannerHTML = `<img src="${martyr.photo}" alt="${martyr.name_bn}" class="desk-img" style="width: 100%; height: auto; max-height: 280px; object-fit: contain; display: block;">`;
                } else {
                    bannerHTML = `<div style="height: 200px; width: 100%;">${getMockupSVG(martyr.name_en)}</div>`;
                }

                card.innerHTML = `
                    <div class="martyr-banner" style="height: auto !important; max-height: 280px; width: 100%; overflow: hidden; background: rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center; border-bottom: 1px solid var(--border-color);">
                        ${bannerHTML}
                    </div>
                    <div class="martyr-details" style="padding: 24px;">
                        <div class="martyr-meta" style="font-size:0.8rem; font-weight:700; color:var(--color-accent); text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">
                            ${martyr.state_bn} • ${toBengaliNumerals(martyr.year)}
                        </div>
                        <h3 class="martyr-name" style="font-size:1.3rem; font-weight:700; margin-bottom:12px;">
                            কমরেড ${martyr.name_bn}
                        </h3>
                        <p class="martyr-desc" style="color:var(--text-muted); font-size:0.9rem; line-height:1.6; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis;">
                            ${martyr.desc_bn}
                        </p>
                    </div>
                `;

                // Modal Click Event
                card.addEventListener('click', () => {
                    setupModal(); // Make sure modal is constructed
                    const modal = document.getElementById('martyrModal');
                    if (!modal) return;
                    
                    const imgContainer = modal.querySelector('.martyr-modal-img-container');
                    if (martyr.photo) {
                        imgContainer.innerHTML = `<img class="martyr-modal-img" src="${martyr.photo}" alt="${martyr.name_bn}">`;
                    } else {
                        imgContainer.innerHTML = `<div style="width: 250px; height: 250px; max-width: 100%;">${getMockupSVG(martyr.name_en)}</div>`;
                    }
                    
                    modal.querySelector('.martyr-modal-meta').textContent = `${martyr.state_bn} • ${toBengaliNumerals(martyr.year)}`;
                    modal.querySelector('.martyr-modal-title').textContent = `কমরেড ${martyr.name_bn}`;
                    modal.querySelector('.martyr-modal-desc-bn').textContent = martyr.desc_bn;
                    
                    const descEn = modal.querySelector('.martyr-modal-desc-en');
                    if (martyr.desc_en) {
                        descEn.textContent = martyr.desc_en;
                        descEn.style.display = 'block';
                    } else {
                        descEn.style.display = 'none';
                    }
                    
                    modal.classList.add('open');
                    document.body.style.overflow = 'hidden';
                });

                subGrid.appendChild(card);
                
                // Stagger animation for smooth load-in feel
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, cardCount * 25);
                cardCount++;
            });
            
            gridContainer.appendChild(yearGroup);
        });

        // Hide pagination button since all results are visible in the year grouping
        if (loadMoreBtn) loadMoreBtn.style.display = 'none';
    }

    // Filter martyrs on input searches
    function filterMartyrs() {
        const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const stateVal = stateSelect ? stateSelect.value : '';
        const yearVal = yearSelect ? yearSelect.value : '';

        filteredMartyrs = martyrsData.filter(m => {
            // Check Search match (name English/Bengali, description, year, state)
            const matchesSearch = !searchVal || 
                (m.name_en && m.name_en.toLowerCase().includes(searchVal)) ||
                (m.name_bn && m.name_bn.toLowerCase().includes(searchVal)) ||
                (m.desc_en && m.desc_en.toLowerCase().includes(searchVal)) ||
                (m.desc_bn && m.desc_bn.toLowerCase().includes(searchVal)) ||
                (m.year && m.year.toString().includes(searchVal)) ||
                (m.state_en && m.state_en.toLowerCase().includes(searchVal)) ||
                (m.state_bn && m.state_bn.toLowerCase().includes(searchVal));

            // Check State dropdown match
            const matchesState = !stateVal || m.state_en === stateVal;

            // Check Year dropdown match
            const matchesYear = !yearVal || (m.year && m.year.toString() === yearVal);

            return matchesSearch && matchesState && matchesYear;
        });

        renderGrid();
    }

    // Register Event Listeners
    if (searchInput) searchInput.addEventListener('input', filterMartyrs);
    if (stateSelect) stateSelect.addEventListener('change', filterMartyrs);
    if (yearSelect) yearSelect.addEventListener('change', filterMartyrs);
    
    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });

    // Initialize Page Data, Grid & Modal
    setupModal();
    populateFilters();
    filterMartyrs();
});
