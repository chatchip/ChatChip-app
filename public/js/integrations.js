// ============================================================
// 🔌 CHATCHIP ENTEGRASYONLARI + AI ÇALIŞAN GİRİŞİ
// Gmail OAuth bağlantısı Composio üzerinden backend tarafından başlatılır.
// Ana ekranda yalnızca Gmail ve AI Çalışanı gösterilir.
// ============================================================

(function initIntegrations() {
    const API_BASE = 'https://api.thechatchip.com/api';

    function getToken() {
        return window.DataManager?.getToken?.() || localStorage.getItem('chatchip_token');
    }

    function getGmailButton() {
        return document.querySelector('.integration-connect[data-integration="Gmail"]');
    }

    function buildAiEmployeeCard() {
        const card = document.createElement('div');
        card.className = 'integration-card';
        card.dataset.feature = 'ai-employee';
        card.innerHTML = `
            <span class="integration-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="8" r="3.5"></circle>
                    <path d="M5 20c.8-3.2 3.2-5 7-5s6.2 1.8 7 5"></path>
                    <path d="M18.5 4.5v4"></path>
                    <path d="M16.5 6.5h4"></path>
                </svg>
            </span>
            <span class="integration-name">AI Çalışanı</span>
            <button type="button" class="integration-connect" data-integration="AIEmployee">Oluştur</button>
        `;
        return card;
    }

    function simplifyQuickActions() {
        const row = document.getElementById('quickSuggestions');
        if (!row) return;

        const gmailCard = getGmailButton()?.closest('.integration-card');
        if (!gmailCard) return;

        // Instagram / WhatsApp / TikTok kartlarını ana ekrandan kaldır.
        // Gmail kartının kendisine dokunmuyoruz; mevcut OAuth akışı aynen devam eder.
        row.replaceChildren(gmailCard, buildAiEmployeeCard());
        row.style.gridTemplateColumns = 'repeat(2, minmax(0, 1fr))';
        row.style.maxWidth = '360px';
        row.setAttribute('aria-label', 'ChatChip araçları');

        const note = row.nextElementSibling;
        if (note?.classList.contains('integration-note')) {
            note.textContent = "ChatChip'i işine bağla, AI çalışanını oluştur.";
        }
    }

    function setGmailConnected(button, connected) {
        if (!button) return;

        button.dataset.connected = connected ? 'true' : 'false';
        button.textContent = connected ? 'Bağlı ✓' : 'Bağla';
        button.disabled = connected;
        button.setAttribute('aria-label', connected ? 'Gmail bağlı' : 'Gmail bağla');
    }

    async function checkGmailStatus() {
        const token = getToken();
        const button = getGmailButton();

        if (!token || !button) return;

        try {
            const response = await fetch(`${API_BASE}/gmail/status`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                console.warn(`⚠️ Gmail durum kontrolü başarısız (${response.status}).`);
                return;
            }

            const data = await response.json();
            setGmailConnected(button, data.connected === true);
        } catch (error) {
            // Entegrasyon durum kontrolü ana ChatChip deneyimini bozmamalı.
            console.warn('⚠️ Gmail durum kontrolü yapılamadı:', error);
        }
    }

    async function connectGmail(button) {
        const token = getToken();

        if (!token) {
            if (window.Swal) {
                await Swal.fire({
                    icon: 'warning',
                    title: 'Giriş gerekli',
                    text: 'Gmail hesabını bağlamak için önce ChatChip hesabına giriş yap.'
                });
            } else {
                alert('Gmail hesabını bağlamak için önce giriş yap.');
            }
            return;
        }

        if (button.dataset.connected === 'true') return;

        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = 'Bağlanıyor...';

        try {
            const response = await fetch(`${API_BASE}/gmail/connect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            let data = {};
            try {
                data = await response.json();
            } catch (_) {
                // Backend JSON döndürmezse aşağıdaki genel hata kullanılır.
            }

            if (!response.ok) {
                throw new Error(data.error || `Gmail bağlantısı başlatılamadı (${response.status}).`);
            }

            // Backend mevcut aktif bağlantıyı tespit ettiyse tekrar OAuth açma.
            if (data.connected === true) {
                setGmailConnected(button, true);
                return;
            }

            if (!data.redirectUrl) {
                throw new Error('Gmail yetkilendirme adresi alınamadı.');
            }

            // OAuth aynı sekmede devam eder; popup engelleyicilerinden etkilenmez.
            window.location.assign(data.redirectUrl);
        } catch (error) {
            console.error('❌ Gmail bağlantı hatası:', error);

            if (window.Swal) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Gmail bağlanamadı',
                    text: error.message || 'Bağlantı başlatılırken bir hata oluştu.'
                });
            } else {
                alert(error.message || 'Gmail bağlantısı başlatılırken bir hata oluştu.');
            }

            button.disabled = false;
            button.textContent = originalText;
        }
    }

    function openAiEmployeeBuilder() {
        const token = getToken();

        if (!token) {
            if (window.Swal) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Giriş gerekli',
                    text: 'AI çalışanı oluşturmak için önce ChatChip hesabına giriş yap.'
                });
            }
            return;
        }

        // Builder ekranı bir sonraki adımda bu rotaya bağlanacak.
        // Şimdilik buton aktif ve kullanıcıya özelliğin giriş noktasını gösteriyor.
        if (window.Swal) {
            Swal.fire({
                icon: 'info',
                title: 'AI Çalışanı',
                text: 'AI çalışanını oluşturma ekranı hazırlanıyor.',
                confirmButtonText: 'Tamam'
            });
        }
    }

    // Capture aşamasında ana aksiyon tıklamalarını yakala.
    document.addEventListener('click', (event) => {
        const button = event.target.closest('.integration-connect');
        if (!button) return;

        const integration = (button.dataset.integration || '').toLowerCase();

        if (integration === 'gmail') {
            event.preventDefault();
            event.stopPropagation();
            connectGmail(button);
            return;
        }

        if (integration === 'aiemployee') {
            event.preventDefault();
            event.stopPropagation();
            openAiEmployeeBuilder();
        }
    }, true);

    function initializeHomeActions() {
        simplifyQuickActions();
        checkGmailStatus();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeHomeActions, { once: true });
    } else {
        initializeHomeActions();
    }
})();
