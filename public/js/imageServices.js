// ============================================================
// 🎨 CHATChip IMAGE SERVICE
// Görsel üretim + düzenleme + image response çözümleme
// ============================================================

const ImageService = {

    API_BASE: 'https://chatchip-production.up.railway.app/api/image',

    // ========================================================
    // 🔧 IMAGE URL / BASE64 ÇÖZÜMLEME
    // ========================================================
    resolveImageUrl(imageUrl) {

        if (!imageUrl) {
            return '';
        }

        // Normal URL veya data URL
        if (typeof imageUrl === 'string') {
            return imageUrl;
        }

        // API nesne döndürüyorsa
        if (typeof imageUrl === 'object' && imageUrl !== null) {

           console.log('📦 imageUrl nesnesi alındı');

            // Base64
            const base64Data = imageUrl.data || '';
            const mediaType = imageUrl.media_type || 'image/jpeg';

            if (base64Data) {
                console.log('✅ Base64 data URL oluşturuluyor');

                return `data:${mediaType};base64,${base64Data}`;
            }

            // Diğer olası formatlar
            const url =
                imageUrl.url ||
                imageUrl.image_url ||
                imageUrl.output ||
                '';

            if (url) {
                console.log('🔗 Görsel URL bulundu');
                return url;
            }
        }

        return '';
    },


    // ========================================================
    // 🖼️ GÖRSEL HTML OLUŞTUR
    // ========================================================
   createImageHtml(imageSrc, altText = 'Görsel') {

    if (!imageSrc) {
        return '';
    }

    return `
        <img 
            src="${imageSrc}" 
            alt="${altText}"
            class="chatchip-editable-image"
            data-image-src="${imageSrc}"
            style="
                max-width:100%;
                max-height:400px;
                border-radius:12px;
                margin:6px 0;
                border:1px solid var(--border);
                object-fit:contain;
                cursor:pointer;
            "
        />
    `;
},


    // ========================================================
    // ⬇️ İNDİRME BUTONU
    // ========================================================
    createDownloadButton(imageSrc) {

        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        const fileName = `gorsel_${timestamp}_${random}.jpg`;

        return `
            <a 
                href="${imageSrc}"
                download="${fileName}"
                title="Görseli indir"
                style="
                    display:inline-flex;
                    align-items:center;
                    justify-content:center;
                    width:32px;
                    height:32px;
                    margin-top:4px;
                    background:transparent;
                    color:var(--text-light);
                    border-radius:8px;
                    text-decoration:none;
                    transition:all 0.2s ease;
                "
                onmouseover="
                    this.style.background='rgba(0,0,0,0.06)';
                    this.style.color='var(--text)';
                "
                onmouseout="
                    this.style.background='transparent';
                    this.style.color='var(--text-light)';
                "
            >
                <svg 
                    width="18" 
                    height="18" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    stroke-width="2" 
                    stroke-linecap="round" 
                    stroke-linejoin="round"
                >
                    <path d="M12 3v12"></path>
                    <path d="m7 10 5 5 5-5"></path>
                    <path d="M5 21h14"></path>
                </svg>
            </a>
        `;
    },


    // ========================================================
    // 🔒 GÖRSEL GİZLİLİK NOTU
    // ========================================================
    createPrivacyNote() {

        return `
            <span style="
                margin-left:8px;
                font-size:0.72rem;
                color:var(--text-light);
                opacity:0.6;
                white-space:nowrap;
            ">
                Görseller oturum sonunda silinir.
            </span>
        `;
    },


    // ========================================================
    // 🎨 GÖRSEL ÜRET
    // ========================================================
    async generate(prompt, callbacks = {}) {

        const {
            addMessage,
            setLoading,
            updateMessage,
            getPlan
        } = callbacks;

        console.log(`🎨 Görsel üretiliyor: "${prompt}"`);

        const loadingMsgId = addMessage('', 'bot', true);

        if (setLoading) {
            setLoading(loadingMsgId, 'Görsel üretiliyor...');
        }

        try {

            const dm = window.DataManager;
            const token = dm?.getToken();

            if (!token) {
    updateMessage(
        loadingMsgId,
        'ℹ️ Görsel oluşturmak için önce giriş yapmalısın.'
    );
    return;
}

            const currentPlan = getPlan ? getPlan() : null;

            if (currentPlan && currentPlan.isExpired) {
                updateMessage(
                    loadingMsgId,
                    '⛔ Planınız sona erdi! Görsel üretimi için plan satın alın.'
                );
                return;
            }

            const response = await fetch(
                `${this.API_BASE}/generate`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        prompt: prompt
                    })
                }
            );

            const data = await response.json();

            console.log('📥 Görsel yanıtı alındı');

            if (!data.success || !data.imageUrl) {

    let message =
        '✦ Bu görsel isteğini şu anda oluşturamadım. İstersen farklı bir ifadeyle tekrar deneyebilirsin.';

    if (data.code === 'IMAGE_POLICY_BLOCK') {
        message =
            '✦ Bu görsel isteği içerik kuralları nedeniyle oluşturulamadı. İsteğini değiştirerek tekrar deneyebilirsin.';
    }

    updateMessage(
        loadingMsgId,
        message
    );

    return;
}

            // 🔥 KRİTİK NOKTA
            // String ise URL
            // Object ise base64 / URL çözümle
            const imageSrc = this.resolveImageUrl(
                data.imageUrl
            );

            if (!imageSrc) {

               console.error('❌ Görsel adresi alınamadı');

                updateMessage(
    loadingMsgId,
    '✦ Görsel oluşturuldu ancak görüntü ekrana getirilemedi. Lütfen tekrar dene.'
);

                return;
            }

            const imageHtml =
                this.createImageHtml(
                    imageSrc,
                    'Üretilen görsel'
                );

            const downloadBtn =
                this.createDownloadButton(imageSrc);

            const privacyNote =
                this.createPrivacyNote();

            const wrapper =
                document.getElementById(loadingMsgId);

            const bubble =
                wrapper?.querySelector('.bubble');

            if (bubble) {

                bubble.innerHTML = `
                    <div class="markdown-body">

                        ${imageHtml}

                        <br>

                        ${downloadBtn}
                        ${privacyNote}

                        <br><br>

                        ✨ Görsel başarıyla oluşturuldu!

                    </div>

                    <span class="time">
                        ${new Date().toLocaleTimeString(
                            'tr-TR',
                            {
                                hour: '2-digit',
                                minute: '2-digit'
                            }
                        )}
                    </span>
                `;
            }

        } catch (error) {

            console.error(
                '❌ Görsel üretim hatası:',
                error
            );

            updateMessage(
    loadingMsgId,
    '✦ Görsel oluşturulurken bir sorun oluştu. Lütfen tekrar dene.'
);
        }
    },


    // ========================================================
    // 🖌️ GÖRSEL DÜZENLE
    // ========================================================
    async edit(prompt, imageUrl, callbacks = {}) {

        const {
            addMessage,
            setLoading,
            updateMessage,
        } = callbacks;

        console.log(
            '🎨 Görsel düzenleme:',
            prompt
        );

        const loadingMsgId =
            addMessage('', 'bot', true);

        if (setLoading) {
            setLoading(
                loadingMsgId,
                'Görsel düzenleniyor...'
            );
        }

        try {

            const dm = window.DataManager;
            const token = dm?.getToken();

            if (!token) {
    updateMessage(
        loadingMsgId,
        'ℹ️ Görsel oluşturmak için önce giriş yapmalısın.'
    );
                return;
            }

            if (!imageUrl) {
                throw new Error(
                    'Görsel URL bulunamadı'
                );
            }

           console.log('📸 Düzenlenecek görsel alındı');

            const response = await fetch(
                `${this.API_BASE}/edit`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        prompt: prompt,
                        imageUrl: imageUrl
                    })
                }
            );

            const data = await response.json();

            console.log('📥 Düzenleme yanıtı alındı');

            if (!data.success || !data.imageUrl) {

               updateMessage(
    loadingMsgId,
    '✦ Görsel düzenleme isteğini şu anda tamamlayamadım. Lütfen tekrar dene.'
);
                return;
            }

            // 🔥🔥🔥
            // GENERATE İLE AYNI ÇÖZÜMLEME
            // Base64 burada da data:image/... oluyor
            const imageSrc =
                this.resolveImageUrl(
                    data.imageUrl
                );

            if (!imageSrc) {
                throw new Error(
                    'Düzenlenen görsel alınamadı'
                );
            }

            const imageHtml =
                this.createImageHtml(
                    imageSrc,
                    'Düzenlenen görsel'
                );

            const downloadBtn =
                this.createDownloadButton(
                    imageSrc
                );

            const privacyNote =
                this.createPrivacyNote();

            const wrapper =
                document.getElementById(
                    loadingMsgId
                );

            const bubble =
                wrapper?.querySelector('.bubble');

            if (bubble) {

                bubble.innerHTML = `
                    <div class="markdown-body">

                        ${imageHtml}

                        <br>

                        ${downloadBtn}
                        ${privacyNote}

                        <br><br>

                        ✨ Görsel başarıyla düzenlendi!

                    </div>

                    <span class="time">
                        ${new Date().toLocaleTimeString(
                            'tr-TR',
                            {
                                hour: '2-digit',
                                minute: '2-digit'
                            }
                        )}
                    </span>
                `;
            }

        } catch (error) {

            console.error(
                '❌ Düzenleme hatası:',
                error
            );

            updateMessage(
    loadingMsgId,
    '✦ Görsel düzenlenirken bir sorun oluştu. Lütfen tekrar dene.'
);

        }
    }
};


// ============================================================
// 🌐 GLOBAL
// ============================================================

window.ImageService = ImageService;

console.log('🎨 ImageService hazır');
