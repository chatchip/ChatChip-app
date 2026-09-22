// ChatChip session/history module
// Extracted from app.js without behavior changes.

// ============================================================
// SOHBET SESSİONLARI
// ============================================================
async function loadSessions() {
    try {
        const appState = window.ChatChipAppState;
        const dm = window.DataManager;
        const result = await dm.getSessions();
        
        if (result.success) {
            appState.setSessions(result.sessions || []);
            renderSessions();
            console.log('📋 Sohbetler yüklendi:', appState.getSessions().length);
        }
    } catch (error) {
        console.error('Sessions yükleme hatası:', error);
    }
}

function renderSessions() {
    const appState = window.ChatChipAppState;
    const sessions = appState.getSessions();
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
        const appState = window.ChatChipAppState;
        console.log("📂 Session yükleniyor:", id);
        const dm = window.DataManager;
        const result = await dm.getSession(id);
        console.log("📦 Session sonucu:", result);
        
        if (result && result.success) {
            appState.setSessionId(id);
            appState.setFirstMessage(false);
            messagesDiv.innerHTML = "";
            let currentCryptoKey = appState.getCryptoKey();
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
            appState.setCryptoKey(currentCryptoKey);
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
                appState.setCryptoKey(currentCryptoKey);
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
        const appState = window.ChatChipAppState;
        const dm = window.DataManager;
        const result = await dm.createSession('Yeni Sohbet');
        
        if (result.success) {
            appState.setSessionId(result.session.id);
            appState.setFirstMessage(true);
            appState.setSessions([
                result.session,
                ...appState.getSessions()
            ]);
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
    const appState = window.ChatChipAppState;
    const newTitle = prompt('Sohbet başlığını girin:', currentTitle);
    if (!newTitle || newTitle.trim().length === 0) return;
    
    try {
        const dm = window.DataManager;
        const result = await dm.updateSession(id, newTitle.trim());
        
        if (result.success) {
            const sessions = appState.getSessions().map(session =>
                session.id === id
                    ? { ...session, title: result.session.title }
                    : session
            );
            appState.setSessions(sessions);
            renderSessions();
            
            if (appState.getSessionId() === id) {
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
        const appState = window.ChatChipAppState;
        const dm = window.DataManager;
        const result = await dm.pinSession(id, !currentState);
        
        if (result.success) {
            const sessions = appState.getSessions().map(session =>
                session.id === id
                    ? { ...session, is_pinned: result.session.is_pinned }
                    : session
            );
            appState.setSessions(sessions);
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
        const appState = window.ChatChipAppState;
        const dm = window.DataManager;
        const result = await dm.deleteSession(id);
        
        if (result.success) {
            appState.setSessions(
                appState.getSessions().filter(session => session.id !== id)
            );
            renderSessions();
            
            if (appState.getSessionId() === id) {
                appState.setSessionId(null);
                appState.setFirstMessage(true);
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

// Global exports used by inline UI handlers.
window.startNewChat = startNewChat;
window.loadSession = loadSession;
window.renameSession = renameSession;
window.togglePin = togglePin;
window.deleteSession = deleteSession;
