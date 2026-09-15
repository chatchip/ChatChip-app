// ============================================================
// 🔌 CHATCHIP ENTEGRASYONLARI
// Gmail OAuth bağlantısı Composio üzerinden backend tarafından başlatılır.
// ============================================================

(function initIntegrations() {
    const API_BASE = 'https://api.thechatchip.com/api';

    async function connectGmail(button) {
        const token = window.DataManager?.getToken?.() || localStorage.getItem('chatchip_token');

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

    document.addEventListener('click', (event) => {
        const button = event.target.closest('.integration-connect');
        if (!button) return;

        const integration = (button.dataset.integration || '').toLowerCase();

        if (integration === 'gmail') {
            event.preventDefault();
            connectGmail(button);
        }
    });
})();
