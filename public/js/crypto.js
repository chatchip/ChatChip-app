// ============================================================
// 🔐 UÇTAN UCA ŞİFRELEME MODÜLÜ (AES-256-GCM + CryptoKey)
// ============================================================

class ChatChipCrypto {
    // 🔑 Şifreden CryptoKey türet (PBKDF2)
    static async deriveKey(password, salt = 'chatchip_salt') {
        const encoder = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            'PBKDF2',
            false,
            ['deriveKey']
        );
        return await crypto.subtle.deriveKey(
            { 
                name: 'PBKDF2', 
                salt: encoder.encode(salt), 
                iterations: 100000, 
                hash: 'SHA-256' 
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    }

    // 🔐 Ham şifre ile şifrele (eski yöntem, geriye dönük uyumluluk için)
    static async encrypt(message, password) {
        const key = await this.deriveKey(password);
        return await this.encryptWithKey(message, key);
    }

    // 🔓 Ham şifre ile çöz (eski yöntem, geriye dönük uyumluluk için)
    static async decrypt(encryptedData, password) {
        try {
            const key = await this.deriveKey(password);
            return await this.decryptWithKey(encryptedData, key);
        } catch (e) {
            console.error('❌ Şifre çözme hatası:', e);
            return null;
        }
    }

    // 🔐 CryptoKey ile şifrele (YENİ - ÖNERİLEN)
    static async encryptWithKey(message, key) {
        const encoder = new TextEncoder();
        const data = encoder.encode(message);
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            data
        );
        return {
            iv: btoa(String.fromCharCode(...iv)),
            data: btoa(String.fromCharCode(...new Uint8Array(encrypted)))
        };
    }

    // 🔓 CryptoKey ile çöz (YENİ - ÖNERİLEN)
    static async decryptWithKey(encryptedData, key) {
        try {
            const iv = Uint8Array.from(atob(encryptedData.iv), c => c.charCodeAt(0));
            const data = Uint8Array.from(atob(encryptedData.data), c => c.charCodeAt(0));
            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv },
                key,
                data
            );
            return new TextDecoder().decode(decrypted);
        } catch (e) {
            console.error('❌ Şifre çözme hatası (CryptoKey):', e);
            return null;
        }
    }
}

// Global'e ekle
window.ChatChipCrypto = ChatChipCrypto;
console.log('✅ Crypto modülü yüklendi (AES-256-GCM + CryptoKey)');
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
