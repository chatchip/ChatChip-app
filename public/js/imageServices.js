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
            if (!token) { updateMessage(loadingMsgId, 'ℹ️ Görsel oluşturmak için önce giriş yapmalısın.'); return; }
            const currentPlan = getPlan ? getPlan() : null;
            if (currentPlan && currentPlan.isExpired) { updateMessage(loadingMsgId, '⛔ Planınız sona erdi! Görsel üretimi için plan satın alın.'); return; }
            const response = await fetch(`${this.API_BASE}/generate`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ prompt })
            });
            const data = await response.json();
            if (!data.success || !data.imageUrl) {
                let message = '✦ Bu görsel isteğini şu anda oluşturamadım. İstersen farklı bir ifadeyle tekrar deneyebilirsin.';
                if (data.code === 'IMAGE_POLICY_BLOCK') message = '✦ Bu görsel isteği içerik kuralları nedeniyle oluşturulamadı. İsteğini değiştirerek tekrar deneyebilirsin.';
                updateMessage(loadingMsgId, message); return;
            }
            const imageSrc = this.resolveImageUrl(data.imageUrl);
            if (!imageSrc) { updateMessage(loadingMsgId, '✦ Görsel oluşturuldu ancak görüntü ekrana getirilemedi. Lütfen tekrar dene.'); return; }
            const wrapper = document.getElementById(loadingMsgId);
            const bubble = wrapper?.querySelector('.bubble');
            if (bubble) bubble.innerHTML = `<div class="markdown-body">${this.createImageHtml(imageSrc, 'Üretilen görsel')}<br>${this.createDownloadButton(imageSrc)}${this.createEditButton(imageSrc)}${this.createPrivacyNote()}<br><br>✨ Görsel başarıyla oluşturuldu!</div><span class="time">${new Date().toLocaleTimeString('tr-TR', { hour:'2-digit', minute:'2-digit' })}</span>`;
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
            if (!token) { updateMessage(loadingMsgId, 'ℹ️ Görsel oluşturmak için önce giriş yapmalısın.'); return; }
            if (!imageUrl) throw new Error('Görsel URL bulunamadı');
            const response = await fetch(`${this.API_BASE}/edit`, {
                method:'POST', headers:{ 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` }, body:JSON.stringify({ prompt, imageUrl })
            });
            const data = await response.json();
            if (!data.success || !data.imageUrl) { updateMessage(loadingMsgId, '✦ Görsel düzenleme isteğini şu anda tamamlayamadım. Lütfen tekrar dene.'); return; }
            const imageSrc = this.resolveImageUrl(data.imageUrl);
            if (!imageSrc) throw new Error('Düzenlenen görsel alınamadı');
            const wrapper = document.getElementById(loadingMsgId);
            const bubble = wrapper?.querySelector('.bubble');
            if (bubble) bubble.innerHTML = `<div class="markdown-body">${this.createImageHtml(imageSrc, 'Düzenlenen görsel')}<br>${this.createDownloadButton(imageSrc)}${this.createEditButton(imageSrc)}${this.createPrivacyNote()}<br><br>✨ Görsel başarıyla düzenlendi!</div><span class="time">${new Date().toLocaleTimeString('tr-TR', { hour:'2-digit', minute:'2-digit' })}</span>`;
        } catch (error) {
            console.error('❌ Düzenleme hatası:', error);
            updateMessage(loadingMsgId, '✦ Görsel düzenlenirken bir sorun oluştu. Lütfen tekrar dene.');
        }
    }
};

window.ImageService = ImageService;
console.log('🎨 ImageService hazır');

// ============================================================
// 🖼️ TAM EKRAN GÖRSEL DÜZENLEYİCİ
// ============================================================
(function initFullscreenImageEditor() {
    function closeEditor() {
        const overlay = document.getElementById('imageEditOverlay');
        if (overlay) overlay.remove();
        document.body.style.overflow = '';
    }

    function openEditor(imageSrc) {
        closeEditor();
        localStorage.setItem('chatchip_current_image_url', imageSrc);

        const overlay = document.createElement('div');
        overlay.id = 'imageEditOverlay';
        overlay.innerHTML = `
            <div class="cc-image-edit-header">
                <button type="button" id="imageEditCloseBtn" aria-label="Geri">←</button>
                <strong>Görseli Düzenle</strong>
                <span></span>
            </div>
            <div class="cc-image-edit-stage">
                <img src="${imageSrc}" alt="Düzenlenecek görsel">
            </div>
            <div class="cc-image-edit-composer">
                <div class="cc-image-edit-input-wrap">
                    <textarea id="imageEditPrompt" rows="1" placeholder="Görselde neyi değiştirmek istiyorsun?"></textarea>
                    <button type="button" id="imageEditSendBtn" aria-label="Gönder">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M7 14.5 C8.7 13 10.3 11.6 12 10.2 C13.7 11.6 15.3 13 17 14.5"></path>
                            <path d="M7 9.5 C8.7 8 10.3 6.6 12 5.2 C13.7 6.6 15.3 8 17 9.5"></path>
                        </svg>
                    </button>
                </div>
            </div>`;
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';

        const promptInput = overlay.querySelector('#imageEditPrompt');
        const submitBtn = overlay.querySelector('#imageEditSendBtn');
        overlay.querySelector('#imageEditCloseBtn').addEventListener('click', closeEditor);

        async function submitEdit() {
            const prompt = promptInput.value.trim();
            if (!prompt || submitBtn.disabled) return;
            submitBtn.disabled = true;
            promptInput.disabled = true;

            if (typeof addMessage === 'function') addMessage(prompt, 'user');
            closeEditor();

            await ImageService.edit(prompt, imageSrc, {
                addMessage: typeof addMessage === 'function' ? addMessage : undefined,
                setLoading: typeof setImageLoadingAnimation === 'function' ? setImageLoadingAnimation : undefined,
                updateMessage: typeof updateMessageMarkdown === 'function' ? updateMessageMarkdown : undefined
            });
        }

        submitBtn.addEventListener('click', submitEdit);
        promptInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submitEdit();
            }
        });
        promptInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        });

        setTimeout(() => promptInput.focus(), 80);
    }

    document.addEventListener('click', function(event) {
        const editButton = event.target.closest('.chatchip-editable-image');
        if (!editButton) return;
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        openEditor(editButton.dataset.imageSrc);
    }, true);

    const style = document.createElement('style');
    style.textContent = `
        #imageEditOverlay{position:fixed;inset:0;z-index:100000;background:var(--bg-secondary,#fff);display:flex;flex-direction:column;height:100dvh;overflow:hidden;color:var(--text-primary,var(--text,#2D4A44));}
        .cc-image-edit-header{height:64px;min-height:64px;display:grid;grid-template-columns:48px 1fr 48px;align-items:center;padding:0 14px;border-bottom:1px solid var(--border-color,var(--border,#D4F0EA));background:var(--bg-secondary,#fff);}
        .cc-image-edit-header strong{text-align:center;font-size:16px;font-weight:650;}
        #imageEditCloseBtn{width:42px;height:42px;border:0;border-radius:50%;background:transparent;color:inherit;font-size:28px;cursor:pointer;}
        .cc-image-edit-stage{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;padding:16px 18px;background:var(--bg-primary,#F2FCF9);overflow:hidden;}
        .cc-image-edit-stage img{display:block;max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;border-radius:16px;}
        .cc-image-edit-composer{flex:0 0 auto;padding:10px 14px calc(10px + env(safe-area-inset-bottom));background:var(--bg-secondary,#fff);border-top:1px solid var(--border-color,var(--border,#D4F0EA));}
        .cc-image-edit-input-wrap{width:100%;min-height:72px;border:1px solid var(--border-color,var(--input-border,#D4F0EA));border-radius:36px;background:var(--bg-secondary,#fff);display:flex;align-items:flex-end;gap:8px;padding:12px 12px 10px 20px;box-sizing:border-box;box-shadow:0 4px 16px rgba(0,0,0,.08),0 1px 3px rgba(0,0,0,.05);}
        #imageEditPrompt{flex:1;min-width:0;min-height:42px;max-height:120px;resize:none;border:0;outline:0;background:transparent;color:var(--text-primary,var(--text,#2D4A44));font:inherit;font-size:.96rem;line-height:1.55;padding:9px 0;box-sizing:border-box;overflow-y:auto;}
        #imageEditPrompt::placeholder{color:var(--text-secondary,#6B8A82);}
        #imageEditSendBtn{width:38px;min-width:38px;height:38px;min-height:38px;border:0;border-radius:50%;background:var(--primary,#7BD3C9);color:#fff;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;padding:0;flex-shrink:0;transition:all .2s ease;touch-action:manipulation;}
        #imageEditSendBtn:hover{background:var(--primary-dark,#5FB8A0);transform:scale(1.05);}
        #imageEditSendBtn:active{transform:scale(.96);}
        #imageEditSendBtn:disabled{opacity:.4;cursor:not-allowed;transform:none;}
        #imageEditSendBtn svg{width:20px;height:20px;stroke:#fff;fill:none;}
        @media (min-width:700px){.cc-image-edit-stage{padding:24px 12vw}.cc-image-edit-composer{padding-left:max(14px,15vw);padding-right:max(14px,15vw)}}
    `;
    document.head.appendChild(style);
})();

// Tam ekran düzenleyici açıkken ana input normal chat'e gönderemez.
(function initImageEditGuidance() {
    function interceptMainSend(event) {
        const editorOpen = document.getElementById('imageEditOverlay');
        if (!editorOpen) return;
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
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

// Yüklenen görselin aktif state'i ana input gönderilmeden önce korunur.
// app.js, görsel + düzenleme komutu olduğunda /api/image/edit akışına yönlendirir.
// State normal sohbet tamamlandığında app.js tarafından temizlenir.