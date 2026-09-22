// ChatChip authentication module
// Auth state, login/logout and mobile login handling extracted from app.js.

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

window.checkAuth = checkAuth;
window.handleLogin = handleLogin;
window.handleLogout = handleLogout;
