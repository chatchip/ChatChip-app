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
let currentImageUrl = null;
let previewContainer = null;
let currentCryptoKey = null;  // 🔐 Güvenli şifreleme anahtarı (CryptoKey)

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 App başlatıldı (Model + Koç)');
    checkAuth();
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
    
    // 🔥 Sayfa yenilendiğinde OTOMATİK Face ID ile giriş dene! (YENİ)
    setTimeout(autoLoginWithBiometric, 1500);
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
            console.log('📦 Modeller yüklendi:', availableModels);
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
        
        // 🔥 YENİ: CryptoKey kontrol et, yoksa Face ID ile türet!
        if (!currentCryptoKey) {
            console.log('🔑 CryptoKey yok, Face ID ile türetmeyi dene...');
            const isRegistered = BiometricAuth.isBiometricRegistered();
            if (isRegistered) {
                // Face ID'yi tetikle
                const success = await triggerBiometricLogin();
                if (success) {
                    console.log('✅ Face ID ile CryptoKey türetildi');
                } else {
                    console.log('⚠️ Face ID başarısız, normal giriş gösteriliyor');
                    if (loginForm) loginForm.style.display = 'block';
                    if (userMenu) userMenu.style.display = 'none';
                    return;
                }
            } else {
                console.log('⚠️ Biyometrik kayıt yok, normal giriş gösteriliyor');
                if (loginForm) loginForm.style.display = 'block';
                if (userMenu) userMenu.style.display = 'none';
                return;
            }
        }
        
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
        
        checkAuth();
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
        checkAuth();
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

// ============================================================
// 🎨 GÖRSEL ÜRETİM FONKSİYONU (sendMessage DIŞINDA)
// ============================================================
async function generateAndShowImage(prompt, originalText) {
    console.log(`🎨 Görsel üretiliyor: "${prompt}"`);
    
    const loadingMsgId = addMessage(`🎨 "${originalText || prompt}" görseli üretiliyor...`, 'bot', true);
    
    try {
        const dm = window.DataManager;
        const token = dm.getToken();
        
        if (!token) {
            updateMessageMarkdown(loadingMsgId, '❌ Lütfen önce giriş yapın!');
            return;
        }

        if (currentPlan && currentPlan.isExpired) {
            updateMessageMarkdown(loadingMsgId, '⛔ Planınız sona erdi! Görsel üretimi için plan satın alın.');
            return;
        }

        const response = await fetch('https://chatchip-production.up.railway.app/api/image/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ prompt: prompt })
        });

        const data = await response.json();
        console.log('📥 Görsel yanıtı:', data);

        if (data.success && data.imageUrl) {
            let imageSrc = '';
            
            if (typeof data.imageUrl === 'string') {
                imageSrc = data.imageUrl;
            } else if (typeof data.imageUrl === 'object' && data.imageUrl !== null) {
                // 🔥 TÜM OLASI DURUMLARI KONTROL ET
                if (data.imageUrl.image_url && typeof data.imageUrl.image_url === 'object') {
                    // image_url objesi içinde url var
                    imageSrc = data.imageUrl.image_url.url || '';
                    console.log('🔧 image_url objesinden url çekildi');
                } else if (data.imageUrl.image_url && typeof data.imageUrl.image_url === 'string') {
                    imageSrc = data.imageUrl.image_url;
                    console.log('🔧 image_url string olarak çekildi');
                } else {
                    imageSrc = data.imageUrl.url || data.imageUrl.output || data.imageUrl.data || Object.values(data.imageUrl)[0] || '';
                    console.log('🔧 diğer alanlardan çekildi');
                }
                console.log('📸 imageSrc ilk 100 karakter:', imageSrc?.substring(0, 100));
            }

            if (!imageSrc) {
                console.error('❌ Görsel adresi alınamadı! data.imageUrl:', data.imageUrl);
                updateMessageMarkdown(loadingMsgId, '❌ Görsel adresi alınamadı!');
                showToast('❌ Görsel adresi alınamadı', 'error');
                return;
            }

            // Görsel gösterimi
            let imageHtml = '';
            if (imageSrc.startsWith('data:image')) {
                imageHtml = `<img src="${imageSrc}" alt="${prompt}" style="max-width:100%; max-height:400px; border-radius:12px; margin:6px 0; border:1px solid var(--border); object-fit:contain;" />`;
            } else if (imageSrc.startsWith('http')) {
                imageHtml = `<img src="${imageSrc}" alt="${prompt}" style="max-width:100%; max-height:400px; border-radius:12px; margin:6px 0; border:1px solid var(--border); object-fit:contain;" />`;
            } else {
                imageHtml = `<pre style="white-space:pre-wrap;word-break:break-all;font-size:0.7rem;background:rgba(0,0,0,0.05);padding:8px;border-radius:6px;">${imageSrc}</pre>`;
            }
            
            const resultText = `🖼️ **${prompt}**\n\n${imageHtml}\n\n✨ Görsel başarıyla oluşturuldu!`;
            updateMessageMarkdown(loadingMsgId, resultText);
            showToast('✅ Görsel oluşturuldu!', 'success');
        } else {
            updateMessageMarkdown(loadingMsgId, '❌ Görsel üretilemedi: ' + (data.error || 'Bilinmeyen hata'));
            showToast('❌ Görsel üretilemedi', 'error');
        }
    } catch (error) {
        console.error('Görsel üretim hatası:', error);
        updateMessageMarkdown(loadingMsgId, '❌ Hata: ' + error.message);
        showToast('❌ Görsel üretim hatası', 'error');
    }
}
// ============================================================
// 🔥 SEND MESSAGE
// ============================================================
async function sendMessage() {
    const text = input.value.trim();
    console.log('🔴 sendMessage çalıştı! text:', text);  // ← BURAYA EKLE!
    
    if (!text && !currentImageUrl) return;
    if (isProcessing) return;
    // ============================================================
// 🔥 GÖRSEL ÜRETİM KONTROLÜ
// ============================================================
const imageKeywords = ['resim', 'fotoğraf', 'görsel', 'çiz', 'yap', 'oluştur', 'üret', 'draw', 'image', 'photo', 'picture', 'generate', 'manzara', 'kedi', 'köpek', 'portre', 'karikatür', 'çizim'];
const isImageRequest = imageKeywords.some(k => text.toLowerCase().includes(k));

// Soru değilse ve görsel anahtar kelime varsa
const isQuestion = text.includes('?') || text.includes('nasıl') || text.includes('nedir') || text.includes('ne') || text.includes('kim') || text.includes('nerede') || text.includes('niye');

if (isImageRequest && !isQuestion) {
    let cleanPrompt = text.replace(/resim|fotoğraf|göster|yap|oluştur|üret|çiz|çek|make|create|generate|draw|portre|karikatür|lütfen|rica|bana|bir|tane/gi, '').trim();
    if (!cleanPrompt || cleanPrompt.length < 2) {
        cleanPrompt = text;
    }

    addMessage(text, 'user');
    input.value = '';
    input.style.height = 'auto';
    clearImagePreview();

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

    // 🔥 Gizli görsel URL'sini mesaja ekle (kullanıcı görmesin)
    let fullMessage = text || '📷 Görsel';
    if (currentImageUrl) {
        fullMessage = `![Görsel](${currentImageUrl})\n${text || ''}`;
    }

    addMessage(fullMessage, 'user');
    input.value = '';
    input.style.height = 'auto';
    clearImagePreview();

    const botMsgId = addMessage('', 'bot', true);
    const systemPrompt = localStorage.getItem('chatchip_system_prompt') || '';

    try {
    const dm = window.DataManager;

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
        time.textContent = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    } else {
        time.textContent = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    }

    bubble.appendChild(time);
    wrapper.appendChild(bubble);
    messagesDiv.appendChild(wrapper);
    chatArea.scrollTop = chatArea.scrollHeight;

    return wrapper.id;
}

function updateMessageMarkdown(id, text) {
    const wrapper = document.getElementById(id);
    if (!wrapper) return;
    const bubble = wrapper.querySelector('.bubble');
    if (bubble) {
        bubble.innerHTML = '';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'markdown-body';
        contentDiv.innerHTML = renderMarkdown(text);
        bubble.appendChild(contentDiv);
        
        const time = document.createElement('span');
        time.className = 'time';
        time.textContent = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        bubble.appendChild(time);
    }
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

    if (file.size > 5 * 1024 * 1024) {
        alert('❌ Dosya çok büyük! Maksimum 5MB.');
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
            currentImageUrl = data.fileUrl;
            
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
    if (previewContainer) {
        previewContainer.remove();
        previewContainer = null;
    }
    currentImageUrl = null;
    
    const input = document.getElementById('messageInput');
    if (input) {
        input.value = '';
        input.placeholder = 'Mesajını yaz...';
    }
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



// Mevcut loadSystemPrompt ve saveSystemPrompt fonksiyonlarını güncelle
// (Zaten var, sadece panel için uyumlu)

// ============================================================
// 📝 SİSTEM PROMPTU PANELİ
// ============================================================



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

function speakText(text) {
    stopSpeaking();
    
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
        updateSpeechButton(true);
        showToast('🔊 Sesli yanıt başladı...', 'info');
    };
    
    utterance.onend = function() {
        isSpeaking = false;
        updateSpeechButton(false);
        showToast('✅ Sesli yanıt tamamlandı!', 'success');
    };
    
    utterance.onerror = function(event) {
        console.error('Speech error:', event);
        isSpeaking = false;
        updateSpeechButton(false);
        showToast('❌ Ses oynatma hatası!', 'error');
    };
    
    currentUtterance = utterance;
    speechSynthesis.speak(utterance);
}

function stopSpeaking() {
    if (speechSynthesis) {
        speechSynthesis.cancel();
    }
    isSpeaking = false;
    currentUtterance = null;
    updateSpeechButton(false);
}

function toggleSpeechPlayback() {
    if (isSpeaking) {
        stopSpeaking();
    } else {
        const messages = document.querySelectorAll('.message.bot .bubble .markdown-body');
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            const text = lastMessage.textContent || lastMessage.innerText;
            if (text && text.trim().length > 0) {
                speakText(text);
            } else {
                showToast('⚠️ Okunacak metin yok!', 'info');
            }
        } else {
            showToast('⚠️ Hiç mesaj yok!', 'info');
        }
    }
}

function updateSpeechButton(isActive) {
    const speechBtn = document.getElementById('speechPlayBtn');
    if (!speechBtn) return;
    
    if (isActive) {
        speechBtn.style.color = '#EF4444';
        speechBtn.style.background = 'rgba(239, 68, 68, 0.1)';
        speechBtn.style.borderRadius = '50%';
        speechBtn.style.padding = '4px';
        speechBtn.title = 'Konuşmayı durdur';
    } else {
        speechBtn.style.color = '';
        speechBtn.style.background = '';
        speechBtn.style.borderRadius = '';
        speechBtn.style.padding = '';
        speechBtn.title = 'Sesli Oku';
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
    
    // Sesli okuma butonu
    const speechPlayBtn = document.getElementById('speechPlayBtn');
    if (speechPlayBtn) {
        const newBtn = speechPlayBtn.cloneNode(true);
        speechPlayBtn.parentNode.replaceChild(newBtn, speechPlayBtn);
        newBtn.addEventListener('click', toggleSpeechPlayback);
        console.log('🔊 Sesli okuma butonu hazır');
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
            const savedPassword = sessionStorage.getItem('user_password');
            
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
                sessionStorage.setItem('user_password', password);

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
        let password = sessionStorage.getItem('user_password');

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
        sessionStorage.setItem('user_password', password);

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

        let password = sessionStorage.getItem('user_password');

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
                sessionStorage.setItem('user_password', password);
            } else {
                password = prompt('🔐 Face ID doğrulandı! Şifrenizi girin:');
                if (!password) {
                    console.log('❌ Kullanıcı şifre girmeyi iptal etti');
                    return false;
                }
                sessionStorage.setItem('user_password', password);
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
