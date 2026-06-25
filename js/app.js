const PAGES = [
    { id: 'daily', title: 'ጸሎት ዘዘወትር', subtitle: 'Daily Prayer', type: 'daily' },
    { id: 'monday', title: 'የሰኑይ ውዳሴ', subtitle: 'Monday', type: 'wedase' },
    { id: 'tuesday', title: 'የማክሰኞ ውዳሴ', subtitle: 'Tuesday', type: 'wedase' },
    { id: 'wednesday', title: 'የረቡዕ ውዳሴ', subtitle: 'Wednesday', type: 'wedase' },
    { id: 'thursday', title: 'የሐሙስ ውዳሴ', subtitle: 'Thursday', type: 'wedase' },
    { id: 'friday', title: 'የዓርብ ውዳሴ', subtitle: 'Friday', type: 'wedase' },
    { id: 'saturday', title: 'የቅዳሜ ውዳሴ', subtitle: 'Saturday', type: 'wedase' },
    { id: 'sunday', title: 'የእሑድ ውዳሴ', subtitle: 'Sunday', type: 'wedase' },
    { id: 'yiwedsewa_melaekt', title: 'ይዌድስዋ መላእክት', subtitle: 'Signs of Praises', type: 'special' },
    { id: 'anqetse_birhan', title: 'አንቀጸ ብርሃን', subtitle: 'Illumination', type: 'special' },
    { id: 'melka_mariam', title: 'መልክዐ ማርያም', subtitle: 'Image of Mary', type: 'special' },
    { id: 'melka_eyesus', title: 'መልክዐ ኢየሱስ', subtitle: 'Image of Jesus', type: 'special' }
];

// ==================== STATE ====================
let pos = 0;
let pages = [];
let isTransitioning = false;
let touchStartX = 0;
let touchEndX = 0;
let prayerData = null;

// ==================== DOM ====================
const viewport = () => document.getElementById('swipe-viewport');
const prevBtn = () => document.getElementById('prev-btn');
const nextBtn = () => document.getElementById('next-btn');
const dotsContainer = () => document.getElementById('nav-dots');
const pageIndicator = () => document.getElementById('page-indicator');
const pageProgress = () => document.getElementById('page-progress');

// ==================== THEME ====================
function initTheme() {
    const saved = localStorage.getItem('wedase_theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
}

function toggleTheme() {
    const themes = ['light', 'dark', 'sepia'];
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const idx = themes.indexOf(current);
    const next = themes[(idx + 1) % themes.length];
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('wedase_theme', next);
    const labels = { light: '☀️ Light', dark: '🌙 Dark', sepia: '📜 Sepia' };
    toast(labels[next] || next);
}

// ==================== FONT SETTINGS ====================
function initReadingSettings() {
    const size = parseInt(localStorage.getItem('wedase_font_size')) || 17;
    const lineHeight = parseFloat(localStorage.getItem('wedase_line_height')) || 1.85;
    const fontFamily = localStorage.getItem('wedase_font_family') || "'Noto Serif Ethiopic', Georgia, serif";
    document.documentElement.style.setProperty('--font-size', size + 'px');
    document.documentElement.style.setProperty('--line-height', lineHeight);
    document.documentElement.style.setProperty('--font-main', fontFamily);
    updateSettingDisplays(size, lineHeight, fontFamily);
}

function updateSettingDisplays(size, lineHeight, fontFamily) {
    const sizeEl = document.getElementById('font-size-display');
    const heightEl = document.getElementById('line-height-display');
    const familyEl = document.getElementById('font-family-select');
    if (sizeEl) sizeEl.textContent = size + 'px';
    if (heightEl) heightEl.textContent = lineHeight;
    if (familyEl) familyEl.value = fontFamily;
}

function changeFontSize(delta) {
    let size = parseInt(localStorage.getItem('wedase_font_size')) || 17;
    size = Math.max(14, Math.min(24, size + delta));
    localStorage.setItem('wedase_font_size', size);
    document.documentElement.style.setProperty('--font-size', size + 'px');
    document.getElementById('font-size-display').textContent = size + 'px';
}

function changeLineHeight(delta) {
    let h = parseFloat(localStorage.getItem('wedase_line_height')) || 1.85;
    h = Math.max(1.4, Math.min(2.4, h + delta));
    h = Math.round(h * 100) / 100;
    localStorage.setItem('wedase_line_height', h);
    document.documentElement.style.setProperty('--line-height', h);
    document.getElementById('line-height-display').textContent = h;
}

function changeFontFamily(font) {
    localStorage.setItem('wedase_font_family', font);
    document.documentElement.style.setProperty('--font-main', font);
}

function toggleSettings() {
    const panel = document.getElementById('settings-panel');
    panel.hidden = !panel.hidden;
}

// ==================== NAVIGATION ====================
function moveTo(dest) {
    if (isTransitioning) return;
    if (!Number.isInteger(dest)) return;
    if (dest >= pages.length) dest = pages.length - 1;
    if (dest < 0) dest = 0;
    if (pos === dest) return;
    
    isTransitioning = true;
    
    const nextPage = pages[dest];
    const currentPage = pages[pos];
    const direction = dest > pos ? 1 : -1;
    
    // Prepare next page
    nextPage.style.transition = 'none';
    nextPage.style.transform = `translateX(${100 * direction}%) scale(0.96)`;
    nextPage.style.opacity = '0.4';
    nextPage.style.display = 'block';
    
    // Force reflow
    void nextPage.offsetHeight;
    
    // Animate both pages
    nextPage.style.transition = 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s ease';
    currentPage.style.transition = 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s ease';
    
    currentPage.style.transform = `translateX(${-100 * direction}%) scale(0.96)`;
    currentPage.style.opacity = '0.4';
    nextPage.style.transform = 'translateX(0%) scale(1)';
    nextPage.style.opacity = '1';
    
    const onEnd = (ev) => {
        if (ev && ev.propertyName !== 'transform') return;
        currentPage.style.display = 'none';
        currentPage.style.transform = '';
        currentPage.style.opacity = '';
        pos = dest;
        isTransitioning = false;
        updateUI();
        currentPage.removeEventListener('transitionend', onEnd);
    };
    
    currentPage.addEventListener('transitionend', onEnd);
    
    // Fallback
    setTimeout(() => {
        if (isTransitioning) {
            currentPage.style.display = 'none';
            currentPage.style.transform = '';
            currentPage.style.opacity = '';
            pos = dest;
            isTransitioning = false;
            updateUI();
        }
    }, 500);
}

function moveBy(step) {
    moveTo(pos + step);
}

function goHome() {
    moveTo(0);
}

// ==================== UI UPDATES ====================
function updateUI() {
    prevBtn().disabled = pos <= 0;
    nextBtn().disabled = pos >= pages.length - 1;
    
    // Update dots
    const dots = dotsContainer().querySelectorAll('.nav-dot');
    dots.forEach((dot, i) => dot.classList.toggle('active', i === pos));
    
    // Update page indicator
    const page = PAGES[pos];
    if (pageIndicator()) {
        pageIndicator().textContent = `${page.title}  ·  ${pos + 1} / ${pages.length}`;
    }
    
    // Update progress bar
    if (pageProgress()) {
        const pct = ((pos + 1) / pages.length) * 100;
        pageProgress().style.width = pct + '%';
    }
    
    // Update URL hash
    window.location.hash = page.id;
}

// ==================== DOTS ====================
function renderDots() {
    const container = dotsContainer();
    container.innerHTML = '';
    PAGES.forEach((page, i) => {
        const dot = document.createElement('button');
        dot.className = 'nav-dot' + (i === pos ? ' active' : '');
        dot.setAttribute('aria-label', `Go to ${page.title}`);
        dot.setAttribute('role', 'tab');
        dot.addEventListener('click', () => moveTo(i));
        container.appendChild(dot);
    });
}

// ==================== RENDER PAGES ====================
async function renderPages() {
    const container = viewport();
    container.innerHTML = '<div class="loading"><div class="loader"></div><div class="loading-text">Loading prayers...</div></div>';
    
    // Fetch data
    try {
        const resp = await fetch('data/wedase_mariam.json');
        prayerData = await resp.json();
    } catch (e) {
        console.warn('Could not load data:', e);
        prayerData = {};
    }
    
    container.innerHTML = '';
    pages = [];
    
    PAGES.forEach((pageInfo, index) => {
        const pageDiv = document.createElement('div');
        pageDiv.className = 'page';
        pageDiv.id = `page-${pageInfo.id}`;
        pageDiv.style.display = index === 0 ? 'block' : 'none';
        
        const content = document.createElement('div');
        content.className = 'page-content';
        content.innerHTML = getPageContent(pageInfo);
        
        pageDiv.appendChild(content);
        container.appendChild(pageDiv);
        pages.push(pageDiv);
    });
    
    renderDots();
    updateUI();
}

function getPageContent(pageInfo) {
    if (!prayerData) return '<div class="prayer-text"><p>Loading...</p></div>';
    
    const section = prayerData[pageInfo.id];
    let html = '';
    
    // Page header
    html += '<div class="page-header">';
    html += `<h1 class="page-title">${pageInfo.title}</h1>`;
    html += `<p class="page-subtitle">${pageInfo.subtitle}</p>`;
    html += '</div>';
    
    if (section && section.content) {
        const contentText = section.content.am || section.content.ge || section.content.en || '';
        if (contentText) {
            html += renderFormattedText(contentText);
        } else {
            html += '<div class="prayer-text"><p style="text-align:center;color:var(--text-muted);">Content coming soon.</p></div>';
        }
    } else {
        html += '<div class="prayer-text"><p style="text-align:center;color:var(--text-muted);">Content coming soon.</p></div>';
    }
    
    return html;
}

function renderFormattedText(text) {
    let html = '<div class="prayer-text">';
    
    // Split into paragraphs (double newline = new paragraph)
    const paragraphs = text.split(/\n\n+/);
    
    paragraphs.forEach(p => {
        const trimmed = p.trim();
        if (!trimmed) return;
        
        // Check if it's a numbered point (starts with ፩, ፪, ፫, etc.)
        const isNumbered = /^[፩፪፫፬፭፮፯፰፱፲]/.test(trimmed);
        
        // Check if it's a response line (contains "ቅድስት ሆይ" or "ምላሽ")
        const isResponse = trimmed.includes('ቅድስት ሆይ') && trimmed.length < 60;
        const isShortResponse = trimmed === 'ቅድስት ሆይ ለምኝልን።' || trimmed === 'ቅድስት ሆይ ለምኝልን';
        
        if (isShortResponse) {
            html += `<p class="response">${trimmed}</p>`;
        } else if (isNumbered) {
            // Preserve line breaks within numbered points
            const formatted = trimmed.replace(/\n/g, '<br>');
            html += `<p>${formatted}</p>`;
        } else {
            const formatted = trimmed.replace(/\n/g, '<br>');
            html += `<p>${formatted}</p>`;
        }
    });
    
    html += '</div>';
    return html;
}

// ==================== TOAST ====================
function toast(message, duration = 2500) {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = message;
    container.appendChild(el);
    
    requestAnimationFrame(() => el.classList.add('show'));
    
    setTimeout(() => {
        el.classList.remove('show');
        setTimeout(() => el.remove(), 300);
    }, duration);
}

// ==================== TOUCH HANDLING ====================
function initTouchHandling() {
    const container = document.querySelector('.swipe-container');
    if (!container) return;
    
    container.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    container.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
    
    function handleSwipe() {
        const diff = touchEndX - touchStartX;
        const threshold = 60;
        if (Math.abs(diff) > threshold) {
            if (diff < 0) moveBy(1);
            else moveBy(-1);
        }
    }
}

// ==================== KEYBOARD NAVIGATION ====================
function initKeyboard() {
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
        if (e.target.closest('.settings-card')) return;
        
        switch(e.key) {
            case 'ArrowLeft': e.preventDefault(); moveBy(-1); break;
            case 'ArrowRight': e.preventDefault(); moveBy(1); break;
            case 'Home': e.preventDefault(); moveTo(0); break;
            case 'End': e.preventDefault(); moveTo(pages.length - 1); break;
        }
    });
}

// ==================== HASH NAVIGATION ====================
function initHashNavigation() {
    window.addEventListener('hashchange', () => {
        if (isTransitioning) return;
        const hash = window.location.hash.slice(1);
        const pageIndex = PAGES.findIndex(p => p.id === hash);
        if (pageIndex >= 0 && pageIndex !== pos) {
            moveTo(pageIndex);
        }
    });
}

// ==================== SETTINGS OVERLAY ====================
function initSettingsOverlay() {
    // Close on overlay click
    document.addEventListener('click', (e) => {
        const panel = document.getElementById('settings-panel');
        if (panel.hidden) return;
        if (!panel.contains(e.target) && !e.target.closest('.icon-btn')) {
            panel.hidden = true;
        }
    });
    
    // Close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.getElementById('settings-panel').hidden = true;
        }
    });
}

// ==================== HEADER SCROLL EFFECT ====================
function initScrollEffect() {
    const header = document.querySelector('.header');
    const container = document.querySelector('.swipe-container');
    if (!container) return;
    
    container.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', container.scrollTop > 10);
    }, { passive: true });
}

// ==================== INIT ====================
async function init() {
    initTheme();
    initReadingSettings();
    
    // Set initial position from hash
    const hash = window.location.hash.slice(1);
    if (hash) {
        const idx = PAGES.findIndex(p => p.id === hash);
        if (idx >= 0) pos = idx;
    }
    
    await renderPages();
    initTouchHandling();
    initKeyboard();
    initHashNavigation();
    initSettingsOverlay();
    initScrollEffect();
    
    console.log('☩ Wedase Mariam app initialized');
}

// Start
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Global functions
window.moveTo = moveTo;
window.moveBy = moveBy;
window.toggleTheme = toggleTheme;
window.toggleSettings = toggleSettings;
window.changeFontSize = changeFontSize;
window.changeLineHeight = changeLineHeight;
window.changeFontFamily = changeFontFamily;
window.goHome = goHome;
