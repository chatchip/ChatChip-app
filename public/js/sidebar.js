// ============================================================
// SIDEBAR KONTROLLERİ (Bağımsız)
// ============================================================

function toggleSidebar(side) {
    console.log('🔄 toggleSidebar çağrıldı:', side);
    
    const left = document.getElementById('sidebarLeft');
    const right = document.getElementById('sidebarRight');
    const overlay = document.getElementById('overlay');
    
    console.log('📦 Elementler:', { left: !!left, right: !!right, overlay: !!overlay });
    
    if (side === 'left') {
        if (left) {
            left.classList.toggle('active');
            console.log('✅ Sol menü toggled, active:', left.classList.contains('active'));
        }
    } else if (side === 'right') {
        if (right) {
            right.classList.toggle('active');
            console.log('✅ Sağ menü toggled, active:', right.classList.contains('active'));
        }
    }
    
    if (overlay) {
        if (left?.classList.contains('active') || right?.classList.contains('active')) {
            overlay.classList.add('active');
        } else {
            overlay.classList.remove('active');
        }
    }
}

function closeAllSidebars() {
    console.log('🔄 closeAllSidebars çağrıldı');
    const left = document.getElementById('sidebarLeft');
    const right = document.getElementById('sidebarRight');
    const overlay = document.getElementById('overlay');
    
    if (left) left.classList.remove('active');
    if (right) right.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
}

// Global erişim
window.toggleSidebar = toggleSidebar;
window.closeAllSidebars = closeAllSidebars;

// ============================================================
// 🔐 FRONTEND XSS HARDENING
// app.js parser tarafından yüklendikten, DOMContentLoaded çalışmadan hemen önce
// güvenli render fonksiyonlarını devreye alır.
// ============================================================
(function installFrontendSecurityHardening() {
    const ALLOWED_TAGS = new Set([
        'P', 'BR', 'STRONG', 'B', 'EM', 'I', 'DEL', 'S',
        'CODE', 'PRE', 'BLOCKQUOTE', 'UL', 'OL', 'LI',
        'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'A', 'HR',
        'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD', 'IMG'
    ]);

    function isSafeUrl(value, allowImageData = false) {
        if (!value) return false;
        const raw = String(value).trim();
        if (raw.startsWith('#') || raw.startsWith('/')) return true;

        if (allowImageData && /^data:image\/(?:png|jpe?g|gif|webp);base64,/i.test(raw)) {
            return true;
        }

        try {
            const parsed = new URL(raw, window.location.origin);
            return ['http:', 'https:', 'mailto:', 'blob:'].includes(parsed.protocol);
        } catch {
            return false;
        }
    }

    function sanitizeNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            return document.createTextNode(node.textContent || '');
        }

        if (node.nodeType !== Node.ELEMENT_NODE) return null;

        const tag = node.tagName.toUpperCase();
        if (!ALLOWED_TAGS.has(tag)) {
            const fragment = document.createDocumentFragment();
            Array.from(node.childNodes).forEach(child => {
                const cleanChild = sanitizeNode(child);
                if (cleanChild) fragment.appendChild(cleanChild);
            });
            return fragment;
        }

        const clean = document.createElement(tag.toLowerCase());

        if (tag === 'A') {
            const href = node.getAttribute('href');
            if (isSafeUrl(href)) clean.setAttribute('href', href);
            const title = node.getAttribute('title');
            if (title) clean.setAttribute('title', title);
            clean.setAttribute('rel', 'noopener noreferrer');
        } else if (tag === 'IMG') {
            const src = node.getAttribute('src');
            if (isSafeUrl(src, true)) clean.setAttribute('src', src);
            const alt = node.getAttribute('alt');
            const title = node.getAttribute('title');
            if (alt) clean.setAttribute('alt', alt);
            if (title) clean.setAttribute('title', title);
            clean.setAttribute('loading', 'lazy');
            clean.setAttribute('referrerpolicy', 'no-referrer');
        } else if (tag === 'CODE') {
            const className = node.getAttribute('class') || '';
            if (/^(?:language-[a-z0-9_+.-]+)$/i.test(className)) {
                clean.setAttribute('class', className);
            }
        }

        Array.from(node.childNodes).forEach(child => {
            const cleanChild = sanitizeNode(child);
            if (cleanChild) clean.appendChild(cleanChild);
        });

        return clean;
    }

    function sanitizeHtml(html) {
        const parser = new DOMParser();
        const parsed = parser.parseFromString(String(html || ''), 'text/html');
        const container = document.createElement('div');

        Array.from(parsed.body.childNodes).forEach(node => {
            const cleanNode = sanitizeNode(node);
            if (cleanNode) container.appendChild(cleanNode);
        });

        return container.innerHTML;
    }

    function activateHardening() {
        if (typeof window.renderMarkdown === 'function') {
            const originalRenderMarkdown = window.renderMarkdown;
            window.renderMarkdown = function safeRenderMarkdown(text) {
                let html = '';
                try {
                    html = originalRenderMarkdown(String(text ?? ''));
                } catch (error) {
                    console.error('Markdown render error:', error);
                    html = String(text ?? '');
                }
                return sanitizeHtml(html);
            };
        }

        if (typeof window.renderSessions === 'function') {
            window.renderSessions = function safeRenderSessions() {
                const container = document.getElementById('chatHistory');
                if (!container) return;

                container.replaceChildren();

                if (!Array.isArray(sessions) || sessions.length === 0) {
                    const empty = document.createElement('div');
                    empty.style.cssText = 'text-align:center; padding:20px; color:var(--text-light); font-size:0.8rem;';
                    empty.textContent = 'Henüz sohbet yok';
                    container.appendChild(empty);
                    return;
                }

                const sorted = [...sessions].sort((a, b) => {
                    if (a.is_pinned && !b.is_pinned) return -1;
                    if (!a.is_pinned && b.is_pinned) return 1;
                    return new Date(b.updated_at) - new Date(a.updated_at);
                });

                sorted.forEach(session => {
                    const item = document.createElement('div');
                    item.className = `history-item${session.is_pinned ? ' pinned' : ''}`;
                    item.dataset.id = String(session.id);
                    item.addEventListener('click', () => loadSession(session.id));

                    const title = document.createElement('span');
                    title.textContent = `${session.is_pinned ? '📌 ' : '💬 '} ${session.title || 'Yeni Sohbet'}`;

                    const actions = document.createElement('div');
                    actions.className = 'history-actions';

                    const makeButton = (label, handler) => {
                        const button = document.createElement('button');
                        button.className = 'history-btn';
                        button.type = 'button';
                        button.textContent = label;
                        button.addEventListener('click', event => {
                            event.stopPropagation();
                            handler();
                        });
                        return button;
                    };

                    actions.appendChild(makeButton('✏️', () => renameSession(session.id, session.title || 'Yeni Sohbet')));
                    actions.appendChild(makeButton('📌', () => togglePin(session.id, !!session.is_pinned)));
                    actions.appendChild(makeButton('🗑️', () => deleteSession(session.id)));

                    item.appendChild(title);
                    item.appendChild(actions);
                    container.appendChild(item);
                });
            };
        }

        if (typeof window.setImageLoadingAnimation === 'function') {
            window.setImageLoadingAnimation = function safeSetImageLoadingAnimation(loadingMsgId, text) {
                const wrapper = document.getElementById(loadingMsgId);
                const bubble = wrapper?.querySelector('.bubble');
                if (!bubble) return;

                const markdownBody = document.createElement('div');
                markdownBody.className = 'markdown-body';

                const icon = document.createElement('span');
                icon.className = 'chatchip-loading-icon';
                icon.textContent = '✦';

                const label = document.createElement('span');
                label.textContent = String(text ?? '');

                markdownBody.appendChild(icon);
                markdownBody.appendChild(label);
                bubble.replaceChildren(markdownBody);
            };
        }

        window.ChatChipSanitizeHtml = sanitizeHtml;
        console.log('🔐 Frontend XSS hardening aktif');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('readystatechange', function onReadyStateChange() {
            if (document.readyState === 'interactive') {
                document.removeEventListener('readystatechange', onReadyStateChange);
                activateHardening();
            }
        });
    } else {
        activateHardening();
    }
})();

console.log('✅ Sidebar controller yüklendi!');
