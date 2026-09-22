// ChatChip session/history module
// Extracted from app.js without behavior changes.

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

// Global exports used by inline UI handlers.
window.startNewChat = startNewChat;
window.loadSession = loadSession;
window.renameSession = renameSession;
window.togglePin = togglePin;
window.deleteSession = deleteSession;
