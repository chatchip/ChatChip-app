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
    setupAuthEventListeners();
    loadSystemPrompt();
    initDarkMode();
    setTimeout(addDarkModeToggle, 200);
    setTimeout(updateThemeIcon, 300);
    startPlanWatcher();
});

// ============================================================
// AUTH UI LISTENERS
// ============================================================
function setupAuthEventListeners() {
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

    const intent = window.ChatChipMessageRouter?.resolveIntent?.(text, {
        hasActiveImage: Boolean(activeImageUrl)
    }) || { type: 'chat', cleanPrompt: text };

    if (intent.type === 'image_edit') {
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

    // Aktif görsel düzenleme komutu değilse state'i normal chat'e taşımayız.
    if (activeImageUrl) {
        window.ChatChipImageState?.clear?.();
    }

    if (intent.type === 'image_generate') {
        input.value = '';
        input.style.height = 'auto';
        removeImagePreviewUI();

        addMessage(text, 'user');
        await generateAndShowImage(intent.cleanPrompt, text);
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
