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
let currentImageUrl = null;
let previewContainer = null;
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
// 📝 MARKDOWN RENDER - UTF-8 DESTEKLİ
// ============================================================
function renderMarkdown(text) {
    if (!text) return '';
    try {
        if (typeof marked !== 'undefined' && marked.parse) {
            if (typeof marked.setOptions === 'function') {
                marked.setOptions({
                    breaks: true,
                    gfm: true,
                    headerIds: false,
                    mangle: false
                });
            }
            return marked.parse(text);
        } else {
            return text;
        }
    } catch (e) {
        console.error('Markdown render error:', e);
        return text;
    }
}

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
function setImageLoadingAnimation(loadingMsgId, text) {
    const wrapper = document.getElementById(loadingMsgId);
    const bubble = wrapper?.querySelector('.bubble');

    if (!bubble) return;

    bubble.innerHTML = `
        <div class="markdown-body">
            <span class="chatchip-loading-icon">✦</span>
            <span>${text}</span>
        </div>
    `;
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

    console.log('📸 Aktif görsel:', currentImageUrl ? 'var' : 'yok');

    if (!text && !currentImageUrl) return;
    if (isProcessing) return;

    // 🔥 GÖRSEL DÜZENLEME KONTROLÜ
    if (currentImageUrl && text) {
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
    currentImageUrl ||
    localStorage.getItem('chatchip_current_image_url');

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
    currentImageUrl = null;
localStorage.removeItem('chatchip_current_image_url');
removeImagePreviewUI();
    chatArea.scrollTop = chatArea.scrollHeight;
}

// ============================================================
// MESAJ EKLEME
// ============================================================
function addMessage(text, type, isTemp = false, timestamp = null) {
    const wrapper = document.createElement('div');
    wrapper.className = `message ${type}`;
    wrapper.id = isTemp ? 'temp-' + Date.now() : 'msg-' + Date.now();

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    
    if (type === 'bot') {
        const contentDiv = document.createElement('div');
        contentDiv.className = 'markdown-body';
        contentDiv.innerHTML = renderMarkdown(text || '...');
        bubble.appendChild(contentDiv);

        // ============================================================
        // 🔧 AI MESAJ AKSİYONLARI
        // ============================================================
   const actions = document.createElement('div');
actions.className = 'message-actions';
actions.style.display = 'none';

        actions.innerHTML = `
    <button type="button" class="message-action-btn" data-action="speak" title="Sesli oku" onclick="toggleSpeechPlayback(this)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5 11 5"></polygon>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                </svg>
                <span>Sesli oku</span>
            </button>

            <button type="button" class="message-action-btn" data-action="copy" title="Kopyala" onclick="copyMessage(this)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span>Kopyala</span>
            </button>

            <button type="button" class="message-action-btn" data-action="share" title="Paylaş" onclick="shareMessage(this)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="18" cy="5" r="3"></circle>
                    <circle cx="6" cy="12" r="3"></circle>
                    <circle cx="18" cy="19" r="3"></circle>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
                <span>Paylaş</span>
            </button>
        `;

        bubble.appendChild(actions);

    } else {
        const imageMatch = text.match(/!\[.*?\]\((.*?)\)/);

        if (imageMatch) {
            const imageUrl = imageMatch[1];
            const textWithoutImage = text.replace(/!\[.*?\]\(.*?\)/, '').trim();
            
            const container = document.createElement('div');
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.alignItems = 'flex-start';
            container.style.gap = '6px';
            container.style.width = '100%';
            
            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = 'Yüklenen görsel';
            img.style.maxWidth = '100%';
            img.style.maxHeight = '300px';
            img.style.borderRadius = '12px';
            img.style.border = '1px solid var(--border)';
            img.style.objectFit = 'contain';
            img.style.background = 'var(--bg)';
            img.style.display = 'block';
            
            img.onerror = function() {
                this.style.display = 'none';

                const errorMsg = document.createElement('div');
                errorMsg.textContent = '❌ Görsel yüklenemedi';
                errorMsg.style.color = '#EF4444';
                errorMsg.style.fontSize = '0.8rem';
                errorMsg.style.padding = '8px';

                container.appendChild(errorMsg);
            };
            
            container.appendChild(img);
            
            if (textWithoutImage) {
                const textNode = document.createElement('div');
                textNode.textContent = textWithoutImage;
                textNode.style.marginTop = '4px';
                textNode.style.fontSize = '0.9rem';
                textNode.style.color = 'var(--text)';
                textNode.style.wordBreak = 'break-word';

                container.appendChild(textNode);
            }
            
            bubble.appendChild(container);

        } else {
            bubble.textContent = text || '...';
        }
    }

    const time = document.createElement('span');
    time.className = 'time';

    if (timestamp) {
        const date = new Date(timestamp);
        time.textContent = date.toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    } else {
        time.textContent = new Date().toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    bubble.appendChild(time);
    wrapper.appendChild(bubble);
    messagesDiv.appendChild(wrapper);

    return wrapper.id;
}

function updateMessageMarkdown(id, text) {
    const wrapper = document.getElementById(id);
    if (!wrapper) return;

    const bubble = wrapper.querySelector('.bubble');
    if (!bubble) return;

    // ============================================================
    // 🤖 AI CEVABINI GÜNCELLE
    // ============================================================
    let contentDiv = bubble.querySelector('.markdown-body');

    if (!contentDiv) {
        contentDiv = document.createElement('div');
        contentDiv.className = 'markdown-body';
        bubble.prepend(contentDiv);
    }

    contentDiv.innerHTML = renderMarkdown(text);

    // ============================================================
    // 🔧 SIRALAMA
    // AI cevabı → butonlar → saat
    // ============================================================
    const actions = bubble.querySelector('.message-actions');
    const time = bubble.querySelector('.time');

    if (actions) {
        bubble.appendChild(actions);
    }

    if (time) {
        bubble.appendChild(time);
    }

    // ============================================================
    // ⏰ SAAT
    // ============================================================
    let currentTime = bubble.querySelector('.time');

    if (!currentTime) {
        currentTime = document.createElement('span');
        currentTime.className = 'time';
        bubble.appendChild(currentTime);
    }

    currentTime.textContent = new Date().toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit'
    });
}
// ============================================================
// TOAST
// ============================================================
function showToast(msg, type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast show ${type}`;
    toast.textContent = msg;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================================
// GLOBAL
// ============================================================

console.log('✅ App yüklendi! (Model + Koç)');

// ============================================================
// 🖼️ GÖRSEL PREVIEW
// ============================================================

function showImagePreview(imageUrl) {
    if (previewContainer) {
        previewContainer.remove();
        previewContainer = null;
    }
    
    previewContainer = document.createElement('div');
    previewContainer.className = 'image-preview-container';
    previewContainer.style.cssText = `
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        background: var(--bg-secondary);
        border: 1px solid var(--border);
        border-radius: 8px;
        margin-bottom: 6px;
        animation: fadeIn 0.3s ease;
    `;
    
    const img = document.createElement('img');
    img.src = imageUrl;
    img.style.cssText = `
        width: 60px;
        height: 60px;
        object-fit: cover;
        border-radius: 6px;
        border: 1px solid var(--border);
    `;
    
    const info = document.createElement('span');
    info.className = 'info';
    info.textContent = '📷 Görsel eklendi';
    info.style.cssText = `
        font-size: 0.8rem;
        color: var(--text-light);
        flex: 1;
    `;
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = '✕';
    removeBtn.style.cssText = `
        background: none;
        border: none;
        color: var(--text-light);
        cursor: pointer;
        font-size: 1rem;
        padding: 4px 8px;
        border-radius: 4px;
        transition: all 0.2s;
    `;
    removeBtn.onmouseover = function() {
        this.style.background = 'rgba(239, 68, 68, 0.1)';
        this.style.color = '#EF4444';
    };
    removeBtn.onmouseout = function() {
        this.style.background = 'none';
        this.style.color = 'var(--text-light)';
    };
    removeBtn.onclick = function() {
        clearImagePreview();
        showToast('📷 Görsel kaldırıldı', 'info');
    };
    
    previewContainer.appendChild(img);
    previewContainer.appendChild(info);
    previewContainer.appendChild(removeBtn);
    
    const inputWrapper = document.querySelector('.input-wrapper');
    if (inputWrapper) {
        inputWrapper.parentNode.insertBefore(previewContainer, inputWrapper);
    }
}

// ============================================================
// 🗑️ GÖRSEL PREVIEW TEMİZLE
// ============================================================

function clearImagePreview() {
    // Preview kutusunu kaldır
    if (previewContainer) {
        previewContainer.remove();
        previewContainer = null;
    }

    // Aktif görseli temizle
    currentImageUrl = null;

    // LocalStorage'daki görseli temizle
    localStorage.removeItem('chatchip_current_image_url');

    // File input'u temizle
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.value = '';
    }

    // Mesaj kutusunu normale döndür
    const input = document.getElementById('messageInput');
    if (input) {
        input.placeholder = 'Mesajınızı yazın...';
    }

    console.log('🗑️ Görsel preview temizlendi');
}
// ============================================================
// 🗑️ GÖRSEL STATE YÖNETİMİ
// ============================================================

// SADECE preview UI'ı temizle (görsel URL'sini silme!)
function removeImagePreviewUI() {
    if (previewContainer) {
        previewContainer.remove();
        previewContainer = null;
    }
    const input = document.getElementById('messageInput');
    if (input) {
        input.placeholder = 'Mesajını yaz...';
    }
}

// Görsel state'ini temizle (UI + veri)
function clearCurrentImage() {
    currentImageUrl = null;
    localStorage.removeItem('chatchip_current_image_url');
    removeImagePreviewUI();
    console.log('🗑️ Görsel temizlendi');
}

// Event listener'lar
document.addEventListener('DOMContentLoaded', function() {
    const fileUploadBtn = document.getElementById('fileUploadBtn');
    const fileInput = document.getElementById('fileInput');
    
    if (fileUploadBtn) {
        fileUploadBtn.addEventListener('click', openFileUpload);
        console.log('📎 Dosya yükleme butonu hazır');
    }
    
    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
        console.log('📎 Dosya input hazır');
    }
});

// ============================================================
// 📝 SİSTEM PROMPTU PANELİ
// ============================================================


function copyMessage(button) {
    const message = button.closest('.message');
    if (!message) return;

    const content = message.querySelector('.markdown-body');
    if (!content) return;

    const text = content.innerText || content.textContent;

    if (!text.trim()) {
        showToast('⚠️ Kopyalanacak metin yok!', 'info');
        return;
    }

    navigator.clipboard.writeText(text).then(() => {
        showToast('✅ Yanıt kopyalandı!', 'success');
    }).catch(error => {
        console.error('Kopyalama hatası:', error);
        showToast('❌ Kopyalama başarısız!', 'error');
    });
}
function shareMessage(button) {
    const message = button.closest('.message');
    if (!message) return;

    const content = message.querySelector('.markdown-body');
    if (!content) return;

    const text = content.innerText || content.textContent;

    if (!text.trim()) {
        showToast('⚠️ Paylaşılacak metin yok!', 'info');
        return;
    }

    if (navigator.share) {
        navigator.share({
            title: 'ChatChip AI',
            text: text
        }).catch(error => {
            if (error.name !== 'AbortError') {
                console.error('Paylaşım hatası:', error);
                showToast('❌ Paylaşım başarısız!', 'error');
            }
        });
    } else {
        navigator.clipboard.writeText(text).then(() => {
            showToast('📋 Paylaşım desteklenmiyor, yanıt kopyalandı!', 'info');
        }).catch(error => {
            console.error('Kopyalama hatası:', error);
            showToast('❌ Paylaşım başarısız!', 'error');
        });
    }
}

// ============================================================
// 🖼️ ÜRETİLEN GÖRSELE TIKLAMA + DÜZENLEME PANELİ
// ============================================================

document.addEventListener('click', function (e) {

    const image = e.target.closest('.chatchip-editable-image');

    if (!image) return;

    const imageSrc = image.dataset.imageSrc;

    console.log('🖌️ Düzenlenecek görsel seçildi');

    currentImageUrl = imageSrc;

    localStorage.setItem(
        'chatchip_current_image_url',
        imageSrc
    );

    // Eski panel varsa kaldır
    const oldPanel = document.getElementById('imageEditPanel');

    if (oldPanel) {
        oldPanel.remove();
    }

    // Düzenleme paneli
    const panel = document.createElement('div');

    panel.id = 'imageEditPanel';

    panel.innerHTML = `
        <div style="
            margin-top:12px;
            padding:12px;
            border:1px solid var(--border);
            border-radius:14px;
            background:var(--background);
        ">

            <img
                src="${imageSrc}"
                alt="Düzenlenecek görsel"
                style="
                    width:100%;
                    max-height:420px;
                    object-fit:contain;
                    border-radius:12px;
                    display:block;
                    margin-bottom:12px;
                "
            />

            <div style="
                display:flex;
                gap:8px;
                align-items:center;
            ">

                <input
                    type="text"
                    id="imageEditPrompt"
                    placeholder="Görselde neyi değiştirmek istiyorsun?"
                    style="
                        flex:1;
                        min-width:0;
                        padding:12px 14px;
                        border:1px solid var(--border);
                        border-radius:12px;
                        background:var(--background);
                        color:var(--text);
                        font-size:13px;
                        outline:none;
                    "
                />

                <button
                    type="button"
                    id="imageEditSendBtn"
                    style="
                        width:44px;
                        height:44px;
                        border:none;
                        border-radius:12px;
                        cursor:pointer;
                        background:transparent;
                        color:#9CA3AF;
                        font-size:18px;
                    "
                >
                    ↑
                </button>

            </div>
        </div>
    `;

    image.parentElement.appendChild(panel);

    const input = document.getElementById('imageEditPrompt');

    if (input) {
    input.focus();
}

const sendBtn = document.getElementById('imageEditSendBtn');

async function submitImageEdit() {

    const prompt = input?.value.trim();

    if (!prompt) return;

    if (sendBtn) {
        sendBtn.disabled = true;
    }

    if (input) {
        input.disabled = true;
    }

    addMessage(prompt, 'user');

    panel.remove();

    await ImageService.edit(
        prompt,
        imageSrc,
        {
            addMessage: addMessage,
            setLoading: setImageLoadingAnimation,
            updateMessage: updateMessageMarkdown
        }
    );

    clearCurrentImage();
}

if (sendBtn) {
    sendBtn.addEventListener('click', submitImageEdit);
}

if (input) {
    input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            submitImageEdit();
        }
    });
}

});
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
