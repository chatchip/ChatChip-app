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
let availableModels = [];
let abortController = null;
let currentImageUrl = localStorage.getItem('chatchip_current_image_url') || null;
let previewContainer = null;
let currentCryptoKey = null;  // 🔐 Güvenli şifreleme anahtarı (CryptoKey)

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 App başlatıldı (Model + Koç)');
     // 🔥 Uygulama kapanma/tekrar açılma kontrolü
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Uygulama kapatıldı
            localStorage.setItem('chatchip_last_close_time', Date.now().toString());
            console.log('⏰ Uygulama kapatıldı, zaman kaydedildi');
        } else {
            // Uygulama tekrar açıldı (arka plandan geldi)
            console.log('👁️ Uygulama tekrar görünür oldu');
            // 15 dakika kontrolü için autoLoginWithBiometric'i çağır!
            autoLoginWithBiometric();
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
    
    // 🔥 Biyometrik desteği kontrol et (YENİ)
    setTimeout(checkBiometricSupport, 500);
        // 🔥 Biyometrik buton event listener'ları
    const biometricLoginBtn = document.getElementById('biometricLoginBtn');
    const biometricRegisterBtn = document.getElementById('biometricRegisterBtn');

    if (biometricLoginBtn) {
        biometricLoginBtn.addEventListener('click', loginWithBiometric);
    }

    if (biometricRegisterBtn) {
        biometricRegisterBtn.addEventListener('click', registerBiometric);
    }
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
// 🔥 MODELLERİ YÜKLE
// ============================================================
async function loadModels() {
    try {
        const dm = window.DataManager;
        const result = await dm.getAvailableModels();
        
        if (result.success && result.models) {
            availableModels = result.models;
            updateModelSelector();
        }
    } catch (error) {
        console.error('Model yükleme hatası:', error);
    }
}

function updateModelSelector() {
    const selector = document.getElementById('modelSelector');
    if (!selector) return;
    
    const currentValue = selector.value;
    selector.innerHTML = '';
    
    availableModels.forEach(model => {
        const option = document.createElement('option');
        option.value = model.version;
        option.textContent = model.label;
        option.disabled = !model.isAvailable;
        selector.appendChild(option);
    });
    
    if (!availableModels.find(m => m.version === currentValue) || currentValue === '') {
        const firstAvailable = availableModels.find(m => m.isAvailable);
        selector.value = firstAvailable ? firstAvailable.version : availableModels[0]?.version || '1.0';
    } else {
        selector.value = currentValue;
    }
    
    localStorage.setItem('chatchip_selected_model', selector.value);
}

// ============================================================
// 🔥 KOÇ DURUMU
// ============================================================
function updateCoachStatus() {
    // Boş, sadece hata vermesin
}

// ============================================================
// AUTH
// ============================================================
async function checkAuth() {
    const dm = window.DataManager;
    const token = dm.getToken();
    currentUser = dm.currentUser;

    const avatar = document.getElementById('profileAvatar');
    const name = document.getElementById('profileName');
    const email = document.getElementById('profileEmail');
    const welcome = document.getElementById('welcomeMessage');
    const loginForm = document.getElementById('loginForm');
    const userMenu = document.getElementById('userMenu');
    const adminMenuItem = document.getElementById('adminMenuItem');
    const profileBtn = document.getElementById('profileBtn');

    if (token && currentUser) {
        console.log('👤 Kullanıcı giriş yapmış:', currentUser.name);
        if (!currentCryptoKey) {
    const savedJwk = localStorage.getItem('chatchip_crypto_key_jwk');

    if (savedJwk) {
        try {
            currentCryptoKey = await window.crypto.subtle.importKey(
                'jwk',
                JSON.parse(savedJwk),
                { name: 'AES-GCM', length: 256 },
                true,
                ['encrypt', 'decrypt']
            );

            console.log('✅ CryptoKey JWK\'dan geri yüklendi');
        } catch (e) {
            console.error('❌ CryptoKey import edilemedi:', e);
        }
    }
}

        
       // 🔥 7 GÜN KONTROLÜ
let isSevenDaySession = false;

const expiryDate = localStorage.getItem('chatchip_password_expiry');

if (expiryDate) {
    const now = new Date();
    const expiry = new Date(expiryDate);

    if (now < expiry) {
        // ✅ 7 günlük oturum hâlâ geçerli
        isSevenDaySession = true;
        console.log('✅ 7 günlük oturum hâlâ geçerli');
    } else {
        // ❌ 7 gün dolmuş
        localStorage.removeItem('chatchip_password_expiry');
        localStorage.removeItem('chatchip_encrypted_password');
        currentCryptoKey = null;

        console.log('⏰ 7 gün doldu, oturum temizlendi');
    }
}
        
        // 🔥 CryptoKey kontrol et, yoksa normal giriş göster!
if (!currentCryptoKey && !isSevenDaySession) {
    console.log('🔑 CryptoKey yok, normal giriş gösteriliyor');
    if (loginForm) loginForm.style.display = 'block';
    if (userMenu) userMenu.style.display = 'none';
}
        
        // UI güncellemeleri
        avatar.textContent = currentUser.name?.charAt(0).toUpperCase() || '👤';
        name.textContent = currentUser.name || 'Kullanıcı';
        email.textContent = currentUser.email || '';
        welcome.textContent = `Merhaba ${currentUser.name}! 👋`;
        
        if (profileBtn) {
            profileBtn.textContent = currentUser.name?.charAt(0).toUpperCase() || '👤';
        }
        
        if (loginForm) loginForm.style.display = 'none';
        if (userMenu) userMenu.style.display = 'block';
        
        if (currentUser.is_admin && adminMenuItem) {
            adminMenuItem.style.display = 'flex';
            adminMenuItem.onclick = function() {
                window.location.href = '/admin-panel.html';
            };
        } else if (adminMenuItem) {
            adminMenuItem.style.display = 'none';
        }
        
        checkPlan();
        
    } else {
        // Kullanıcı giriş yapmamış
        console.log('👤 Kullanıcı giriş yapmamış');
        avatar.textContent = '👤';
        name.textContent = 'Misafir';
        email.textContent = 'giris@yapilmadi';
        welcome.textContent = 'Merhaba! 👋';
        
        if (profileBtn) {
            profileBtn.textContent = '👤';
        }
        
        if (loginForm) loginForm.style.display = 'block';
        if (userMenu) userMenu.style.display = 'none';
        if (adminMenuItem) adminMenuItem.style.display = 'none';
    }
}
// ============================================================
// PLAN KONTROLÜ
// ============================================================
async function checkPlan() {
    try {
        const dm = window.DataManager;
        const result = await dm.getPlanStatus();
        
        if (result.success && result.plan) {
            currentPlan = result.plan;
            
            const planName = document.getElementById('planName');
            const planTime = document.getElementById('planTime');
            const planExpires = document.getElementById('planExpires');
            const planBadge = document.getElementById('planBadge');
            const planWarning = document.getElementById('planWarning');
            
            if (currentPlan.isExpired) {
                if (planBadge) {
                    planBadge.textContent = '⛔ Sona Erdi';
                    planBadge.style.background = '#FEE2E2';
                    planBadge.style.color = '#DC2626';
                }
                if (planName) {
                    planName.textContent = '⛔ Sona Erdi';
                    planName.style.color = '#DC2626';
                }
                if (planTime) {
                    planTime.textContent = '🗓️ ' + currentPlan.expiresFormatted + ' (Süre doldu)';
                    planTime.style.color = '#DC2626';
                }
                if (planExpires) {
                    planExpires.textContent = '⚠️ ' + currentPlan.expiresFormatted + ' - SÜRE DOLDU!';
                    planExpires.style.color = '#DC2626';
                    planExpires.style.fontWeight = 'bold';
                }
                if (planWarning) planWarning.style.display = 'block';
            } else {
                const label = currentPlan.type === 'free' ? '🆓 Ücretsiz' : '⭐ ' + currentPlan.type;
                if (planBadge) {
                    planBadge.textContent = '✅ ' + label;
                    planBadge.style.background = currentPlan.type === 'free' ? '#D1FAE5' : '#DBEAFE';
                    planBadge.style.color = currentPlan.type === 'free' ? '#065F46' : '#1E40AF';
                }
                if (planName) {
                    planName.textContent = label;
                    planName.style.color = currentPlan.type === 'free' ? '#065F46' : '#1E40AF';
                }
                if (planTime) {
                    let timeText = '';
                    if (currentPlan.remainingHours > 0) {
                        timeText = `⏳ ${currentPlan.remainingHours} saat ${currentPlan.remainingMinutes} dakika kaldı`;
                    } else if (currentPlan.remainingMinutes > 0) {
                        timeText = `⏳ ${currentPlan.remainingMinutes} dakika kaldı`;
                    } else {
                        timeText = `⏳ 1 saatten az kaldı`;
                    }
                    planTime.textContent = timeText;
                    planTime.style.color = '#6B7280';
                }
                if (planExpires) {
                    planExpires.textContent = currentPlan.expiresFormatted;
                    planExpires.style.color = '#6B7280';
                    planExpires.style.fontWeight = 'normal';
                }
                if (planWarning) planWarning.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('❌ Plan kontrol hatası:', error);
    }
}

function startPlanWatcher() {
    setInterval(async () => {
        if (currentUser) {
            await checkPlan();
        }
    }, 60000);
}

// ============================================================
// SOHBET SESSİONLARI
// ============================================================
async function loadSessions() {
    try {
        const dm = window.DataManager;
        const result = await dm.getSessions();
        
        if (result.success) {
            sessions = result.sessions || [];
            renderSessions();
            console.log('📋 Sohbetler yüklendi:', sessions.length);
        }
    } catch (error) {
        console.error('Sessions yükleme hatası:', error);
    }
}

function renderSessions() {
    const container = document.getElementById('chatHistory');
    if (!container) return;
    
    if (sessions.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:20px; color:var(--text-light); font-size:0.8rem;">
                Henüz sohbet yok
            </div>
        `;
        return;
    }
    
    const sorted = [...sessions].sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        return new Date(b.updated_at) - new Date(a.updated_at);
    });
    
    container.innerHTML = sorted.map(s => `
        <div class="history-item ${s.is_pinned ? 'pinned' : ''}" onclick="loadSession(${s.id})" data-id="${s.id}">
            <span>${s.is_pinned ? '📌 ' : '💬 '} ${s.title || 'Yeni Sohbet'}</span>
            <div class="history-actions">
                <button class="history-btn" onclick="event.stopPropagation(); renameSession(${s.id}, '${s.title || 'Yeni Sohbet'}')">✏️</button>
                <button class="history-btn" onclick="event.stopPropagation(); togglePin(${s.id}, ${s.is_pinned})">📌</button>
                <button class="history-btn" onclick="event.stopPropagation(); deleteSession(${s.id})">🗑️</button>
            </div>
        </div>
    `).join('');
}

// ============================================================
// SESSİON İŞLEMLERİ
// ============================================================
async function loadSession(id) {
    try {
        console.log("📂 Session yükleniyor:", id);
        const dm = window.DataManager;
        const result = await dm.getSession(id);
        console.log("📦 Session sonucu:", result);
        
        if (result && result.success) {
            currentSessionId = id;
            isFirstMessage = false;
            messagesDiv.innerHTML = "";
             if (!currentCryptoKey) {
    // 🔥 ÖNCE JWK'dan dene!
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
            console.log('✅ CryptoKey JWK\'dan yüklendi (loadSession)');
        } catch (e) {
            console.warn('⚠️ CryptoKey import edilemedi:', e);
        }
    }
    
    // JWK yoksa sessionStorage'dan şifreyle dene (yedek)
    if (!currentCryptoKey) {
        const savedPassword = localStorage.getItem('user_password');
        if (savedPassword) {
            try {
                currentCryptoKey = await ChatChipCrypto.deriveKey(savedPassword);
                console.log('✅ CryptoKey sessionStorage şifresinden türetildi (loadSession)');
            } catch (e) {
                console.warn('⚠️ CryptoKey türetilemedi:', e);
            }
        }
    }
}
            
            if (result.messages && result.messages.length > 0) {
                for (const msg of result.messages) {
                    let content = msg.content;
                    let role = msg.role;
                    let created_at = msg.created_at;
                    
                    // 🔐 CryptoKey ile çöz
                    if (msg.encrypted_content && msg.iv && currentCryptoKey) {
                        try {
                            const decrypted = await ChatChipCrypto.decryptWithKey(
                                { data: msg.encrypted_content, iv: msg.iv },
                                currentCryptoKey
                            );
                            content = decrypted || '🔒 Şifreli mesaj (çözülemedi)';
                            console.log('✅ Şifreli mesaj çözüldü (CryptoKey)');
                        } catch (e) {
                            console.error('Şifre çözme hatası:', e);
                            content = '🔒 Şifreli mesaj (çözülemedi)';
                        }
                    } else if (msg.content) {
                        // Eski şifresiz mesaj
                        content = msg.content;
                    } else {
                        content = '⚠️ Mesaj okunamadı';
                    }
                    
                    addMessage(content, role, false, created_at);
                }
            }
            
            document.querySelector(".page-title").textContent = "💬 " + (result.session?.title || "Sohbet");
            closeAllSidebars();
            showToast(`📂 ${result.session?.title || "Sohbet"} yüklendi`, "success");
        } else {
            console.error("❌ Session yüklenemedi:", result?.error || "Bilinmeyen hata");
            showToast("❌ Sohbet yüklenemedi: " + (result?.error || "Bilinmeyen hata"), "error");
        }
    } catch (error) {
        console.error("❌ Session yükleme hatası:", error);
        showToast("❌ Sohbet yüklenirken hata oluştu: " + error.message, "error");
    }
}

async function startNewChat() {
    try {
        const dm = window.DataManager;
        const result = await dm.createSession('Yeni Sohbet');
        
        if (result.success) {
            currentSessionId = result.session.id;
            isFirstMessage = true;
            sessions.unshift(result.session);
            renderSessions();
            messagesDiv.innerHTML = '';
            document.querySelector('.page-title').textContent = '💬 Yeni Sohbet';
            showToast('✅ Yeni sohbet başlatıldı!', 'success');
            closeAllSidebars();
        }
    } catch (error) {
        console.error('Yeni sohbet hatası:', error);
        showToast('❌ Sohbet oluşturulamadı', 'error');
    }
}

async function renameSession(id, currentTitle) {
    const newTitle = prompt('Sohbet başlığını girin:', currentTitle);
    if (!newTitle || newTitle.trim().length === 0) return;
    
    try {
        const dm = window.DataManager;
        const result = await dm.updateSession(id, newTitle.trim());
        
        if (result.success) {
            const session = sessions.find(s => s.id === id);
            if (session) session.title = result.session.title;
            renderSessions();
            
            if (currentSessionId === id) {
                document.querySelector('.page-title').textContent = '💬 ' + result.session.title;
            }
            showToast('✅ Başlık güncellendi!', 'success');
        }
    } catch (error) {
        console.error('Yeniden adlandırma hatası:', error);
        showToast('❌ Başlık güncellenemedi', 'error');
    }
}

async function togglePin(id, currentState) {
    try {
        const dm = window.DataManager;
        const result = await dm.pinSession(id, !currentState);
        
        if (result.success) {
            const session = sessions.find(s => s.id === id);
            if (session) session.is_pinned = result.session.is_pinned;
            renderSessions();
            showToast(result.session.is_pinned ? '📌 Sabitlendi!' : '📌 Sabitlik kaldırıldı', 'success');
        }
    } catch (error) {
        console.error('Sabitleme hatası:', error);
        showToast('❌ İşlem başarısız', 'error');
    }
}

async function deleteSession(id) {
    if (!confirm('Bu sohbeti silmek istediğinize emin misiniz?')) return;
    
    try {
        const dm = window.DataManager;
        const result = await dm.deleteSession(id);
        
        if (result.success) {
            sessions = sessions.filter(s => s.id !== id);
            renderSessions();
            
            if (currentSessionId === id) {
                currentSessionId = null;
                isFirstMessage = true;
                messagesDiv.innerHTML = '';
                document.querySelector('.page-title').textContent = '💬 Sohbet';
            }
            showToast('🗑️ Sohbet silindi!', 'info');
        }
    } catch (error) {
        console.error('Silme hatası:', error);
        showToast('❌ Sohbet silinemedi', 'error');
    }
}

// ============================================================
// LOGIN / LOGOUT
// ============================================================
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    
    if (!email || !password) {
        showToast('⚠️ E-posta ve şifre girin!', 'error');
        return;
    }
    
    const dm = window.DataManager;
    const result = await dm.login(email, password);
    
    console.log('🔍 Login sonucu:', result);
    console.log('🔑 Password:', result.user?.password ? '✅ Var' : '❌ Yok');
    
    if (result.success) {
        currentUser = result.user;
        window.currentUser = result.user;
        
        // 🔐 1. Şifreden CryptoKey türet
        if (result.user && result.user.password) {
            try {
                currentCryptoKey = await ChatChipCrypto.deriveKey(result.user.password);
                console.log('✅ CryptoKey başarıyla türetildi');
                // 🔐 CryptoKey'i JWK olarak localStorage'a kaydet
try {
    const exportedKey = await window.crypto.subtle.exportKey(
        'jwk',
        currentCryptoKey
    );

    localStorage.setItem(
        'chatchip_crypto_key_jwk',
        JSON.stringify(exportedKey)
    );

    console.log('✅ CryptoKey JWK olarak localStorage\'a kaydedildi');
} catch (e) {
    console.error('❌ CryptoKey JWK kaydedilemedi:', e);
}      
                try {
    const encryptedPassword = await ChatChipCrypto.encryptWithKey(result.user.password, currentCryptoKey);
    localStorage.setItem('chatchip_encrypted_password', JSON.stringify(encryptedPassword));
    console.log('✅ Şifre şifrelenerek localStorage\'a kaydedildi');
} catch (e) {
    console.warn('⚠️ Şifre şifrelenemedi:', e);
}

                // 🔥 BURAYA EKLE (7 gün expiryDate)
const expiryDate = new Date();
expiryDate.setDate(expiryDate.getDate() + 7);
localStorage.setItem('chatchip_password_expiry', expiryDate.toISOString());
console.log('✅ 7 günlük oturum süresi kaydedildi');
            } catch (keyError) {
                console.error('❌ CryptoKey türetme hatası:', keyError);
                showToast('❌ Güvenlik anahtarı oluşturulamadı', 'error');
                return;
            }
        }
        
        // 🔥 2. Ham şifreyi SİL (güvenlik!)
        if (result.user) {
            result.user.password = null;
        }
        if (currentUser) {
            currentUser.password = null;
        }
        
        // 🔥 3. sessionStorage'a kaydetme (kaldırıldı!)
        // sessionStorage.setItem('user_password', ...)  // ❌ BUNU YAPMA!
        
        await checkAuth();
        checkPlan();
        loadModels();
        loadSessions();
        closeAllSidebars();
        showToast(`✅ Hoş geldin ${currentUser.name}!`, 'success');
    } else {
        showToast('❌ ' + (result.error || 'Giriş başarısız'), 'error');
    }
}
async function handleLogout() {
    if (confirm('Oturumu kapatmak istediğinize emin misiniz?')) {
        window.DataManager.logout();
        currentUser = null;
        currentSessionId = null;
        isFirstMessage = true;
        sessions = [];
        messagesDiv.innerHTML = '';
        
        // 🔥 YENİ: JWK ve diğer verileri temizle
        localStorage.removeItem('chatchip_crypto_key_jwk');
        localStorage.removeItem('chatchip_password_expiry');
        localStorage.removeItem('chatchip_encrypted_password');
        sessionStorage.removeItem('user_password');
        currentCryptoKey = null;
        
        await checkAuth();
        renderSessions();
        showToast('👋 Oturum kapatıldı.', 'info');
    }
}

// ============================================================
// KİŞİSELLEŞTİRME
// ============================================================
function loadSystemPrompt() {
    const saved = localStorage.getItem("chatchip_system_prompt");
    const input = document.getElementById("systemPromptInput");
    if (saved && input) {
        input.value = saved;
    }
}
function saveSystemPrompt() {
    const input = document.getElementById("systemPromptInput");
    if (!input) return;
    const prompt = input.value;
    localStorage.setItem("chatchip_system_prompt", prompt);
    showToast("✅ Sistem promptu kaydedildi!", "success");
    closePromptPanel();
}
// ============================================================
// SIDEBAR
// ============================================================
function toggleSidebar(side) {
    console.log('🔄 toggleSidebar:', side);
    const left = document.getElementById('sidebarLeft');
    const right = document.getElementById('sidebarRight');
    const overlay = document.getElementById('overlay');
    
    if (side === 'left' && left) {
        left.classList.toggle('active');
    } else if (side === 'right' && right) {
        right.classList.toggle('active');
    }
    
    if (overlay) {
        if (left?.classList.contains('active') || right?.classList.contains('active')) {
            overlay.classList.add('active');
        } else {
            overlay.classList.remove('active');
        }
    }
}

function closeAllSidebars() {
    const left = document.getElementById('sidebarLeft');
    const right = document.getElementById('sidebarRight');
    const overlay = document.getElementById('overlay');
    
    if (left) left.classList.remove('active');
    if (right) right.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
}

// ============================================================
// SOHBET ARAMA
// ============================================================
function searchChats() {
    const query = document.getElementById('searchChatInput').value.toLowerCase();
    const items = document.querySelectorAll('.history-item');
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(query) ? 'flex' : 'none';
    });
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
    
    const modelSelector = document.getElementById('modelSelector');
    if (modelSelector) {
        modelSelector.addEventListener('change', function() {
            localStorage.setItem('chatchip_selected_model', this.value);
        });
    }
    
    const coachSelector = document.getElementById('coachSelector');
    if (coachSelector) {
        coachSelector.addEventListener('change', updateCoachStatus);
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

    // Görsel varsa localStorage'dan yükle
    const savedImageUrl = localStorage.getItem('chatchip_current_image_url');

    if (savedImageUrl) {
        currentImageUrl = savedImageUrl;
        console.log('📸 Görsel localStorage\'dan yüklendi:', currentImageUrl);
    } else {
        currentImageUrl = null;
        console.log('📸 Aktif görsel yok');
    }

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

    addMessage(fullMessage, 'user');
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
// DARK MODE
// ============================================================
function toggleDarkMode() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('chatchip_theme', newTheme);
    updateThemeIcon();
    showToast(newTheme === 'dark' ? '🌙 Dark Mod aktif' : '☀️ Light Mod aktif', 'info');
}

function initDarkMode() {
    const saved = localStorage.getItem('chatchip_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || 'light';
    document.documentElement.setAttribute('data-theme', theme);
}

function addDarkModeToggle() {
    return; // Otomatik ekleme kapatıldı
    const userMenu = document.getElementById('userMenu');
    if (!userMenu) return;
    if (document.getElementById('themeIcon')) return;
    
    const divider = userMenu.querySelector('.menu-divider');
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'menu-item';
    toggleBtn.style.justifyContent = 'center';
    toggleBtn.style.gap = '8px';
    toggleBtn.innerHTML = '<span id="themeIcon">🌓</span> Tema Değiştir';
    toggleBtn.onclick = toggleDarkMode;
    
    if (divider) {
        userMenu.insertBefore(toggleBtn, divider.nextSibling);
    } else {
        const promptItem = userMenu.querySelector('.prompt-item');
        if (promptItem) {
            userMenu.insertBefore(toggleBtn, promptItem);
        } else {
            userMenu.appendChild(toggleBtn);
        }
    }
    updateThemeIcon();
}

function updateThemeIcon() {
    const theme = document.documentElement.getAttribute('data-theme');
    const icon = document.getElementById('themeIcon');
    if (icon) {
        icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
}

// ============================================================
// GLOBAL
// ============================================================
window.toggleSidebar = toggleSidebar;
window.closeAllSidebars = closeAllSidebars;
window.startNewChat = startNewChat;
window.loadSession = loadSession;
window.renameSession = renameSession;
window.togglePin = togglePin;
window.deleteSession = deleteSession;
window.searchChats = searchChats;
window.saveSystemPrompt = saveSystemPrompt;
window.toggleDarkMode = toggleDarkMode;
window.loadModels = loadModels;

console.log('✅ App yüklendi! (Model + Koç)');

// ============================================================
// 🔥 VERSİYON GÖSTERİMİ
// ============================================================
const PLAN_VERSION_MAP = {
    'free': 'ChatChip 1.0',
    'Lite': 'ChatChip 1.0',
    'Plus': 'ChatChip 2.0',
    'Pro': 'ChatChip 2.1'
};

function updateVersionDisplay() {
    const versionDisplay = document.getElementById('versionDisplay');
    if (!versionDisplay) return;
    
    const dm = window.DataManager;
    if (!dm) return;
    
    dm.getPlanStatus().then(result => {
        if (result && result.success && result.plan) {
            const planType = result.plan.type || 'free';
            const version = PLAN_VERSION_MAP[planType] || 'ChatChip 1.0';
            versionDisplay.textContent = version;
            console.log('📋 Versiyon güncellendi:', planType, '→', version);
        }
    }).catch(err => {
        console.error('Versiyon güncelleme hatası:', err);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(updateVersionDisplay, 500);
});

window.updateVersionDisplay = updateVersionDisplay;

// ============================================================
// 📎 DOSYA YÜKLEME (GÖRSEL PREVIEW)
// ============================================================

function openFileUpload() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.click();
}

async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert('❌ Lütfen bir resim dosyası seçin!');
        event.target.value = '';
        return;
    }

    if (file.size > 20 * 1024 * 1024) {
        alert('❌ Dosya çok büyük! Maksimum 20MB.');
        event.target.value = '';
        return;
    }

    showToast(`📷 ${file.name} yükleniyor...`, 'info');

    const formData = new FormData();
    formData.append('image', file);

    try {
        const token = localStorage.getItem('chatchip_token');
        const response = await fetch('https://chatchip-production.up.railway.app/api/upload/image', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            console.log('📸 data.fileUrl:', data.fileUrl);
            
            
            let imageUrl = data.fileUrl;
            if (imageUrl && imageUrl.startsWith('http://')) {
                imageUrl = imageUrl.replace('http://', 'https://');
            }
            // 🔥 URL'yi encode et (boşluklar ve özel karakterler için)
            imageUrl = encodeURI(imageUrl);
            currentImageUrl = imageUrl;
            localStorage.setItem('chatchip_current_image_url', currentImageUrl);
            console.log('📸 currentImageUrl set:', currentImageUrl);
            
            const input = document.getElementById('messageInput');
            if (input) {
                input.value = '';
                input.placeholder = '📝 Görsel hakkında bir şeyler yaz...';
                input.focus();
            }
            
            showImagePreview(currentImageUrl);
            showToast(`✅ ${file.name} yüklendi! Mesajını yaz ve gönder.`, 'success');
        } else {
            showToast('❌ ' + (data.error || 'Dosya yüklenirken hata oluştu!'), 'error');
        }
    } catch (error) {
        console.error('Dosya yükleme hatası:', error);
        showToast('❌ Dosya yüklenirken hata oluştu!', 'error');
    }

    event.target.value = '';
}

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


// ============================================================
// 🎤 MİKROFON (SESLİ KOMUT)
// ============================================================

let recognition = null;
let isListening = false;

function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        showToast('⚠️ Tarayıcınız sesli komut desteklemiyor!', 'error');
        return null;
    }
    
    recognition = new SpeechRecognition();
    recognition.lang = 'tr-TR';
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    
    return recognition;
}

function toggleSpeech() {
    const speechBtn = document.getElementById('speechBtn');
    const input = document.getElementById('messageInput');
    
    if (!recognition) {
        recognition = initSpeechRecognition();
        if (!recognition) return;
        
        recognition.onresult = function(event) {
            let final = '';
            let interim = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    final += transcript;
                } else {
                    interim += transcript;
                }
            }
            
            if (interim) {
                input.placeholder = `🎤 ${interim}...`;
            }
            
            if (final) {
                const currentText = input.value;
                input.value = currentText ? currentText + ' ' + final : final;
                input.placeholder = 'Mesajını yaz...';
                input.focus();
                input.dispatchEvent(new Event('input'));
                showToast('✅ Konuşma metne çevrildi!', 'success');
                stopListening();
            }
        };
        
        recognition.onerror = function(event) {
            console.error('Speech error:', event.error);
            if (event.error === 'not-allowed') {
                showToast('❌ Mikrofon erişimi reddedildi!', 'error');
            } else if (event.error === 'no-speech') {
                showToast('🎤 Konuşma algılanamadı, tekrar deneyin.', 'info');
            }
            stopListening();
        };
        
        recognition.onend = function() {
            stopListening();
        };
    }
    
    if (isListening) {
        stopListening();
    } else {
        startListening();
    }
}

function startListening() {
    if (!recognition) return;
    
    try {
        recognition.start();
        isListening = true;
        
        const speechBtn = document.getElementById('speechBtn');
        if (speechBtn) {
            speechBtn.style.color = '#EF4444';
            speechBtn.style.background = 'rgba(239, 68, 68, 0.1)';
            speechBtn.style.borderRadius = '50%';
            speechBtn.style.padding = '6px';
            speechBtn.title = 'Dinliyor... (tıkla durdur)';
        }
        
        const input = document.getElementById('messageInput');
        if (input) {
            input.placeholder = '🎤 Dinleniyor...';
        }
        
        showToast('🎤 Konuşmaya başlayın...', 'info');
        console.log('🎤 Dinleme başladı');
    } catch (error) {
        console.error('Speech start error:', error);
    }
}

function stopListening() {
    if (!recognition) return;
    
    try {
        recognition.stop();
    } catch (e) {}
    
    isListening = false;
    
    const speechBtn = document.getElementById('speechBtn');
    if (speechBtn) {
        speechBtn.style.color = '';
        speechBtn.style.background = '';
        speechBtn.style.borderRadius = '';
        speechBtn.style.padding = '';
        speechBtn.title = 'Sesli Komut';
    }
    
    const input = document.getElementById('messageInput');
    if (input) {
        input.placeholder = 'Mesajını yaz...';
    }
    
    console.log('🎤 Dinleme durdu');
}

// ============================================================
// 🔊 SESLİ OKUMA (TEXT-TO-SPEECH)
// ============================================================

let speechSynthesis = window.speechSynthesis;
let currentUtterance = null;
let isSpeaking = false;
let currentSpeechButton = null;

function cleanTextForSpeech(text) {
    let clean = text
        .replace(/!\[.*?\]\(.*?\)/g, '')
        .replace(/\[.*?\]\(.*?\)/g, '')
        .replace(/[#*_`~>]/g, '')
        .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
        .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
        .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
        .replace(/[\u{2600}-\u{26FF}]/gu, '')
        .replace(/[\u{2700}-\u{27BF}]/gu, '')
        .replace(/[:;][)D(dpP]/g, '')
        .replace(/\([)DdpP]\)/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    return clean;
}
function updateMessageSpeechButton(isActive) {
    if (!currentSpeechButton) return;

    const span = currentSpeechButton.querySelector('span');
    if (!span) return;

    span.textContent = isActive ? 'Durdur' : 'Sesli oku';

    currentSpeechButton.title = isActive
        ? 'Sesli okumayı durdur'
        : 'Sesli oku';
}

function speakText(text, button = null) {
    stopSpeaking();
    currentSpeechButton = button;
    
    if (!text || text.trim().length === 0) return;
    
    const cleanText = cleanTextForSpeech(text);
    
    if (cleanText.length === 0) {
        showToast('⚠️ Okunacak metin yok!', 'info');
        return;
    }
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'tr-TR';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    utterance.onstart = function() {
    isSpeaking = true;
    updateMessageSpeechButton(true);
    showToast('🔊 Sesli yanıt başladı...', 'info');
};
    
   utterance.onend = function() {
    isSpeaking = false;
    updateMessageSpeechButton(false);
    showToast('✅ Sesli yanıt tamamlandı!', 'success');
};
    
   utterance.onerror = function(event) {
    console.error('Speech error:', event);

    isSpeaking = false;

    // Kullanıcı konuşmayı kendisi durdurduysa hata gösterme
    if (event.error === 'canceled' || event.error === 'interrupted') {
        return;
    }

    showToast('❌ Ses oynatma hatası!', 'error');
};
    
    currentUtterance = utterance;
    speechSynthesis.speak(utterance);
}

function stopSpeaking() {
    if (speechSynthesis) {
        speechSynthesis.cancel();
    }

    if (currentSpeechButton) {
        updateMessageSpeechButton(false);
    }

    isSpeaking = false;
    currentUtterance = null;
    currentSpeechButton = null;
}

function toggleSpeechPlayback(button) {
    if (isSpeaking) {
        stopSpeaking();
        return;
    }

    const message = button.closest('.message');
    if (!message) return;

    const content = message.querySelector('.markdown-body');
    if (!content) {
        showToast('⚠️ Okunacak metin yok!', 'info');
        return;
    }

    const text = content.textContent || content.innerText;

    if (text && text.trim().length > 0) {
        speakText(text, button);
    } else {
        showToast('⚠️ Okunacak metin yok!', 'info');
    }
}
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
// 🎤🔊 EVENT LISTENER'LAR
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    // Mikrofon butonu
    const speechBtn = document.getElementById('speechBtn');
    if (speechBtn) {
        const newBtn = speechBtn.cloneNode(true);
        speechBtn.parentNode.replaceChild(newBtn, speechBtn);
        newBtn.addEventListener('click', toggleSpeech);
        console.log('🎤 Mikrofon butonu hazır');
    }
});

// 🔥 MOBİL İÇİN TOUCHEND DESTEĞİ (GEMİNİ ÖNERİSİ)
document.addEventListener('DOMContentLoaded', function() {
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        // Click zaten var, touchend ekleyelim
        loginBtn.addEventListener('touchend', function(e) {
            e.preventDefault();
            console.log('📱 Mobil: Giriş butonuna dokunuldu!');
            handleLogin(e);
        });
        console.log('✅ Mobil login touchend eklendi!');
    }
});
// ============================================================
// 🔐 BİYOMETRİK (Face ID / Parmak İzi) KONTROL
// ============================================================

async function checkBiometricSupport() {
    console.log('🔍 Biyometrik destek kontrol ediliyor...');
    
    const isSupported = BiometricAuth.isSupported();
    // 🔥 isAvailable KALDIRILDI! Artık kontrol etmiyoruz.
    const isRegistered = BiometricAuth.isBiometricRegistered();
    const isLoggedIn = !!currentUser;
    
    console.log('📊 Biyometrik durum:', {
        isSupported,
        isRegistered,
        isLoggedIn
    });
    
    const biometricLoginBtn = document.getElementById('biometricLoginBtn');
    const biometricRegisterBtn = document.getElementById('biometricRegisterBtn');
    
    // 🔥 TEST MODU: isAvailable kontrolü KALDIRILDI!
    if (isSupported) {
        // Sadece tarayıcı WebAuthn destekliyorsa butonları göster
        if (biometricLoginBtn && isLoggedIn) {
            biometricLoginBtn.style.display = isRegistered ? 'block' : 'none';
            console.log('✅ Biyometrik giriş butonu:', isRegistered ? 'GÖSTERİLDİ' : 'GİZLİ (kayıtlı değil)');
        }
        if (biometricRegisterBtn && isLoggedIn) {
            biometricRegisterBtn.style.display = isRegistered ? 'none' : 'block';
            console.log('✅ Biyometrik kayıt butonu:', isRegistered ? 'GİZLİ (kayıtlı)' : 'GÖSTERİLDİ');
        }
        console.log('✅ Biyometrik butonlar hazır!');
    } else {
        // Tarayıcı desteklemiyor
        if (biometricLoginBtn) biometricLoginBtn.style.display = 'none';
        if (biometricRegisterBtn) biometricRegisterBtn.style.display = 'none';
        console.log('⚠️ Tarayıcı WebAuthn desteklemiyor');
    }
}
// ============================================================
// 📱 BİYOMETRİK KAYIT ETME
// ============================================================

async function registerBiometric() {
    try {
        // 1. Kullanıcı giriş yapmış mı kontrol et
        if (!currentUser) {
            showToast('⚠️ Önce giriş yapmalısınız!', 'error');
            return;
        }

        // 2. Şifreyi al (önce input'tan dene, yoksa prompt ile sor)
        let password = document.getElementById('loginPassword')?.value;

        if (!password) {
            // SweetAlert2 ile dene
            if (typeof Swal !== 'undefined') {
                const result = await Swal.fire({
                    title: '🔐 Şifrenizi girin',
                    text: 'Face ID / Parmak izi kaydetmek için şifrenizi girmelisiniz.',
                    input: 'password',
                    inputPlaceholder: 'Şifreniz',
                    showCancelButton: true,
                    confirmButtonText: 'Kaydet',
                    cancelButtonText: 'İptal',
                    inputValidator: (value) => {
                        if (!value) {
                            return 'Şifre girmelisiniz!';
                        }
                    }
                });
                
                if (!result.isConfirmed || !result.value) {
                    showToast('❌ Kayıt iptal edildi', 'error');
                    return;
                }
                password = result.value;
            } else {
                // SweetAlert2 yoksa native prompt kullan
                password = prompt('🔐 Face ID / Parmak izi kaydetmek için şifrenizi girin:');
                if (!password) {
                    showToast('❌ Kayıt iptal edildi', 'error');
                    return;
                }
            }
        }

        // 🔥 2.5 CryptoKey'i kontrol et/türet (YENİ!)
        if (!currentCryptoKey) {
            try {
                currentCryptoKey = await ChatChipCrypto.deriveKey(password);
                console.log('✅ CryptoKey türetildi (register)');
            } catch (keyError) {
                console.error('❌ CryptoKey türetme hatası:', keyError);
                showToast('❌ Güvenlik anahtarı oluşturulamadı', 'error');
                return;
            }
        }

        showToast('⏳ Face ID / Parmak izi kaydediliyor...', 'info');

        // 3. WebAuthn ile credential oluştur
        const credential = await navigator.credentials.create({
            publicKey: {
                challenge: crypto.getRandomValues(new Uint8Array(32)),
                rp: { 
                    name: "ChatChip",
                    id: window.location.hostname
                },
                user: {
                    id: new TextEncoder().encode(currentUser.id.toString()),
                    name: currentUser.email,
                    displayName: currentUser.name
                },
                pubKeyCredParams: [
                    { type: "public-key", alg: -7 },
                    { type: "public-key", alg: -257 }
                ],
                authenticatorSelection: {
                    userVerification: "required",
                    residentKey: "preferred",
                    authenticatorAttachment: "platform"
                },
                attestation: "none"
            }
        });

        // 4. Başarılı! Credential ID'yi kaydet
        localStorage.setItem('chatchip_credential_id', credential.id);
        localStorage.setItem('chatchip_biometric_enabled', 'true');

        // 5. Şifreyi şifrele ve kaydet
        const encrypted = await ChatChipCrypto.encryptWithKey(password, currentCryptoKey);
        localStorage.setItem('chatchip_encrypted_password', JSON.stringify(encrypted));

        showToast('✅ Face ID / Parmak izi başarıyla kaydedildi!', 'success');
        
        // Butonları güncelle
        await checkBiometricSupport();

    } catch (error) {
        console.error('❌ Biyometrik kayıt hatası:', error);
        showToast('❌ Kayıt başarısız: ' + error.message, 'error');
    }
}
// ============================================================
// 🔐 BİYOMETRİK İLE GİRİŞ
// ============================================================

async function loginWithBiometric() {
    try {
        const credentialId = localStorage.getItem('chatchip_credential_id');
        if (!credentialId) {
            showToast('⚠️ Kayıtlı Face ID / Parmak izi bulunamadı!', 'error');
            return;
        }

        showToast('⏳ Face ID / Parmak izi ile doğrulanıyor...', 'info');

        // 🔥 Credential ID'yi Base64 URL-safe'den normal Base64'e çevir
        const base64CredentialId = credentialId.replace(/-/g, '+').replace(/_/g, '/');
        const credentialIdBytes = Uint8Array.from(atob(base64CredentialId), c => c.charCodeAt(0));

        // 1. WebAuthn ile doğrula
        const assertion = await navigator.credentials.get({
            publicKey: {
                challenge: crypto.getRandomValues(new Uint8Array(32)),
                allowCredentials: [{
                    id: credentialIdBytes,
                    type: 'public-key'
                }],
                timeout: 60000,
                userVerification: 'required'
            }
        });

        if (assertion) {
            // 2. Biyometrik başarılı!
            showToast('✅ Face ID / Parmak izi doğrulandı!', 'success');

            // 3. Şifreli veriyi al
            const encryptedData = localStorage.getItem('chatchip_encrypted_password');
            if (!encryptedData) {
                showToast('❌ Şifreli veri bulunamadı!', 'error');
                return;
            }

            // 4. Session'dan şifreyi al
            const savedPassword = localStorage.getItem('user_password');
            
            if (!savedPassword) {
                // Şifre yoksa kullanıcıdan iste
                const { value: password } = await Swal.fire({
                    title: '🔐 Şifrenizi girin',
                    text: 'Face ID ile giriş için şifrenizi girmelisiniz.',
                    input: 'password',
                    inputPlaceholder: 'Şifreniz',
                    showCancelButton: true,
                    confirmButtonText: 'Giriş Yap',
                    cancelButtonText: 'İptal'
                });

                if (!password) {
                    showToast('❌ Giriş iptal edildi', 'error');
                    return;
                }

                // CryptoKey'i türet
                const key = await ChatChipCrypto.deriveKey(password);
                currentCryptoKey = key;
                localStorage.setItem('user_password', password);

                // Şifreyi çöz ve giriş yap
                const decrypted = await ChatChipCrypto.decryptWithKey(JSON.parse(encryptedData), key);
                if (decrypted) {
                    await autoLogin(decrypted);
                } else {
                    showToast('❌ Şifre çözülemedi!', 'error');
                }
            } else {
                // Session'dan şifreyi al
                const key = await ChatChipCrypto.deriveKey(savedPassword);
                currentCryptoKey = key;
                const decrypted = await ChatChipCrypto.decryptWithKey(JSON.parse(encryptedData), key);
                if (decrypted) {
                    await autoLogin(decrypted);
                } else {
                    showToast('❌ Şifre çözülemedi!', 'error');
                }
            }
        }
    } catch (error) {
        console.error('❌ Biyometrik giriş hatası:', error);
        if (error.name === 'NotAllowedError') {
            showToast('❌ Face ID / Parmak izi reddedildi!', 'error');
        } else {
            showToast('❌ Giriş başarısız: ' + error.message, 'error');
        }
    }
}
// ============================================================
// 🔐 OTOMATİK GİRİŞ (Biyometrik sonrası)
// ============================================================

async function autoLogin(password) {
    try {
        const dm = window.DataManager;
        
        // Email'i currentUser'dan al
        const email = currentUser?.email || localStorage.getItem('chatchip_user')?.email;
        if (!email) {
            showToast('❌ Email bilgisi bulunamadı!', 'error');
            return;
        }

        const result = await dm.login(email, password);
        
        if (result.success) {
            currentUser = result.user;
            window.currentUser = result.user;
            
            // CryptoKey'i türet
            if (result.user && result.user.password) {
                currentCryptoKey = await ChatChipCrypto.deriveKey(result.user.password);
                sessionStorage.setItem('user_password', result.user.password);
            }
            
            checkAuth();
            checkPlan();
            loadModels();
            loadSessions();
            closeAllSidebars();
            showToast(`✅ Hoş geldin ${currentUser.name}!`, 'success');
        } else {
            showToast('❌ Otomatik giriş başarısız!', 'error');
        }
    } catch (error) {
        console.error('❌ Otomatik giriş hatası:', error);
        showToast('❌ Otomatik giriş başarısız: ' + error.message, 'error');
    }
}
// ============================================================
// 🔐 OTOMATİK FACE ID / TOUCH ID GİRİŞ (Sayfa yenilenince)
// ============================================================

async function autoLoginWithBiometric() {
    try {
        if (performance.navigation && performance.navigation.type === 1) {
            console.log('🔄 Sayfa yenileme (F5), Face ID atlanıyor');
            return;
        }
        // 🔥 2. 15 DAKİKA KONTROLÜ (YENİ!)
        const lastCloseTime = localStorage.getItem('chatchip_last_close_time');
        const fifteenMinutes = 15 * 60 * 1000; // 15 dakika
        
        if (lastCloseTime) {
            const timeSinceClose = Date.now() - parseInt(lastCloseTime);
            if (timeSinceClose < fifteenMinutes) {
                console.log(`⏰ 15 dakika geçmemiş (${Math.round(timeSinceClose/1000)}s), Face ID atlanıyor`);
                // 7 gün içinde olduğu için direkt giriş yap
                await checkAuth();
                return;
            } else {
                console.log(`✅ 15 dakika geçmiş (${Math.round(timeSinceClose/1000)}s), Face ID gelsin`);
            }
        }
        // 🔥 ÖNCE: Zaten giriş yapılmış mı kontrol et (currentUser var mı?)
        if (currentUser) {
            console.log('✅ Zaten giriş yapılmış, otomatik Face ID gerekmez');
            return;
        }

        // 1. Biyometrik kayıtlı mı kontrol et
        const isRegistered = BiometricAuth.isBiometricRegistered();
        if (!isRegistered) {
            console.log('⚠️ Biyometrik kayıt yok, atlanıyor');
            return;
        }

        // 2. Kullanıcı bilgisi var mı?
        const userData = localStorage.getItem('chatchip_user');
        if (!userData) {
            console.log('⚠️ Kullanıcı verisi yok');
            return;
        }

        const user = JSON.parse(userData);
        if (!user || !user.email) {
            console.log('⚠️ Email bulunamadı');
            return;
        }

        console.log('🔐 Otomatik Face ID ile giriş deneniyor...');

        // 3. Face ID / Touch ID ile doğrula
        const credentialId = localStorage.getItem('chatchip_credential_id');
        if (!credentialId) {
            console.log('⚠️ Credential ID bulunamadı');
            return;
        }

        const base64CredentialId = credentialId.replace(/-/g, '+').replace(/_/g, '/');
        const credentialIdBytes = Uint8Array.from(atob(base64CredentialId), c => c.charCodeAt(0));

        const assertion = await navigator.credentials.get({
            publicKey: {
                challenge: crypto.getRandomValues(new Uint8Array(32)),
                allowCredentials: [{
                    id: credentialIdBytes,
                    type: 'public-key'
                }],
                timeout: 60000,
                userVerification: 'required'
            }
        });

        if (!assertion) {
            console.log('❌ Face ID doğrulaması başarısız');
            return;
        }

        console.log('✅ Face ID doğrulandı!');

        // 4. Şifreli veriyi al
        const encryptedData = localStorage.getItem('chatchip_encrypted_password');
        if (!encryptedData) {
            console.log('❌ Şifreli veri bulunamadı');
            return;
        }

        // 5. Şifreyi session'dan al veya kullanıcıdan iste
        let password = localStorage.getItem('user_password');

        if (!password) {
            if (typeof Swal !== 'undefined') {
                const result = await Swal.fire({
                    title: '🔐 Face ID ile giriş',
                    text: 'Face ID doğrulandı! Lütfen şifrenizi girin.',
                    input: 'password',
                    inputPlaceholder: 'Şifreniz',
                    showCancelButton: true,
                    confirmButtonText: 'Giriş Yap',
                    cancelButtonText: 'İptal',
                    inputValidator: (value) => {
                        if (!value) {
                            return 'Şifre girmelisiniz!';
                        }
                    }
                });

                if (!result.isConfirmed || !result.value) {
                    console.log('❌ Kullanıcı şifre girmeyi iptal etti');
                    return;
                }
                password = result.value;
            } else {
                password = prompt('🔐 Face ID doğrulandı! Şifrenizi girin:');
                if (!password) {
                    console.log('❌ Kullanıcı şifre girmeyi iptal etti');
                    return;
                }
            }
        }

        // 6. CryptoKey'i türet ve şifreyi çöz
        const key = await ChatChipCrypto.deriveKey(password);
        currentCryptoKey = key;
        localStorage.setItem('user_password', password);

        const decrypted = await ChatChipCrypto.decryptWithKey(JSON.parse(encryptedData), key);
        if (!decrypted) {
            console.log('❌ Şifre çözülemedi');
            showToast('❌ Şifre çözülemedi, lütfen tekrar giriş yapın', 'error');
            return;
        }

        // 7. Otomatik giriş yap
        await autoLogin(decrypted);

    } catch (error) {
        console.error('❌ Otomatik Face ID giriş hatası:', error);
    }
}
// ============================================================
// 🔐 FACE ID İLE OTOMATİK GİRİŞ
// ============================================================

async function triggerBiometricLogin() {
    try {
        const credentialId = localStorage.getItem('chatchip_credential_id');
        if (!credentialId) {
            console.log('⚠️ Credential ID bulunamadı');
            return false;
        }

        console.log('🔐 Face ID ile doğrulanıyor...');
        showToast('🔐 Face ID ile doğrulanıyor...', 'info');

        const base64CredentialId = credentialId.replace(/-/g, '+').replace(/_/g, '/');
        const credentialIdBytes = Uint8Array.from(atob(base64CredentialId), c => c.charCodeAt(0));

        const assertion = await navigator.credentials.get({
            publicKey: {
                challenge: crypto.getRandomValues(new Uint8Array(32)),
                allowCredentials: [{
                    id: credentialIdBytes,
                    type: 'public-key'
                }],
                timeout: 60000,
                userVerification: 'required'
            }
        });

        if (!assertion) {
            console.log('❌ Face ID doğrulaması başarısız');
            return false;
        }

        console.log('✅ Face ID doğrulandı!');

        const encryptedData = localStorage.getItem('chatchip_encrypted_password');
        if (!encryptedData) {
            console.log('❌ Şifreli veri bulunamadı');
            return false;
        }

        let password = localStorage.getItem('user_password');

        if (!password) {
            if (typeof Swal !== 'undefined') {
                const result = await Swal.fire({
                    title: '🔐 Şifrenizi girin',
                    text: 'Face ID doğrulandı! Lütfen şifrenizi girin.',
                    input: 'password',
                    inputPlaceholder: 'Şifreniz',
                    showCancelButton: true,
                    confirmButtonText: 'Giriş Yap',
                    cancelButtonText: 'İptal',
                    inputValidator: (value) => {
                        if (!value) {
                            return 'Şifre girmelisiniz!';
                        }
                    }
                });

                if (!result.isConfirmed || !result.value) {
                    console.log('❌ Kullanıcı şifre girmeyi iptal etti');
                    return false;
                }
                password = result.value;
                localStorage.setItem('user_password', password);
            } else {
                password = prompt('🔐 Face ID doğrulandı! Şifrenizi girin:');
                if (!password) {
                    console.log('❌ Kullanıcı şifre girmeyi iptal etti');
                    return false;
                }
                localStorage.setItem('user_password', password);
            }
        }

        const key = await ChatChipCrypto.deriveKey(password);
        currentCryptoKey = key;

        const decrypted = await ChatChipCrypto.decryptWithKey(JSON.parse(encryptedData), key);
        if (!decrypted) {
            console.log('❌ Şifre çözülemedi');
            showToast('❌ Şifre çözülemedi, lütfen tekrar giriş yapın', 'error');
            return false;
        }

        console.log('✅ CryptoKey türetildi, otomatik giriş yapılıyor...');

        // 🔥 OTOMATİK GİRİŞ YAP!
        await autoLogin(decrypted);
        
        return true;

    } catch (error) {
        console.error('❌ Face ID hatası:', error);
        return false;
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
                        font-size:16px;
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
                        background:var(--primary);
                        color:white;
                        font-size:18px;
                    "
                >
                    ➜
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
