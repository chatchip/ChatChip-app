// ============================================================
// 🔌 CHATCHIP ENTEGRASYONLARI
// Gmail OAuth bağlantısı Composio üzerinden backend tarafından başlatılır.
// ============================================================

(function initIntegrations() {
    const API_BASE = 'https://api.thechatchip.com/api';

    function getToken() {
        return window.DataManager?.getToken?.() || localStorage.getItem('chatchip_token');
    }

    function getGmailButton() {
        return document.querySelector('.integration-connect[data-integration="Gmail"]');
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

    // Capture aşamasında Gmail tıklamasını yakala. Böylece index.html'deki
    // eski genel "Çok yakında" click handler'ı Gmail için hiç çalışmaz.
    document.addEventListener('click', (event) => {
        const button = event.target.closest('.integration-connect');
        if (!button) return;

        const integration = (button.dataset.integration || '').toLowerCase();

        if (integration === 'gmail') {
            event.preventDefault();
            event.stopPropagation();
            connectGmail(button);
        }
    }, true);

    // Sayfa açıldığında mevcut Composio Gmail bağlantısını kontrol et.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkGmailStatus, { once: true });
    } else {
        checkGmailStatus();
    }
})();
