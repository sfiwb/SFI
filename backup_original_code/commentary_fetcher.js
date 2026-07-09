/**
 * Chhatra Sangram Commentary and Articles Fetcher
 * Dynamically retrieves articles from chhatrasangram.org WP API,
 * displays them on SFI West Bengal home page, and opens them in an elegant in-page modal popup.
 */

(function () {
    'use strict';

    // Inject custom modal CSS styles dynamically
    const injectStyles = () => {
        const styleId = 'article-popup-styles';
        if (document.getElementById(styleId)) return;

        const css = `
            /* Article Modal Overlay */
            .article-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(10, 11, 14, 0.82);
                backdrop-filter: blur(15px);
                -webkit-backdrop-filter: blur(15px);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.3s ease, visibility 0.3s ease;
            }
            .article-modal.open {
                opacity: 1;
                visibility: visible;
            }

            /* Modal Box Container */
            .article-modal-container {
                width: 90%;
                max-width: 1100px;
                height: 85%;
                background: rgba(30, 31, 38, 0.92);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 16px;
                box-shadow: 0 25px 60px rgba(0, 0, 0, 0.45);
                display: flex;
                flex-direction: column;
                overflow: hidden;
                transform: scale(0.92);
                transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            .article-modal.open .article-modal-container {
                transform: scale(1);
            }

            /* Header Controls */
            .article-modal-header {
                padding: 14px 20px;
                background: rgba(20, 21, 26, 0.95);
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-shrink: 0;
            }
            .article-modal-title {
                font-size: 1.15rem;
                font-weight: 700;
                color: #ffffff;
                margin: 0;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 70%;
            }
            .article-modal-controls {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .article-modal-btn {
                background: none;
                border: none;
                color: rgba(255, 255, 255, 0.7);
                font-size: 1.2rem;
                cursor: pointer;
                width: 38px;
                height: 38px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.2s, color 0.2s;
                text-decoration: none !important;
            }
            .article-modal-btn:hover {
                background: rgba(255, 255, 255, 0.1);
                color: #ffffff;
            }
            .article-modal-btn.close-btn:hover {
                background: rgba(220, 53, 69, 0.15);
                color: #dc3545;
            }

            /* Body & Iframe & Loading Spinner */
            .article-modal-body {
                flex: 1;
                position: relative;
                background: #ffffff; /* Matches the article content container */
            }
            .article-modal-iframe {
                width: 100%;
                height: 100%;
                border: none;
                display: block;
            }
            .article-modal-loader {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(20, 21, 26, 0.95);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                color: #ffffff;
                gap: 16px;
                z-index: 10;
                transition: opacity 0.3s ease;
            }
            .article-modal-loader.hidden {
                opacity: 0;
                pointer-events: none;
            }
            .article-spinner {
                width: 44px;
                height: 44px;
                border: 4px solid rgba(255, 255, 255, 0.1);
                border-top-color: #dc3545; /* SFI Red theme color */
                border-radius: 50%;
                animation: article-spin 0.8s linear infinite;
            }
            @keyframes article-spin {
                to { transform: rotate(360deg); }
            }

            /* Responsive tweaks */
            @media (max-width: 768px) {
                .article-modal-container {
                    width: 95%;
                    height: 90%;
                }
                .article-modal-title {
                    font-size: 1rem;
                    max-width: 60%;
                }
            }
        `;

        const styleEl = document.createElement('style');
        styleEl.id = styleId;
        styleEl.textContent = css;
        document.head.appendChild(styleEl);
    };

    // Inject modal HTML markup into DOM
    const injectModalMarkup = () => {
        if (document.getElementById('articleModal')) return;

        const markup = `
            <div class="article-modal" id="articleModal">
                <div class="article-modal-container">
                    <div class="article-modal-header">
                        <h5 class="article-modal-title" id="articleModalTitle">নিবন্ধ</h5>
                        <div class="article-modal-controls">
                            <a href="#" target="_blank" class="article-modal-btn" id="articleModalExternal" title="নতুন ট্যাবে খুলুন (Open in New Tab)">
                                <i class="bi bi-box-arrow-up-right"></i>
                            </a>
                            <button class="article-modal-btn close-btn" id="articleModalClose" title="বন্ধ করুন (Close)">
                                <i class="bi bi-x-lg"></i>
                            </button>
                        </div>
                    </div>
                    <div class="article-modal-body">
                        <div class="article-modal-loader" id="articleModalLoader">
                            <div class="article-spinner"></div>
                            <span class="small opacity-75">নিবন্ধ লোড হচ্ছে...</span>
                        </div>
                        <iframe src="" class="article-modal-iframe" id="articleModalIframe" title="Article Viewer"></iframe>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', markup);
    };

    document.addEventListener('DOMContentLoaded', function () {
        const container = document.getElementById('commentary-container');
        if (!container) return;

        // Inject modal components
        injectStyles();
        injectModalMarkup();

        // Modal DOM Elements Reference
        const modal = document.getElementById('articleModal');
        const iframe = document.getElementById('articleModalIframe');
        const loader = document.getElementById('articleModalLoader');
        const modalTitle = document.getElementById('articleModalTitle');
        const externalBtn = document.getElementById('articleModalExternal');
        const closeBtn = document.getElementById('articleModalClose');

        // Functions to control Modal
        const openArticleModal = (url, titleText) => {
            modalTitle.textContent = titleText;
            externalBtn.setAttribute('href', url);
            loader.classList.remove('hidden');
            iframe.src = url;
            modal.classList.add('open');
            document.body.style.overflow = 'hidden'; // Prevent background page scrolling
        };

        const closeArticleModal = () => {
            modal.classList.remove('open');
            iframe.src = 'about:blank'; // Stops page execution/media playback
            document.body.style.overflow = ''; // Restore page scrolling
        };

        // Modal Action Bindings
        if (closeBtn) closeBtn.addEventListener('click', closeArticleModal);
        if (modal) {
            modal.addEventListener('click', function (e) {
                if (e.target === modal) closeArticleModal();
            });
        }
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && modal.classList.contains('open')) {
                closeArticleModal();
            }
        });
        if (iframe) {
            iframe.addEventListener('load', function () {
                if (iframe.src !== 'about:blank' && iframe.src !== '') {
                    loader.classList.add('hidden');
                }
            });
        }

        // Store current static cards as fallback
        const fallbackHtml = container.innerHTML;

        // API URL to fetch 4 latest posts with embedded media/author details
        const apiUrl = 'https://chhatrasangram.org/wp-json/wp/v2/posts?per_page=4&_embed';

        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok: ' + response.statusText);
                }
                return response.json();
            })
            .then(posts => {
                if (!posts || posts.length === 0) {
                    throw new Error('No posts returned from API');
                }

                // Clear the container
                container.innerHTML = '';

                const escapeHtml = (value) => String(value)
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;');

                posts.forEach((post, index) => {
                    const title = post.title && post.title.rendered ? post.title.rendered : 'নিবন্ধ';
                    const link = post.link || 'https://chhatrasangram.org';
                    const imageUrl = getFeaturedImage(post);
                    const author = getAuthor(post);
                    const authorAvatar = getAuthorAvatar(post);
                    const excerpt = getExcerpt(post);
                    const dateFormatted = formatDate(post.date);

                    const safeTitle = escapeHtml(title);
                    const safeLink = escapeHtml(link);
                    const safeImageUrl = escapeHtml(imageUrl);
                    const safeAuthor = escapeHtml(author);
                    const safeAuthorAvatar = escapeHtml(authorAvatar);
                    const safeExcerpt = escapeHtml(excerpt);
                    const safeDateFormatted = escapeHtml(dateFormatted);

                    // Create the article card element
                    const cardCol = document.createElement('div');
                    cardCol.className = 'col-md-4 col-lg-3';
                    cardCol.setAttribute('data-aos', 'fade-up');
                    cardCol.setAttribute('data-aos-delay', (index + 1) * 100);

                    cardCol.innerHTML = `
                        <div class="testimonial-item glass-card p-3 h-100 d-flex flex-column justify-content-between">
                            <div>
                                <a href="${safeLink}" class="d-block mb-3 article-trigger">
                                    <div class="ratio ratio-16x9 rounded overflow-hidden border border-secondary border-opacity-25">
                                        <img src="${safeImageUrl}" alt="${safeTitle}" class="img-fluid object-fit-cover w-100 h-100">
                                    </div>
                                </a>
                                <h5 class="fw-bold text-header mb-2">
                                    <a href="${safeLink}" class="text-header hover-text-danger decoration-none article-trigger">${safeTitle}</a>
                                </h5>
                                <p class="text-body small mb-3">${safeExcerpt}</p>
                            </div>
                            <div class="testimonial-footer border-top border-secondary border-opacity-25 pt-2">
                                <div class="testimonial-author d-flex align-items-center">
                                    <img src="${safeAuthorAvatar}" alt="${safeAuthor}"
                                         class="img-fluid rounded-circle me-2 border border-2 border-danger"
                                         style="width: 40px; height: 40px; object-fit: cover;">
                                    <div>
                                        <h6 class="fw-bold text-header mb-0 fs-6">${safeAuthor}</h6>
                                        <span class="small text-muted">${safeDateFormatted}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;

                    container.appendChild(cardCol);
                });

                // Attach click listeners to article triggers to open in popup
                container.addEventListener('click', function (e) {
                    const trigger = e.target.closest('a.article-trigger');
                    if (trigger) {
                        e.preventDefault();
                        const url = trigger.getAttribute('href');
                        const cardElement = trigger.closest('.testimonial-item');
                        const titleText = cardElement.querySelector('h5 a').textContent.trim();
                        openArticleModal(url, titleText);
                    }
                });

                // Refresh AOS to animate the newly inserted elements
                if (window.AOS) {
                    window.AOS.refresh();
                }
            })
            .catch(error => {
                console.warn('Failed to fetch live commentary, falling back to static cards:', error);
                // Restore fallback cards
                container.innerHTML = fallbackHtml;
            });
    });

    /**
     * Extracts author's name from post content (if it's the first short paragraph)
     * or falls back to WordPress display name.
     */
    function getAuthor(post) {
        if (post.content && post.content.rendered) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = post.content.rendered;
            const firstP = tempDiv.querySelector('p');
            if (firstP) {
                const text = firstP.textContent.trim();
                // If it is a short paragraph, it is likely the author name (e.g. সায়ন্তন বসু)
                if (text.length > 0 && text.length < 30) {
                    return text;
                }
            }
        }

        // Fallback to WordPress user name
        if (post._embedded && post._embedded.author && post._embedded.author[0]) {
            const wpName = post._embedded.author[0].name;
            return wpName === 'Chhatra Sangram' ? 'ছাত্রসংগ্রাম ডেস্ক' : wpName;
        }

        return 'ছাত্রসংগ্রাম ডেস্ক';
    }

    /**
     * Extracts author's avatar URL from embedded user data.
     */
    function getAuthorAvatar(post) {
        if (post._embedded && post._embedded.author && post._embedded.author[0] && post._embedded.author[0].avatar_urls) {
            return post._embedded.author[0].avatar_urls['96'] || post._embedded.author[0].avatar_urls['48'] || 'assets/images/c_bhaskaran.png';
        }
        return 'assets/images/c_bhaskaran.png';
    }

    /**
     * Extracts a clean text excerpt from post content, ignoring the author paragraph if present.
     */
    function getExcerpt(post) {
        if (!post.content || !post.content.rendered) return '';

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = post.content.rendered;

        const paragraphs = Array.from(tempDiv.querySelectorAll('p'));
        let startIdx = 0;

        // Skip the first paragraph if it matches our author name extraction logic
        if (paragraphs.length > 0) {
            const firstPText = paragraphs[0].textContent.trim();
            if (firstPText.length > 0 && firstPText.length < 30) {
                startIdx = 1;
            }
        }

        // Find the first substantial text paragraph to use for excerpt
        let excerptText = '';
        for (let i = startIdx; i < paragraphs.length; i++) {
            const text = paragraphs[i].textContent.trim();
            if (text.length > 40) {
                excerptText = text;
                break;
            }
        }

        // Fallback if no paragraph matches
        if (!excerptText && paragraphs.length > startIdx) {
            excerptText = paragraphs[startIdx].textContent.trim();
        }

        // Clean up and truncate
        excerptText = excerptText.replace(/\s+/g, ' ');
        if (excerptText.length > 150) {
            excerptText = excerptText.substring(0, 145) + '...';
        }

        return excerptText;
    }

    /**
     * Extracts featured image URL from embedded media.
     */
    function getFeaturedImage(post) {
        if (post._embedded && post._embedded['wp:featuredmedia'] && post._embedded['wp:featuredmedia'][0]) {
            const media = post._embedded['wp:featuredmedia'][0];
            if (media.source_url) {
                return media.source_url;
            }
        }

        // Fallback placeholder images
        const fallbacks = [
            'assets/images/study.png',
            'assets/images/protest.png',
            'assets/images/sfi_flag.png',
            'assets/images/relief.png'
        ];
        return fallbacks[post.id % fallbacks.length];
    }

    /**
     * Converts an ISO date string into Bengali numerals and month names.
     */
    function formatDate(dateStr) {
        if (!dateStr) return 'প্রকাশ: সম্প্রতি';
        try {
            const date = new Date(dateStr);
            const monthsBengali = [
                'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
                'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
            ];
            const day = date.getDate();
            const month = monthsBengali[date.getMonth()];
            const year = date.getFullYear();

            const numeralsMap = {
                '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
                '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
            };

            const toBengaliNumerals = (num) => {
                return String(num).split('').map(char => numeralsMap[char] || char).join('');
            };

            return `প্রকাশ: ${toBengaliNumerals(day)}-${month}-${toBengaliNumerals(year)}`;
        } catch (e) {
            return 'প্রকাশ: সম্প্রতি';
        }
    }
})();
