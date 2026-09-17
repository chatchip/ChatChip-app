// ============================================================
// 🎨 CHATChip IMAGE SERVICE
// Görsel üretim + düzenleme + image response çözümleme
// ============================================================

const ImageService = {
    API_BASE: 'https://chatchip-production.up.railway.app/api/image',

    resolveImageUrl(imageUrl) {
        if (!imageUrl) return '';
        if (typeof imageUrl === 'string') return imageUrl;
        if (typeof imageUrl === 'object' && imageUrl !== null) {
            const base64Data = imageUrl.data || '';
            const mediaType = imageUrl.media_type || 'image/jpeg';
            if (base64Data) return `data:${mediaType};base64,${base64Data}`;
            return imageUrl.url || imageUrl.image_url || imageUrl.output || '';
        }
        return '';
    },

    createImageHtml(imageSrc, altText = 'Görsel') {
        if (!imageSrc) return '';
        return `<img src="${imageSrc}" alt="${altText}" style="max-width:100%;max-height:400px;border-radius:12px;margin:6px 0;border:1px solid var(--border);object-fit:contain;" />`;
    },

    createDownloadButton(imageSrc) {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        const fileName = `gorsel_${timestamp}_${random}.jpg`;
        return `
            <a href="${imageSrc}" download="${fileName}" title="Görseli indir"
               style="display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;margin-top:4px;background:transparent;color:var(--text-light);border-radius:8px;text-decoration:none;transition:all .2s ease;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 3v12"></path><path d="m7 10 5 5 5-5"></path><path d="M5 21h14"></path>
                </svg>
            </a>`;
    },

    // Eski, sade Görseli Düzenle butonu.
    createEditButton(imageSrc) {
        return `
            <button type="button" class="chatchip-editable-image" data-image-src="${imageSrc}"
                title="Görseli düzenle" aria-label="Görseli düzenle"
                style="display:inline-flex;align-items:center;justify-content:center;gap:5px;height:32px;margin-top:4px;margin-left:4px;padding:0 8px;background:transparent;color:var(--text-light);border:0;border-radius:8px;font:inherit;font-size:.78rem;cursor:pointer;transition:all .2s ease;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
                </svg>
                <span>Düzenle</span>
            </button>`;
    },

    createPrivacyNote() {
        return `<span style="margin-left:8px;font-size:.72rem;color:var(--text-light);opacity:.6;white-space:nowrap;">Görseller oturum sonunda silinir.</span>`;
    },

    async generate(prompt, callbacks = {}) {
        const { addMessage, setLoading, updateMessage, getPlan } = callbacks;
        console.log(`🎨 Görsel üretiliyor: "${prompt}"`);
        const loadingMsgId = addMessage('', 'bot', true);
        if (setLoading) setLoading(loadingMsgId, 'Görsel üretiliyor...');

        try {
            const token = window.DataManager?.getToken?.();
            if (!token) {
                updateMessage(loadingMsgId, 'ℹ️ Görsel oluşturmak için önce giriş yapmalısın.');
                return;
            }
            const currentPlan = getPlan ? getPlan() : null;
            if (currentPlan && currentPlan.isExpired) {
                updateMessage(loadingMsgId, '⛔ Planınız sona erdi! Görsel üretimi için plan satın alın.');
                return;
            }

            const response = await fetch(`${this.API_BASE}/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ prompt })
            });
            const data = await response.json();

            if (!data.success || !data.imageUrl) {
                let message = '✦ Bu görsel isteğini şu anda oluşturamadım. İstersen farklı bir ifadeyle tekrar deneyebilirsin.';
                if (data.code === 'IMAGE_POLICY_BLOCK') message = '✦ Bu görsel isteği içerik kuralları nedeniyle oluşturulamadı. İsteğini değiştirerek tekrar deneyebilirsin.';
                updateMessage(loadingMsgId, message);
                return;
            }

            const imageSrc = this.resolveImageUrl(data.imageUrl);
            if (!imageSrc) {
                updateMessage(loadingMsgId, '✦ Görsel oluşturuldu ancak görüntü ekrana getirilemedi. Lütfen tekrar dene.');
                return;
            }

            const wrapper = document.getElementById(loadingMsgId);
            const bubble = wrapper?.querySelector('.bubble');
            if (bubble) {
                bubble.innerHTML = `<div class="markdown-body">${this.createImageHtml(imageSrc, 'Üretilen görsel')}<br>${this.createDownloadButton(imageSrc)}${this.createEditButton(imageSrc)}${this.createPrivacyNote()}<br><br>✨ Görsel başarıyla oluşturuldu!</div><span class="time">${new Date().toLocaleTimeString('tr-TR', { hour:'2-digit', minute:'2-digit' })}</span>`;
            }
        } catch (error) {
            console.error('❌ Görsel üretim hatası:', error);
            updateMessage(loadingMsgId, '✦ Görsel oluşturulurken bir sorun oluştu. Lütfen tekrar dene.');
        }
    },

    async edit(prompt, imageUrl, callbacks = {}) {
        const { addMessage, setLoading, updateMessage } = callbacks;
        console.log('🎨 Görsel düzenleme:', prompt);
        const loadingMsgId = addMessage('', 'bot', true);
        if (setLoading) setLoading(loadingMsgId, 'Görsel düzenleniyor...');

        try {
            const token = window.DataManager?.getToken?.();
            if (!token) {
                updateMessage(loadingMsgId, 'ℹ️ Görsel oluşturmak için önce giriş yapmalısın.');
                return;
            }
            if (!imageUrl) throw new Error('Görsel URL bulunamadı');

            const response = await fetch(`${this.API_BASE}/edit`, {
                method:'POST',
                headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` },
                body:JSON.stringify({ prompt, imageUrl })
            });
            const data = await response.json();
            if (!data.success || !data.imageUrl) {
                updateMessage(loadingMsgId, '✦ Görsel düzenleme isteğini şu anda tamamlayamadım. Lütfen tekrar dene.');
                return;
            }

            const imageSrc = this.resolveImageUrl(data.imageUrl);
            if (!imageSrc) throw new Error('Düzenlenen görsel alınamadı');
            const wrapper = document.getElementById(loadingMsgId);
            const bubble = wrapper?.querySelector('.bubble');
            if (bubble) {
                bubble.innerHTML = `<div class="markdown-body">${this.createImageHtml(imageSrc, 'Düzenlenen görsel')}<br>${this.createDownloadButton(imageSrc)}${this.createEditButton(imageSrc)}${this.createPrivacyNote()}<br><br>✨ Görsel başarıyla düzenlendi!</div><span class="time">${new Date().toLocaleTimeString('tr-TR', { hour:'2-digit', minute:'2-digit' })}</span>`;
            }
        } catch (error) {
            console.error('❌ Düzenleme hatası:', error);
            updateMessage(loadingMsgId, '✦ Görsel düzenlenirken bir sorun oluştu. Lütfen tekrar dene.');
        }
    }
};

window.ImageService = ImageService;
console.log('🎨 ImageService hazır');

// Görsel düzenleme panelindeki gönder okunu büyük ve belirgin yap.
(function addImageEditSendButtonStyle() {
    const style = document.createElement('style');
    style.textContent = `
        #imageEditSendBtn {
            width:52px !important;
            min-width:52px !important;
            height:52px !important;
            border-radius:14px !important;
            background:var(--primary) !important;
            color:#fff !important;
            font-size:27px !important;
            font-weight:700 !important;
            box-shadow:0 4px 12px rgba(0,0,0,.14) !important;
            transition:transform .15s ease, opacity .15s ease !important;
        }
        #imageEditSendBtn:hover { transform:scale(1.05); }
        #imageEditSendBtn:active { transform:scale(.96); }
        #imageEditSendBtn:disabled { opacity:.55; cursor:not-allowed !important; }
    `;
    document.head.appendChild(style);
})();

// Ana inputta aktif görsel varken normal chat'e düşmesini engelle.
// Input boşsa hiçbir event yakalanmaz; Puzzle akışı aynen devam eder.
(function initImageEditGuidance() {
    function interceptMainSend(event) {
        const input = document.getElementById('messageInput');
        const text = input?.value?.trim() || '';
        const imageUrl = localStorage.getItem('chatchip_current_image_url');
        if (!text || !imageUrl) return;

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        const message = '🖼️ Görseli düzenlemek için görselin altındaki “Düzenle” alanını ve gönder okunu kullanın.';
        if (typeof showToast === 'function') showToast(message, 'info');
        else if (typeof addMessage === 'function') addMessage(message, 'bot');
        else alert(message);
    }

    document.addEventListener('click', function(event) {
        if (event.target.closest('#sendBtn')) interceptMainSend(event);
    }, true);

    document.addEventListener('keydown', function(event) {
        if (event.key !== 'Enter' || event.shiftKey) return;
        if (event.target?.id !== 'messageInput') return;
        interceptMainSend(event);
    }, true);
})();