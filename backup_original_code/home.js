/* ============================================================
   SFI WEST BENGAL — DEDICATED HOMEPAGE JAVASCRIPT
   Interactions, Animations, Slider, and Particle Canvas
   ============================================================ */

'use strict';

// ==============================
// THEME MANAGEMENT (Home Hook)
// ==============================
const HomeTheme = {
  key: 'sfi-theme',
  current: 'dark',

  init() {
    const saved = localStorage.getItem(this.key) || 'dark';
    this.apply(saved);

    const toggleBtn = document.getElementById('themeToggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggle());
    }
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

    // Toggle images
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
          // Trigger animations on start
          StatsCounter.init();
        }, 600);
      }, 1500);
    });
  }
};

// ==============================
// PARTICLES BACKGROUND
// ==============================
const ParticlesBg = {
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
    const spacing = 35;
    const cols = Math.ceil(this.canvas.width / spacing) + 1;
    const rows = Math.ceil(this.canvas.height / spacing) + 1;

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const baseX = c * spacing;
        const baseY = r * spacing;
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

    if (this.mouse.targetX !== null && this.mouse.targetY !== null) {
      if (this.mouse.x === null) {
        this.mouse.x = this.mouse.targetX;
        this.mouse.y = this.mouse.targetY;
      } else {
        this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.15;
        this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.15;
      }
      
      const glow = document.getElementById('cursorGlow');
      if (glow) {
        glow.style.left = `${this.mouse.x}px`;
        glow.style.top = `${this.mouse.y}px`;
        glow.style.opacity = '0.85';
      }
    } else {
      this.mouse.x = null;
      this.mouse.y = null;
      
      const glow = document.getElementById('cursorGlow');
      if (glow) {
        glow.style.opacity = '0';
      }
    }

    const mx = this.mouse.x;
    const my = this.mouse.y;
    const maxDist = 150;
    const pushStrength = 40;
    const easeRate = 0.1;

    this.particles.forEach(p => {
      let targetX = p.baseX;
      let targetY = p.baseY;
      let targetSize = 1.5;
      let targetOpacity = theme === 'dark' ? 0.14 : 0.12;
      let angle = Math.PI / 4;

      if (mx !== null && my !== null) {
        const dx = p.baseX - mx;
        const dy = p.baseY - my;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist < maxDist) {
          const force = (maxDist - dist) / maxDist;
          if (dist > 0) {
            targetX = p.baseX + (dx / dist) * force * pushStrength;
            targetY = p.baseY + (dy / dist) * force * pushStrength;
          }
          angle = Math.atan2(dy, dx) + Math.PI / 2;
          targetSize = 1.5 + force * 2.2;
          targetOpacity = theme === 'dark' ? 0.14 + force * 0.75 : 0.12 + force * 0.65;
        }
      }

      p.x += (targetX - p.x) * easeRate;
      p.y += (targetY - p.y) * easeRate;
      p.currentSize += (targetSize - p.currentSize) * easeRate;
      p.currentOpacity += (targetOpacity - p.currentOpacity) * easeRate;

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
// HERO SLIDER CONTROLLER
// ==============================
const HomeSlider = {
  slides: [],
  dots: [],
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

    this.dots.forEach((dot, idx) => {
      dot.addEventListener('click', () => {
        this.goTo(idx);
        this.resetAutoPlay();
      });
    });

    this.startAutoPlay();

    // Swipe support
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

  goTo(idx) {
    if (this.total === 0) return;
    this.slides[this.current].classList.remove('active');
    this.dots[this.current]?.classList.remove('active');

    this.current = (idx + this.total) % this.total;

    this.slides[this.current].classList.add('active');
    this.dots[this.current]?.classList.add('active');
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
// NEWS TABS CONTROLLER
// ==============================
const HomeNewsTabs = {
  init() {
    const tabs = document.querySelectorAll('.news-tab');
    if (!tabs.length) return;

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // In this redesign, we provide visual click feedback
        // To make it look interactive, we trigger a subtle fade animation on the news items
        const newsItems = document.querySelectorAll('.news-item, .news-featured');
        newsItems.forEach(item => {
          item.style.opacity = '0.3';
          setTimeout(() => {
            item.style.opacity = '';
          }, 300);
        });
      });
    });
  }
};

// ==============================
// ELECTIONS TABS
// ==============================
const HomeElectionTabs = {
  init() {
    const tabs = document.querySelectorAll('.el-tab');
    if (!tabs.length) return;

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-el');

        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Toggle contents
        const contentVidhan = document.getElementById('el-vidhan');
        const contentLok = document.getElementById('el-lok');

        if (target === 'vidhan') {
          if (contentVidhan) contentVidhan.classList.add('active');
          if (contentLok) contentLok.classList.remove('active');
        } else {
          if (contentVidhan) contentVidhan.classList.remove('active');
          if (contentLok) contentLok.classList.add('active');
        }
      });
    });
  }
};

// ==============================
// INTERACTIVE VIDEO GALLERY
// ==============================
const HomeVideoGallery = {
  init() {
    const mainEmbed = document.querySelector('.video-embed');
    const items = document.querySelectorAll('.video-item');

    if (!mainEmbed || !items.length) return;

    items.forEach(item => {
      item.addEventListener('click', () => {
        items.forEach(i => i.classList.remove('active-video'));
        item.classList.add('active-video');

        // Get video details or mock URLs
        // For demonstration, we switch between a few standard YouTube links
        let url = 'https://www.youtube.com/embed/AFRTZXBhD2Y?enablejsapi=1&autoplay=1';
        const title = item.querySelector('h4')?.textContent || 'SFI Campaign';

        if (title.includes(' পুলিশের বর্বরতা')) {
          url = 'https://www.youtube.com/embed/4AqaOpJ8LX8?enablejsapi=1&autoplay=1';
        } else if (title.includes('সৃজন ভট্টাচার্য')) {
          url = 'https://www.youtube.com/embed/yIv8CpBLXl8?enablejsapi=1&autoplay=1';
        } else if (title.includes('৫৫ বছরের ইতিহাস')) {
          url = 'https://www.youtube.com/embed/AFRTZXBhD2Y?enablejsapi=1&autoplay=1';
        }

        mainEmbed.textContent = '';
        const iframe = document.createElement('iframe');
        iframe.src = url;
        iframe.title = title;
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
        iframe.setAttribute('allowfullscreen', '');
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        mainEmbed.appendChild(iframe);
      });
    });
  }
};

// ==============================
// STATS AUTO COUNTER
// ==============================
const StatsCounter = {
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
// CONTACT FORM VALIDATOR
// ==============================
const HomeContactForm = {
  init() {
    const form = document.getElementById('home-page-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // CAPTCHA Validation
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
// INITIALIZE ALL EVENTS
// ==============================
document.addEventListener('DOMContentLoaded', () => {
  HomeTheme.init();
  Preloader.init();
  ParticlesBg.init();
  HomeSlider.init();
  HomeNewsTabs.init();
  HomeElectionTabs.init();
  HomeVideoGallery.init();
  HomeContactForm.init();
  
  // Mobile Nav Active State Tracking
  const hash = window.location.hash;
  if (hash) {
    document.querySelectorAll('.mobile-nav-item').forEach(item => {
      if (item.getAttribute('href') === hash) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }
  
  document.querySelectorAll('.mobile-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.mobile-nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
    });
  });
});
