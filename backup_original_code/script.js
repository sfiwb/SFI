/* ============================================================
   CPI(M) WEST BENGAL — MAIN JAVASCRIPT
   Interactions, Animations, Theme Toggle, Particles
   ============================================================ */

'use strict';

// ==============================
// THEME MANAGEMENT
// ==============================
const ThemeManager = {
  key: 'sfi-theme',
  current: 'dark',

  init() {
    const saved = localStorage.getItem(this.key) || 'dark';
    this.apply(saved);

    document.getElementById('themeToggle').addEventListener('click', () => {
      this.toggle();
    });
  },

  toggle() {
    this.apply(this.current === 'dark' ? 'light' : 'dark');
  },

  apply(theme) {
    this.current = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(this.key, theme);

    const icon = document.getElementById('themeIcon');
    if (icon) {
      icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    // Logo image toggling fallback
    const logoDark = document.getElementById('logo-dark');
    const logoLight = document.getElementById('logo-light');
    if (logoDark && logoLight) {
      logoDark.style.display = theme === 'dark' ? 'block' : 'none';
      logoLight.style.display = theme === 'light' ? 'block' : 'none';
    }
    const footerLogoDark = document.getElementById('footer-logo-dark');
    const footerLogoLight = document.getElementById('footer-logo-light');
    if (footerLogoDark && footerLogoLight) {
      footerLogoDark.style.display = theme === 'dark' ? 'block' : 'none';
      footerLogoLight.style.display = theme === 'light' ? 'block' : 'none';
    }
  }
};

// ==============================
// PRELOADER
// ==============================
const Preloader = {
  init() {
    const preloader = document.getElementById('preloader');
    if (!preloader) return;

    window.addEventListener('load', () => {
      setTimeout(() => {
        preloader.classList.add('hidden');
        setTimeout(() => {
          preloader.remove();
          // Initialize AOS after preloader
          AnimationObserver.init();
          CounterAnimation.init();
        }, 600);
      }, 1800);
    });
  }
};

// ==============================
// PARTICLES BACKGROUND
// ==============================
const Particles = {
  canvas: null,
  ctx: null,
  particles: [],
  animationId: null,
  mouse: { x: null, y: null, targetX: null, targetY: null },

  init() {
    this.canvas = document.getElementById('particles-canvas');
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.resize();

    window.addEventListener('resize', () => this.resize());
    
    // Smooth mouse position tracking
    window.addEventListener('mousemove', (e) => {
      this.mouse.targetX = e.clientX;
      this.mouse.targetY = e.clientY;
    });

    document.addEventListener('mouseleave', () => {
      this.mouse.targetX = null;
      this.mouse.targetY = null;
    });

    this.animate();
  },

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.createParticles();
  },

  createParticles() {
    this.particles = [];
    const spacing = 32; // density spacing
    const cols = Math.ceil(this.canvas.width / spacing) + 1;
    const rows = Math.ceil(this.canvas.height / spacing) + 1;

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const baseX = c * spacing;
        const baseY = r * spacing;
        
        // HSL interpolation mimicking the Antigravity color field spectrum
        const ratioX = baseX / this.canvas.width;
        const ratioY = baseY / this.canvas.height;
        const hue = 40 + (1 - ratioX) * 280 * ratioY + ratioX * 180 * ratioY;

        this.particles.push({
          baseX: baseX,
          baseY: baseY,
          x: baseX,
          y: baseY,
          size: 1.5,
          hue: hue,
          currentSize: 1.5,
          currentOpacity: 0.14
        });
      }
    }
  },

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const theme = document.documentElement.getAttribute('data-theme') || 'dark';
    
    // Smooth mouse interpolation
    if (this.mouse.targetX !== null && this.mouse.targetY !== null) {
      if (this.mouse.x === null) {
        this.mouse.x = this.mouse.targetX;
        this.mouse.y = this.mouse.targetY;
      } else {
        this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.15;
        this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.15;
      }
    } else {
      this.mouse.x = null;
      this.mouse.y = null;
    }

    const mx = this.mouse.x;
    const my = this.mouse.y;
    const maxDist = 150; // mouse trigger radius
    const pushStrength = 40; // repulsion force
    const easeRate = 0.1;

    this.particles.forEach(p => {
      let targetX = p.baseX;
      let targetY = p.baseY;
      let targetSize = 1.5;
      let targetOpacity = theme === 'dark' ? 0.14 : 0.12;
      let angle = Math.PI / 4; // default tilted dash angle

      if (mx !== null && my !== null) {
        const dx = p.baseX - mx;
        const dy = p.baseY - my;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist < maxDist) {
          const force = (maxDist - dist) / maxDist; // scales 0 to 1
          
          if (dist > 0) {
            targetX = p.baseX + (dx / dist) * force * pushStrength;
            targetY = p.baseY + (dy / dist) * force * pushStrength;
          }
          
          // Warp dash rotation to align with mouse push vector
          angle = Math.atan2(dy, dx) + Math.PI / 2;
          targetSize = 1.5 + force * 2.2;
          targetOpacity = theme === 'dark' ? 0.14 + force * 0.75 : 0.12 + force * 0.65;
        }
      }

      // Smooth easing transitions
      p.x += (targetX - p.x) * easeRate;
      p.y += (targetY - p.y) * easeRate;
      p.currentSize += (targetSize - p.currentSize) * easeRate;
      p.currentOpacity += (targetOpacity - p.currentOpacity) * easeRate;

      // Draw particle as a gorgeous tilted dash line capsule
      const length = p.currentSize * 3;
      const x1 = p.x - Math.cos(angle) * length;
      const y1 = p.y - Math.sin(angle) * length;
      const x2 = p.x + Math.cos(angle) * length;
      const y2 = p.y + Math.sin(angle) * length;

      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.lineWidth = p.currentSize;
      this.ctx.lineCap = 'round';
      
      const saturation = theme === 'dark' ? 95 : 85;
      const lightness = theme === 'dark' ? 65 : 52;
      
      this.ctx.strokeStyle = `hsla(${p.hue}, ${saturation}%, ${lightness}%, ${p.currentOpacity})`;
      this.ctx.stroke();
    });
  }
};

// ==============================
// NAVBAR
// ==============================
const Navbar = {
  header: null,
  hamburger: null,
  navMenu: null,
  isScrolled: false,
  scrollThreshold: 80,

  init() {
    this.header = document.getElementById('header');
    this.hamburger = document.getElementById('hamburger');
    this.navMenu = document.getElementById('navMenu');

    if (!this.header) return;

    // Scroll behavior
    window.addEventListener('scroll', () => this.onScroll(), { passive: true });

    // Hamburger toggle
    if (this.hamburger) {
      this.hamburger.addEventListener('click', () => this.toggleMobileMenu());
    }

    // Mobile dropdown toggles
    document.querySelectorAll('.nav-item.dropdown .nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        if (window.innerWidth <= 992) {
          e.preventDefault();
          const item = link.closest('.nav-item.dropdown');
          item.classList.toggle('open');
        }
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.nav-container') && this.navMenu?.classList.contains('open')) {
        this.closeMobileMenu();
      }
    });

    // Smooth scroll for nav links
    document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        try {
          const target = document.querySelector(anchor.getAttribute('href'));
          if (target) {
            e.preventDefault();
            this.closeMobileMenu();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            this.setActive(anchor);
          }
        } catch (err) {
          console.warn("Invalid smooth scroll selector:", err);
        }
      });
    });

    // Active section tracking
    this.setupIntersectionObserver();
  },

  onScroll() {
    const scrollY = window.scrollY;
    if (scrollY > this.scrollThreshold && !this.isScrolled) {
      this.isScrolled = true;
      this.header.classList.add('scrolled');
    } else if (scrollY <= this.scrollThreshold && this.isScrolled) {
      this.isScrolled = false;
      this.header.classList.remove('scrolled');
    }

    // Back to top visibility
    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
      backToTop.classList.toggle('visible', scrollY > 400);
    }
  },

  toggleMobileMenu() {
    const isOpen = this.navMenu.classList.contains('open');
    if (isOpen) {
      this.closeMobileMenu();
    } else {
      this.openMobileMenu();
    }
  },

  openMobileMenu() {
    this.navMenu.classList.add('open');
    this.hamburger.classList.add('active');
    document.body.style.overflow = 'hidden';
  },

  closeMobileMenu() {
    this.navMenu.classList.remove('open');
    this.hamburger.classList.remove('active');
    document.body.style.overflow = '';
  },

  setActive(link) {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    link.closest('.nav-item')?.classList.add('active');
  },

  setupIntersectionObserver() {
    const sections = document.querySelectorAll('section[id]');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
          const activeLink = document.querySelector(`.nav-link[href="#${id}"]`);
          activeLink?.closest('.nav-item')?.classList.add('active');
        }
      });
    }, { threshold: 0.3 });

    sections.forEach(section => observer.observe(section));
  }
};

// ==============================
// HERO SLIDER
// ==============================
const HeroSlider = {
  slides: null,
  dots: null,
  current: 0,
  total: 0,
  autoPlayInterval: null,
  autoPlayDelay: 5000,

  init() {
    this.slides = document.querySelectorAll('.hero-slide');
    this.dots = document.querySelectorAll('.hero-dots .dot');
    this.total = this.slides.length;

    if (this.total === 0) return;

    document.getElementById('heroPrev')?.addEventListener('click', () => {
      this.prev();
      this.resetAutoPlay();
    });

    document.getElementById('heroNext')?.addEventListener('click', () => {
      this.next();
      this.resetAutoPlay();
    });

    this.dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        this.goTo(i);
        this.resetAutoPlay();
      });
    });

    this.startAutoPlay();

    // Touch/swipe support
    let startX = 0;
    const slider = document.getElementById('heroSlider');
    if (slider) {
      slider.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
      slider.addEventListener('touchend', e => {
        const diff = startX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
          diff > 0 ? this.next() : this.prev();
          this.resetAutoPlay();
        }
      });
    }
  },

  goTo(index) {
    if (this.total === 0 || !this.slides || !this.slides[this.current]) return;
    this.slides[this.current].classList.remove('active');
    this.dots[this.current]?.classList.remove('active');

    this.current = (index + this.total) % this.total;

    if (this.slides[this.current]) {
      this.slides[this.current].classList.add('active');
      this.dots[this.current]?.classList.add('active');
    }
  },

  next() { this.goTo(this.current + 1); },
  prev() { this.goTo(this.current - 1); },

  startAutoPlay() {
    this.autoPlayInterval = setInterval(() => this.next(), this.autoPlayDelay);
  },

  resetAutoPlay() {
    clearInterval(this.autoPlayInterval);
    this.startAutoPlay();
  }
};

// ==============================
// SEARCH OVERLAY
// ==============================
const Search = {
  init() {
    const searchBtn = document.getElementById('searchBtn');
    const searchOverlay = document.getElementById('searchOverlay');
    const searchClose = document.getElementById('searchClose');
    const searchInput = document.getElementById('searchInput');

    searchBtn?.addEventListener('click', () => {
      searchOverlay.classList.add('active');
      setTimeout(() => searchInput?.focus(), 300);
    });

    searchClose?.addEventListener('click', () => {
      searchOverlay.classList.remove('active');
    });

    searchOverlay?.addEventListener('click', (e) => {
      if (e.target === searchOverlay) {
        searchOverlay.classList.remove('active');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && searchOverlay?.classList.contains('active')) {
        searchOverlay.classList.remove('active');
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchOverlay?.classList.toggle('active');
        if (searchOverlay?.classList.contains('active')) {
          setTimeout(() => searchInput?.focus(), 300);
        }
      }
    });
  }
};

// ==============================
// ANIMATION OBSERVER (AOS-like)
// ==============================
const AnimationObserver = {
  init() {
    const elements = document.querySelectorAll('[data-aos]');
    if (!elements.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const delay = parseInt(entry.target.getAttribute('data-aos-delay') || 0);
          setTimeout(() => {
            entry.target.classList.add('aos-animate');
          }, delay);
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    elements.forEach(el => observer.observe(el));
  }
};

// ==============================
// COUNTER ANIMATION
// ==============================
const CounterAnimation = {
  init() {
    const counters = document.querySelectorAll('.stat-number[data-target]');
    if (!counters.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(counter => observer.observe(counter));
  },

  animateCounter(el) {
    const target = parseInt(el.getAttribute('data-target'));
    const suffix = el.getAttribute('data-suffix') || '';
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;

    const update = () => {
      current = Math.min(current + step, target);
      el.textContent = Math.floor(current).toLocaleString('bn-BD') + suffix;

      if (current < target) {
        requestAnimationFrame(update);
      } else {
        el.textContent = target.toLocaleString('bn-BD') + suffix;
      }
    };

    requestAnimationFrame(update);
  }
};

// ==============================
// NEWS TABS
// ==============================
const NewsTabs = {
  init() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    if (!tabBtns.length) return;

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-tab');

        // Remove active class from all buttons
        tabBtns.forEach(b => b.classList.remove('active-tab'));
        // Hide all contents
        tabContents.forEach(c => {
          c.classList.remove('active-content');
        });

        // Add active class to clicked button
        btn.classList.add('active-tab');

        // Show target content
        const targetContent = document.getElementById(targetId);
        if (targetContent) {
          targetContent.classList.add('active-content');
        }
      });
    });
  }
};

// ==============================
// ELECTION TABS
// ==============================
const ElectionTabs = {
  init() {
    document.querySelectorAll('.el-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-el');

        document.querySelectorAll('.el-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.el-content').forEach(c => {
          c.style.display = 'none';
          c.classList.remove('active');
        });

        tab.classList.add('active');

        const content = document.getElementById(`el-${target}`);
        if (content) {
          content.style.display = 'block';
          content.classList.add('active');
        }
      });
    });
  }
};

// ==============================
// DONATE AMOUNT SELECTOR
// ==============================
const DonateSelector = {
  init() {
    document.querySelectorAll('.da-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.da-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const input = document.querySelector('.donate-input');
        if (input) {
          input.value = btn.getAttribute('data-amount');
        }
      });
    });
  }
};

// ==============================
// CONTACT FORM
// ==============================
const ContactForm = {
  init() {
    const form = document.getElementById('home-page-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Validate CAPTCHA
      const captchaInput = document.getElementById('strCAPTCHA');
      if (captchaInput && captchaInput.value.trim().toUpperCase() !== 'R7P9') {
        captchaInput.style.borderColor = 'var(--color-primary)';
        captchaInput.classList.add('shake');
        setTimeout(() => {
          captchaInput.classList.remove('shake');
        }, 500);
        alert('ক্যাপচা কোড ভুল হয়েছে! অনুগ্রহ করে আবার চেষ্টা করুন। (Incorrect CAPTCHA!)');
        return;
      } else if (captchaInput) {
        captchaInput.style.borderColor = '';
      }

      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn.innerHTML;

      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> পাঠানো হচ্ছে...';
      btn.disabled = true;

      setTimeout(() => {
        btn.innerHTML = '<i class="fas fa-check"></i> বার্তা পাঠানো হয়েছে!';
        btn.style.background = 'linear-gradient(135deg, #1a6a1a, #0a3a0a)';

        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.disabled = false;
          btn.style.background = '';
          form.reset();
        }, 3000);
      }, 1500);
    });
  }
};

// ==============================
// BACK TO TOP
// ==============================
const BackToTop = {
  init() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
};

// ==============================
// RIPPLE EFFECT ON CARDS
// ==============================
const RippleEffect = {
  init() {
    document.querySelectorAll('.qa-card, .news-item, .stat-card, .analysis-card, .intl-card').forEach(el => {
      el.addEventListener('click', function(e) {
        const ripple = document.createElement('div');
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ripple.style.cssText = `
          position: absolute;
          border-radius: 50%;
          background: rgba(204, 0, 0, 0.3);
          width: 10px; height: 10px;
          left: ${x}px; top: ${y}px;
          transform: translate(-50%, -50%) scale(0);
          animation: ripple-expand 0.6s ease-out forwards;
          pointer-events: none;
          z-index: 100;
        `;

        this.style.position = 'relative';
        this.style.overflow = 'hidden';
        this.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
      });
    });

    // Inject ripple animation
    if (!document.getElementById('ripple-style')) {
      const style = document.createElement('style');
      style.id = 'ripple-style';
      style.textContent = `
        @keyframes ripple-expand {
          to { transform: translate(-50%, -50%) scale(30); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }
};

// ==============================
// MAGNETIC HOVER EFFECT (subtle)
// ==============================
const MagneticHover = {
  init() {
    document.querySelectorAll('.btn-primary-glow, .btn-donate, .theme-toggle-fab').forEach(btn => {
      btn.addEventListener('mousemove', function(e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        this.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
      });

      btn.addEventListener('mouseleave', function() {
        this.style.transform = '';
      });
    });
  }
};

// ==============================
// SCROLL-LINKED HEADER TRANSPARENCY
// ==============================
const HeaderEffect = {
  init() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    window.addEventListener('scroll', () => {
      const opacity = Math.min(window.scrollY / 100, 1);
      // Smoothly increase blur and opacity
      const blur = 8 + opacity * 8;
      navbar.style.backdropFilter = `blur(${blur}px)`;
      navbar.style.webkitBackdropFilter = `blur(${blur}px)`;
    }, { passive: true });
  }
};

// ==============================
// TYPING ANIMATION for Hero
// ==============================
const TypingEffect = {
  texts: ['গণতন্ত্রের রক্ষক', 'শ্রমজীবীর সঙ্গী', 'ন্যায়ের সংগ্রামী', 'বাংলার আশার আলো'],
  current: 0,
  charIndex: 0,
  isDeleting: false,
  element: null,

  init() {
    // Add a typing element somewhere if needed
    // This is optional, implemented as an enhancement
  }
};

// ==============================
// SMOOTH PARALLAX (light)
// ==============================
const Parallax = {
  init() {
    const emblem = document.querySelector('.hero-emblem');
    if (!emblem) return;

    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      emblem.style.transform = `translateY(calc(-50% + ${scrollY * 0.15}px))`;
    }, { passive: true });
  }
};

// ==============================
// NEWSLETTER FORM
// ==============================
const NewsletterForm = {
  init() {
    const form = document.querySelector('.newsletter-form');
    if (!form) return;

    const btn = form.querySelector('.btn-newsletter');
    const input = form.querySelector('input');

    btn?.addEventListener('click', () => {
      if (!input?.value || !input.value.includes('@')) {
        input?.style.setProperty('border-color', '#e31b23');
        setTimeout(() => input?.style.setProperty('border-color', ''), 2000);
        return;
      }

      btn.innerHTML = '<i class="fas fa-check"></i>';
      btn.style.background = 'linear-gradient(135deg, #1a6a1a, #0a3a0a)';
      input.value = '';

      setTimeout(() => {
        btn.innerHTML = '<i class="fas fa-paper-plane"></i>';
        btn.style.background = '';
      }, 3000);
    });
  }
};

// ==============================
// GALLERY LIGHTBOX (simple)
// ==============================
const Gallery = {
  init() {
    document.querySelectorAll('.gallery-item').forEach(item => {
      item.addEventListener('click', () => {
        // Simple gallery click feedback
        item.style.transform = 'scale(0.98)';
        setTimeout(() => {
          item.style.transform = '';
        }, 150);
      });
    });
  }
};

// ==============================
// VIDEO GALLERY INTERACTIVE PLAYER
// ==============================
const VideoGallery = {
  init() {
    const player = document.querySelector('.main-video-player');
    const iframeMock = document.querySelector('.video-iframe-mock');
    const playlistItems = document.querySelectorAll('.playlist-item');

    if (!player) return;

    const playVideo = (url, title) => {
      player.textContent = '';
      const iframe = document.createElement('iframe');
      iframe.setAttribute('src', `${url}?autoplay=1`);
      iframe.setAttribute('title', title);
      iframe.setAttribute('frameborder', '0');
      iframe.setAttribute(
        'allow',
        'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
      );
      iframe.setAttribute('allowfullscreen', '');
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      player.appendChild(iframe);
    };

    if (iframeMock) {
      iframeMock.addEventListener('click', () => {
        const url = iframeMock.getAttribute('data-current-url');
        const title = iframeMock.getAttribute('data-current-title') || 'Video';
        playVideo(url, title);
      });
    }

    playlistItems.forEach(item => {
      item.addEventListener('click', () => {
        playlistItems.forEach(i => i.classList.remove('active-item'));
        item.classList.add('active-item');

        const url = item.getAttribute('data-video-url');
        const title = item.querySelector('.playlist-title')?.textContent || 'Video';
        playVideo(url, title);
      });
    });
  }
};

// ==============================
// CURSOR GLOW EFFECT
// ==============================
const CursorGlow = {
  glow: null,

  init() {
    if (window.matchMedia('(pointer: coarse)').matches) return; // Skip on touch devices

    this.glow = document.createElement('div');
    this.glow.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: 9998;
      width: 300px;
      height: 300px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(227,27,35,0.06) 0%, transparent 70%);
      transform: translate(-50%, -50%);
      transition: opacity 0.3s ease;
      mix-blend-mode: screen;
    `;
    document.body.appendChild(this.glow);

    document.addEventListener('mousemove', (e) => {
      requestAnimationFrame(() => {
        if (this.glow) {
          this.glow.style.left = e.clientX + 'px';
          this.glow.style.top = e.clientY + 'px';
        }
      });
    });

    document.addEventListener('mouseleave', () => {
      if (this.glow) this.glow.style.opacity = '0';
    });

    document.addEventListener('mouseenter', () => {
      if (this.glow) this.glow.style.opacity = '1';
    });
  }
};

// ==============================
// CARD TILT EFFECT (3D)
// ==============================
const CardTilt = {
  init() {
    if (window.matchMedia('(pointer: coarse)').matches) return;

    document.querySelectorAll('.analysis-card, .leader-card, .doc-card').forEach(card => {
      card.addEventListener('mousemove', function(e) {
        const rect = this.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        const rotateX = (y - 0.5) * -8;
        const rotateY = (x - 0.5) * 8;

        this.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
        this.style.transition = 'transform 0.1s ease';
      });

      card.addEventListener('mouseleave', function() {
        this.style.transform = '';
        this.style.transition = 'transform 0.4s ease';
      });
    });
  }
};

// ==============================
// STAGGER ANIMATION on load
// ==============================
const StaggerLoad = {
  init() {
    const items = document.querySelectorAll('.qa-card');
    items.forEach((item, i) => {
      item.style.opacity = '0';
      item.style.transform = 'translateY(20px)';

      setTimeout(() => {
        item.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        item.style.opacity = '1';
        item.style.transform = 'translateY(0)';
      }, 2200 + i * 80);
    });
  }
};

// ==============================
// SCROLL PROGRESS BAR
// ==============================
const ScrollProgress = {
  init() {
    const bar = document.createElement('div');
    bar.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      height: 3px;
      background: linear-gradient(to right, #cc0000, #ffffff);
      z-index: 9999;
      width: 0%;
      transition: width 0.1s linear;
      box-shadow: 0 0 10px rgba(204,0,0,0.5);
    `;
    document.body.appendChild(bar);

    window.addEventListener('scroll', () => {
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = (window.scrollY / docH) * 100;
      bar.style.width = scrolled + '%';
    }, { passive: true });
  }
};

// ==============================
// FLOATING ANIMATION for section decorators
// ==============================
const FloatingDecorators = {
  init() {
    // Add animated background decorators
    const sections = document.querySelectorAll('section');
    sections.forEach((section, i) => {
      if (i % 3 === 0) {
        const decorator = document.createElement('div');
        decorator.style.cssText = `
          position: absolute;
          width: 300px;
          height: 300px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(204,0,0,0.035) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
          ${i % 2 === 0 ? 'top: -100px; right: -100px;' : 'bottom: -100px; left: -100px;'}
          animation: float-decorator ${6 + i}s ease-in-out infinite;
        `;
        section.style.position = section.style.position || 'relative';
        section.appendChild(decorator);
      }
    });

    const style = document.createElement('style');
    style.textContent = `
      @keyframes float-decorator {
        0%, 100% { transform: translate(0, 0) scale(1); }
        33% { transform: translate(20px, -20px) scale(1.1); }
        66% { transform: translate(-10px, 10px) scale(0.9); }
      }
    `;
    document.head.appendChild(style);
  }
};

// ==============================
// TICKER PAUSE ON HOVER
// ==============================
const Ticker = {
  init() {
    const tickerContent = document.querySelector('.ticker');
    const tickerWrapper = document.querySelector('.ticker-wrap');

    if (!tickerContent || !tickerWrapper) return;

    tickerWrapper.addEventListener('mouseenter', () => {
      tickerContent.style.animationPlayState = 'paused';
    });

    tickerWrapper.addEventListener('mouseleave', () => {
      tickerContent.style.animationPlayState = 'running';
    });
  }
};

// ==============================
// KEYBOARD NAVIGATION
// ==============================
const KeyboardNav = {
  init() {
    // Arrow key navigation for hero slider
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') HeroSlider.prev();
      if (e.key === 'ArrowRight') HeroSlider.next();
    });
  }
};

// ==============================
// INITIALIZE ALL MODULES
// ==============================
document.addEventListener('DOMContentLoaded', () => {
  // Core
  ThemeManager.init();
  Preloader.init();

  // Visual
  Particles.init();
  ScrollProgress.init();
  CursorGlow.init();

  // Navigation
  Navbar.init();
  Search.init();
  BackToTop.init();
  Ticker.init();
  KeyboardNav.init();

  // Slider
  HeroSlider.init();

  // Tabs & interactions
  NewsTabs.init();
  ElectionTabs.init();
  DonateSelector.init();

  // Forms
  ContactForm.init();
  NewsletterForm.init();

  // Effects
  RippleEffect.init();
  MagneticHover.init();
  CardTilt.init();
  HeaderEffect.init();
  Gallery.init();
  VideoGallery.init();
  FloatingDecorators.init();
  StaggerLoad.init();
  Parallax.init();

  // Animations initialized after preloader
  // AnimationObserver.init() and CounterAnimation.init() are called in Preloader
});

// Fallback: if preloader doesn't fire properly
window.addEventListener('load', () => {
  setTimeout(() => {
    AnimationObserver.init();
    CounterAnimation.init();
  }, 2000);
});
