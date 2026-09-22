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
function getChatEngineContext() {
    return {
        input,
        sendBtn,
        stopBtn,
        chatArea,

        getCurrentUser: () => currentUser,
        getCurrentPlan: () => currentPlan,

        getSessionId: () => currentSessionId,
        setSessionId: value => { currentSessionId = value; },

        getSessions: () => sessions,
        getFirstMessage: () => isFirstMessage,
        setFirstMessage: value => { isFirstMessage = value; },

        getCryptoKey: () => currentCryptoKey,
        setCryptoKey: value => { currentCryptoKey = value; },

        setProcessing: value => { isProcessing = value; },
        setAbortController: value => { abortController = value; },

        addMessage,
        updateMessageMarkdown,
        showToast,
        renderSessions,
        loadSessions,
        removeImagePreviewUI,
        clearCurrentImage
    };
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

    await window.ChatChipChatEngine.run(
        text,
        getChatEngineContext()
    );

}

// ============================================================
// GLOBAL
// ============================================================

console.log('✅ App yüklendi! (Model + Koç)');

// ============================================================
// 📝 SİSTEM PROMPTU PANELİ
// ============================================================
