// APP - SOHBET YÖNETİMİ (Model + Koç)

const chatArea = document.getElementById('chatArea');
const messagesDiv = document.getElementById('messages');
const input = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const stopBtn = document.getElementById('stopBtn');

let isProcessing = false;
let currentUser = null;
let currentPlan = null;
let currentSessionId = null;
let sessions = [];
let isFirstMessage = true;
let abortController = null;
let currentCryptoKey = null;  // 🔐 Güvenli şifreleme anahtarı (CryptoKey)

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 App başlatıldı (Model + Koç)');

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            console.log('👁️ Uygulama tekrar görünür oldu');
            updateAppViewportHeight();
            setTimeout(() => {
                updateAppViewportHeight();
            }, 300);
        }
    });

    await checkAuth();
    checkPlan();
    loadModels();
    loadSessions();
    setupEventListeners();
    loadSystemPrompt();
    initDarkMode();
    setTimeout(addDarkModeToggle, 200);
    setTimeout(updateThemeIcon, 300);
    startPlanWatcher();
});

// ============================================================
// CHAT MESAJ
// ============================================================
function setupEventListeners() {
    sendBtn.addEventListener('click', sendMessage);
    stopBtn.addEventListener('click', stopMessage);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = input.scrollHeight + 'px';
    });

    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

// ============================================================
// 🔥 STOP MESSAGE
// ============================================================
function stopMessage() {
    if (!isProcessing) return;
    console.log('⏹️ Yanıt durduruluyor...');
    if (abortController) {
        abortController.abort();
        abortController = null;
    }
    sendBtn.style.display = 'flex';
    stopBtn.style.display = 'none';
    input.disabled = false;
    isProcessing = false;
    showToast('⏹️ Yanıt durduruldu', 'info');
}
// ============================================================
// 🎨 GÖRSEL ÜRETİM FONKSİYONU
// ImageService → API / Base64 / HTML / Download
// app.js → sadece UI callback'lerini sağlar
// ============================================================
async function generateAndShowImage(prompt, originalText) {

    return ImageService.generate(prompt, {

        addMessage: addMessage,

        setLoading: setImageLoadingAnimation,

        updateMessage: updateMessageMarkdown,

        showToast: showToast,

        getPlan: () => currentPlan

    });
}
async function sendMessage() {
    const text = input.value.trim();
    console.log('🔴 sendMessage çalıştı! text:', text);

    const activeImageUrl = window.ChatChipImageState?.getCurrent?.() || null;
    console.log('📸 Aktif görsel:', activeImageUrl ? 'var' : 'yok');

    if (!text && !activeImageUrl) return;
    if (isProcessing) return;

    // 🔥 GÖRSEL DÜZENLEME KONTROLÜ
    if (activeImageUrl && text) {
        const editKeywords = [
            'değiştir',
            'düzenle',
            'çevir',
            'ekle',
            'kaldır',
            'renk',
            'style',
            'tarz',
            'anime',
            'karikatür',
            'çizim',
            'filtre',
            'boya',
            'değiş'
        ];

        const isEditCommand = editKeywords.some(k =>
            text.toLowerCase().includes(k)
        );

        if (isEditCommand) {
            console.log('🎨 Görsel düzenleme isteği:', text);

        const token = localStorage.getItem('chatchip_token');
        if (!token) {
            showToast('❌ Lütfen önce giriş yapın!', 'error');
            return;
        }

        addMessage(text, 'user');
        input.value = '';
        input.style.height = 'auto';
        removeImagePreviewUI();

const editImageUrl =
    window.ChatChipImageState?.consumeCurrent?.() || activeImageUrl;

await ImageService.edit(
    text,
    editImageUrl,
    {
        addMessage: addMessage,
        setLoading: setImageLoadingAnimation,
        updateMessage: updateMessageMarkdown,
        showToast: showToast
    }
);

        clearCurrentImage();
        chatArea.scrollTop = chatArea.scrollHeight;
        return;
    }
}
    // Aktif görsel düzenleme komutu değilse state'i normal chat'e taşımayız.
    if (activeImageUrl) {
        window.ChatChipImageState?.clear?.();
    }

   // ============================================================
// 🔥 GÖRSEL ÜRETİM KONTROLÜ - NET KOMUT
// ============================================================
const imagePatterns = [
    /resim\s*(yap|oluştur|üret|çiz|göster|iste|ver)/i,
    /fotoğraf\s*(yap|oluştur|üret|çek|göster|iste|ver)/i,
    /görsel\s*(yap|oluştur|üret|çiz|göster|iste|ver)/i,
    /çiz\s*(yap|oluştur|üret|göster|iste|ver)/i,
    /göster\s*(resim|fotoğraf|görsel|çizim)/i,
    /make\s*(image|photo|picture)/i,
    /create\s*(image|photo|picture)/i,
    /generate\s*(image|photo|picture)/i,
    /draw\s*(a|an|)/i,
    /kedi\s*(resmi|görseli|fotoğrafı|çizimi)/i,
    /köpek\s*(resmi|görseli|fotoğrafı|çizimi)/i,
    /manzara\s*(resmi|görseli|fotoğrafı|çizimi)/i,
    /portre\s*(yap|çiz|oluştur|göster|iste|ver)/i,
    /karikatür\s*(yap|çiz|oluştur|göster|iste|ver)/i,
    /bana\s*(bir|)\s*(resim|fotoğraf|görsel|çizim)\s*(yap|oluştur|üret|çiz|göster|iste|ver)/i,
    /[a-zA-ZğüşıöçĞÜŞİÖÇ]+\s*(resmi|görseli|fotoğrafı|çizimi)/i,
    /(yapar\s*mısın|yapabilir\s*misin|çizebilir\s*misin|gösterebilir\s*misin)/i
];

const lower = text.toLowerCase();

// 🔥 SADECE BİLGİ SORULARINI ENGELLE (yapar mısın? tarzı sorulara izin ver!)
const isInfoQuestion = lower.includes('nasıl') || 
                       lower.includes('nedir') || 
                       lower.includes('ne yapmalıyım') || 
                       lower.includes('ne yapmam lazım') ||
                       lower.includes('önerir misin') ||
                       lower.includes('tavsiye') ||
                       lower.includes('yardım');

const isImageCommand = imagePatterns.some(pattern => pattern.test(text));
    console.log('🖼️ IMAGE DEBUG:', {
    text,
    isImageCommand,
    isInfoQuestion
});

if (isImageCommand && !isInfoQuestion) {
    let cleanPrompt = text
        .replace(/resim|fotoğraf|göster|yap|oluştur|üret|çiz|çek|make|create|generate|draw|portre|karikatür|lütfen|rica|bana|bir|tane|mısın|misin|yapar|yapabilir|çizebilir|gösterebilir/gi, '')
        .trim();
    
    if (!cleanPrompt || cleanPrompt.length < 2) {
        cleanPrompt = text;
    }

input.value = '';
input.style.height = 'auto';
removeImagePreviewUI();
   
    addMessage(text, 'user');
    await generateAndShowImage(cleanPrompt, text);
    chatArea.scrollTop = chatArea.scrollHeight;
    return;
}

    // ============================================================
    // 🔥 NORMAL CHAT (Görsel değilse buraya gelir)
    // ============================================================
    if (!currentUser) {
        showToast('⚠️ Lütfen önce giriş yapın!', 'error');
        return;
    }

    if (currentPlan && currentPlan.isExpired) {
        showToast('⛔ Planınız sona erdi! Sohbet botu devre dışı.', 'error');
        return;
    }

    const modelSelector = document.getElementById('modelSelector');
    const selectedModel = modelSelector ? modelSelector.value : '1.0';
    localStorage.setItem('chatchip_selected_model', selectedModel);

    const coachSelector = document.getElementById('coachSelector');
    const selectedCoach = coachSelector ? coachSelector.value : 'standard';

    console.log(`🎯 Model: ${selectedModel}, Koç: ${selectedCoach}`);

    if (!currentSessionId) {
        const dm = window.DataManager;
        const title = text.length > 30 ? text.substring(0, 30) + '...' : text;
        const result = await dm.createSession(title);
        if (result.success) {
            currentSessionId = result.session.id;
            isFirstMessage = false;
            sessions.unshift(result.session);
            renderSessions();
            document.querySelector('.page-title').textContent = '💬 ' + result.session.title;
        } else {
            showToast('❌ Sohbet oluşturulamadı', 'error');
            return;
        }
    }

    if (isFirstMessage) {
        const session = sessions.find(s => s.id === currentSessionId);
        if (session && (session.title === 'Yeni Sohbet' || !session.title)) {
            const newTitle = text.length > 30 ? text.substring(0, 30) + '...' : text;
            try {
                const dm = window.DataManager;
                const result = await dm.updateSession(currentSessionId, newTitle);
                if (result.success) {
                    session.title = result.session.title;
                    renderSessions();
                    document.querySelector('.page-title').textContent = '💬 ' + result.session.title;
                }
            } catch (error) {
                console.error('Başlık güncelleme hatası:', error);
            }
        }
        isFirstMessage = false;
    }

    isProcessing = true;
    sendBtn.style.display = 'none';
    stopBtn.style.display = 'flex';
    input.disabled = true;
    abortController = new AbortController();

    let fullMessage = text || '';

    const userMsgId = addMessage(fullMessage, 'user');
    input.value = '';
    input.style.height = 'auto';
    removeImagePreviewUI();

    const botMsgId = addMessage('', 'bot', true);
    const systemPrompt = localStorage.getItem('chatchip_system_prompt') || '';

    try {
    const dm = window.DataManager;
        if (!currentCryptoKey) {
    const savedJwk = localStorage.getItem('chatchip_crypto_key_jwk');

    if (savedJwk) {
        try {
            currentCryptoKey = await window.crypto.subtle.importKey(
                "jwk",
                JSON.parse(savedJwk),
                { name: "AES-GCM", length: 256 },
                true,
                ["encrypt", "decrypt"]
            );
            console.log('✅ CryptoKey tekrar yüklendi');
        } catch (e) {
            console.error('❌ CryptoKey yüklenemedi:', e);
        }
    }
}


// 🔐 1. Kullanıcı mesajını şifrele ve kaydet (CryptoKey ile)
if (currentCryptoKey) {
    try {
        const encrypted = await ChatChipCrypto.encryptWithKey(fullMessage, currentCryptoKey);
        await dm.saveEncryptedMessage(encrypted.data, encrypted.iv, currentSessionId);
        console.log('✅ Kullanıcı mesajı şifreli olarak kaydedildi (CryptoKey)');
    } catch (encryptError) {
        console.error('❌ Şifreleme hatası:', encryptError);
        showToast('⚠️ Mesaj şifrelenirken hata oluştu', 'warning');
    }
} else {
    console.warn('⚠️ CryptoKey bulunamadı, mesaj şifrelenmeden gönderiliyor');
    showToast('⚠️ Güvenlik anahtarı bulunamadı, lütfen tekrar giriş yapın', 'error');
    sendBtn.style.display = 'flex';
    stopBtn.style.display = 'none';
    input.disabled = false;
    isProcessing = false;
    return;
}
        // 🔥 Mevcut session'daki mesajları topla (son 15 mesaj)
const MAX_HISTORY = 15;
const historyMessages = [];
const messageElements = document.querySelectorAll('#messages .message');
const startIndex = Math.max(0, messageElements.length - MAX_HISTORY);

for (let i = startIndex; i < messageElements.length; i++) {
    const el = messageElements[i];
    const role = el.classList.contains('user') ? 'user' : 'assistant';
    const content = el.querySelector('.bubble .markdown-body')?.textContent || 
                    el.querySelector('.bubble')?.textContent || '';
    if (content && content.trim()) {
        historyMessages.push({ role, content: content.trim() });
    }
}

console.log('📜 Geçmiş mesajlar:', historyMessages.length);

    // 🔥 2. AI'ya şifresiz mesaj gönder
    const response = await dm.sendMessage(fullMessage, selectedCoach, systemPrompt, currentSessionId, abortController.signal, historyMessages);

    if (!response.ok) {
        const errorData = await response.json();
        if (errorData.code === 'PLAN_REQUIRED') {
            showToast('⚠️ ' + errorData.error, 'error');
            updateMessageMarkdown(botMsgId, '⚠️ ' + errorData.error + '\n\n[Plan satın almak için tıklayın](/pricing.html)');
            sendBtn.style.display = 'flex';
            stopBtn.style.display = 'none';
            input.disabled = false;
            isProcessing = false;
            return;
        }
        throw new Error('Sunucu hatası: ' + response.status);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;
                try {
                    const json = JSON.parse(data);
                    if (json.chunk) {
                        fullText += json.chunk;
                        updateMessageMarkdown(botMsgId, fullText);
                    }
                    if (json.sessionId) {
                        currentSessionId = json.sessionId;
                        setTimeout(loadSessions, 1000);
                    }
                } catch (e) {}
            }
        }
    }
            // 🤖 AI yanıtı tamamlandı → aksiyon butonlarını göster
    const botMessage = document.getElementById(botMsgId);
    const actions = botMessage?.querySelector('.message-actions');

    if (actions) {
        actions.style.display = 'flex';
    }

   // 🔐 3. AI yanıtını şifrele ve kaydet (CryptoKey ile)
if (fullText && currentCryptoKey) {
    try {
        const encryptedResponse = await ChatChipCrypto.encryptWithKey(fullText, currentCryptoKey);
        await dm.saveEncryptedMessage(encryptedResponse.data, encryptedResponse.iv, currentSessionId, true);
        console.log('✅ AI yanıtı şifreli olarak kaydedildi (CryptoKey)');
    } catch (encryptError) {
        console.error('❌ AI yanıtı şifreleme hatası:', encryptError);
    }
}

        if (!fullText) {
        updateMessageMarkdown(botMsgId, '⚠️ Yanıt alınamadı.');
    }
} catch (error) {
    if (error.name === 'AbortError') {
        updateMessageMarkdown(botMsgId, '⏹️ Yanıt durduruldu.');
        showToast('⏹️ Yanıt durduruldu', 'info');
    } else {
        console.error('❌ Chat error:', error);
        updateMessageMarkdown(botMsgId, '❌ Hata: ' + error.message);
        showToast('❌ Bir hata oluştu: ' + error.message, 'error');
    }
}

    sendBtn.style.display = 'flex';
    stopBtn.style.display = 'none';
    input.disabled = false;
    isProcessing = false;
    abortController = null;
    clearCurrentImage();
    chatArea.scrollTop = chatArea.scrollHeight;
}

// ============================================================
// GLOBAL
// ============================================================

console.log('✅ App yüklendi! (Model + Koç)');

// ============================================================
// 📝 SİSTEM PROMPTU PANELİ
// ============================================================


// ============================================================
// 📱 PWA - SAYFAYA GERİ DÖNÜŞTE VIEWPORT YÜKSEKLİĞİNİ DÜZELT
// ============================================================

function updateAppViewportHeight() {
    const height = window.visualViewport?.height || window.innerHeight;

    document.documentElement.style.setProperty(
        '--app-height',
        `${height}px`
    );
}

updateAppViewportHeight();

window.addEventListener('pageshow', () => {
    requestAnimationFrame(() => {
        updateAppViewportHeight();

        setTimeout(() => {
    updateAppViewportHeight();
}, 150);

    });
});
if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', updateAppViewportHeight);
}
// ============================================================
// 🚀 GÖNDER BUTONU + MESAJ - YUKARI KAYDIRMA HAREKETİ
// ============================================================

const swipeSendBtn = document.getElementById('sendBtn');
const swipeMessageInput = document.getElementById('messageInput');

if (swipeSendBtn && swipeMessageInput) {

    let startY = 0;
let currentY = 0;
let isDraggingSend = false;
let floatingMessage = null;
let sendThreshold = 0;

    function removeFloatingMessage() {
        if (floatingMessage) {
            floatingMessage.remove();
            floatingMessage = null;
        }
    }

    swipeSendBtn.addEventListener('pointerdown', (e) => {

        startY = e.clientY;
        const inputWrapper = swipeSendBtn.closest('.input-wrapper');
const buttonRect = swipeSendBtn.getBoundingClientRect();
const wrapperRect = inputWrapper.getBoundingClientRect();

// Butonun üst kenarının inputun üst çizgisine ulaşacağı mesafe
sendThreshold = Math.max(
    1,
    buttonRect.top - wrapperRect.top
);
        currentY = 0;
        isDraggingSend = true;

        swipeSendBtn.setPointerCapture(e.pointerId);
        swipeSendBtn.style.transition = 'none';

        const text = swipeMessageInput.value.trim();

        // Input boşsa uçan yazı oluşturma
        if (!text) return;

        const inputRect = swipeMessageInput.getBoundingClientRect();

        floatingMessage = document.createElement('div');
        floatingMessage.textContent = text;

        Object.assign(floatingMessage.style, {
            position: 'fixed',

            left: `${inputRect.left}px`,
            top: `${inputRect.top}px`,

            maxWidth: `${inputRect.width}px`,

            padding: '8px 12px',

            borderRadius: '18px',

            background: 'var(--primary)',
            color: '#fff',

            fontSize: '14px',
            lineHeight: '1.4',

            zIndex: '9999',

            pointerEvents: 'none',

            opacity: '0',

            transform: 'translateY(0px) scale(0.96)',

            boxShadow: '0 4px 16px rgba(0,0,0,0.12)'
        });

        document.body.appendChild(floatingMessage);
    });

    swipeSendBtn.addEventListener('pointermove', (e) => {

        if (!isDraggingSend) return;

        const distance = e.clientY - startY;

        // Sadece yukarı
        currentY = Math.min(0, distance);

       // Input ne kadar yüksekse swipe alanı da o kadar büyür
    currentY = Math.max(
    currentY,
    -(sendThreshold + 30)
    );

        // Buton parmağı takip ediyor
        const isReadyToSend =
    Math.abs(currentY) >= sendThreshold;

    const visualOffset = currentY < -6 ? -26 : 0;
    swipeSendBtn.style.transform =
    `translateY(${currentY + visualOffset}px) scale(${isReadyToSend ? 1.08 : 1})`;
        if (floatingMessage) {

            const progress =
    Math.min(
        Math.abs(currentY) / Math.max(sendThreshold, 1),
        1
    );

            floatingMessage.style.opacity =
                String(progress);

            floatingMessage.style.transform =
                `translateY(${currentY}px) scale(${0.96 + progress * 0.04})`;

            // Gerçek textarea yazısı yavaşça kayboluyor
            swipeMessageInput.style.opacity =
                String(1 - progress);
        }
    });

    function resetSwipeSend() {

        isDraggingSend = false;

        swipeSendBtn.style.transition =
            'transform 0.25s cubic-bezier(.2,.8,.2,1)';

        swipeSendBtn.style.transform = 'translateY(0) scale(1)';

        swipeMessageInput.style.transition =
            'opacity 0.2s ease';

        swipeMessageInput.style.opacity = '1';

        if (floatingMessage) {

            floatingMessage.style.transition =
                'transform 0.25s ease, opacity 0.2s ease';

            floatingMessage.style.transform =
                'translateY(0px) scale(0.96)';

            floatingMessage.style.opacity = '0';

            setTimeout(removeFloatingMessage, 250);
        }
    }

  // Swipe sonrası oluşabilecek normal click'i kontrol et
let swipeJustSent = false;

swipeSendBtn.addEventListener('click', (e) => {
    if (swipeJustSent && e.detail !== 0) {
        e.preventDefault();
        e.stopImmediatePropagation();
        swipeJustSent = false;
    }
}, true);

swipeSendBtn.addEventListener('pointerup', () => {

    const shouldSend =
    Math.abs(currentY) >= sendThreshold;

    if (shouldSend && swipeMessageInput.value.trim()) {

        swipeJustSent = true;

        // Mevcut gönderme sistemini çalıştır
        swipeSendBtn.click();

        setTimeout(() => {
            swipeJustSent = false;
        }, 300);
    }

    resetSwipeSend();
});

swipeSendBtn.addEventListener('pointercancel', resetSwipeSend);
    }
// ============================================================
// ✨ HIZLI ÖNERİ BUTONLARI
// ============================================================

document.querySelectorAll('.suggestion-chip').forEach(button => {

    button.addEventListener('click', () => {

        const type = button.dataset.prompt;

        let starterText = '';

        if (type === 'Bir şey araştır') {
            starterText = 'Şunu araştır: ';
        }

        else if (type === 'Görsel oluştur') {
            starterText = 'Şu görseli oluştur: ';
        }

        else if (type === 'Kod yaz') {
            starterText = 'Şu konuda kod yaz: ';
        }

        messageInput.value = starterText;

        // Input'a odaklan
        messageInput.focus();

        // İmleci yazının sonuna getir
        messageInput.setSelectionRange(
            messageInput.value.length,
            messageInput.value.length
        );

        // Önerileri gizle
        quickSuggestions.classList.add('hidden');
    });

});
