// ChatChip UI helpers module
// Theme handling and plan-version display extracted from app.js.

// ============================================================
// DARK MODE
// ============================================================
function toggleDarkMode() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('chatchip_theme', newTheme);
    updateThemeIcon();
    showToast(newTheme === 'dark' ? '🌙 Dark Mod aktif' : '☀️ Light Mod aktif', 'info');
}

function initDarkMode() {
    const saved = localStorage.getItem('chatchip_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || 'light';
    document.documentElement.setAttribute('data-theme', theme);
}

function addDarkModeToggle() {
    return; // Otomatik ekleme kapatıldı
    const userMenu = document.getElementById('userMenu');
    if (!userMenu) return;
    if (document.getElementById('themeIcon')) return;
    
    const divider = userMenu.querySelector('.menu-divider');
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'menu-item';
    toggleBtn.style.justifyContent = 'center';
    toggleBtn.style.gap = '8px';
    toggleBtn.innerHTML = '<span id="themeIcon">🌓</span> Tema Değiştir';
    toggleBtn.onclick = toggleDarkMode;
    
    if (divider) {
        userMenu.insertBefore(toggleBtn, divider.nextSibling);
    } else {
        const promptItem = userMenu.querySelector('.prompt-item');
        if (promptItem) {
            userMenu.insertBefore(toggleBtn, promptItem);
        } else {
            userMenu.appendChild(toggleBtn);
        }
    }
    updateThemeIcon();
}

function updateThemeIcon() {
    const theme = document.documentElement.getAttribute('data-theme');
    const icon = document.getElementById('themeIcon');
    if (icon) {
        icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
}

window.toggleDarkMode = toggleDarkMode;
