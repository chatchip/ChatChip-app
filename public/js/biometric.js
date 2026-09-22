// ChatChip biometric authentication module
// Contains WebAuthn capability detection and biometric login/register flows.

// ============================================================
// 🔐 BİYOMETRİK (Face ID / Parmak İzi) DESTEĞİ
// ============================================================

class BiometricAuth {
    // ✅ WebAuthn desteği var mı?
    static isSupported() {
        return window.PublicKeyCredential !== undefined &&
               typeof window.PublicKeyCredential === 'function';
    }

    // ✅ Platform Authenticator (Face ID / Touch ID) destekleniyor mu?
    static async isPlatformAuthenticatorAvailable() {
        if (!this.isSupported()) return false;
        try {
            return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        } catch {
            return false;
        }
    }

    // 🔍 Biyometrik kayıtlı mı kontrol et
    static isBiometricRegistered() {
        return localStorage.getItem('chatchip_biometric_enabled') === 'true' &&
               localStorage.getItem('chatchip_credential_id') !== null;
    }

    // 🗑️ Biyometrik kaydı sil
    static clearBiometricRegistration() {
        localStorage.removeItem('chatchip_biometric_enabled');
        localStorage.removeItem('chatchip_credential_id');
        localStorage.removeItem('chatchip_encrypted_password');
        console.log('🗑️ Biyometrik kayıt silindi');
    }
}

// Global'e ekle
window.BiometricAuth = BiometricAuth;
console.log('✅ Biyometrik modülü yüklendi');

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

