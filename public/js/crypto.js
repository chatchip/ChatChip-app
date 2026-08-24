// ============================================================
// 🔐 UÇTAN UCA ŞİFRELEME MODÜLÜ (AES-256-GCM)
// ============================================================

class ChatChipCrypto {
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
            { name: 'PBKDF2', salt: encoder.encode(salt), iterations: 100000, hash: 'SHA-256' },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    }

    static async encrypt(message, password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(message);
        const key = await this.deriveKey(password);
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, data);
        return {
            iv: btoa(String.fromCharCode(...iv)),
            data: btoa(String.fromCharCode(...new Uint8Array(encrypted)))
        };
    }

    static async decrypt(encryptedData, password) {
        try {
            const iv = Uint8Array.from(atob(encryptedData.iv), c => c.charCodeAt(0));
            const data = Uint8Array.from(atob(encryptedData.data), c => c.charCodeAt(0));
            const key = await this.deriveKey(password);
            const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, data);
            return new TextDecoder().decode(decrypted);
        } catch (e) {
            console.error('❌ Şifre çözme hatası:', e);
            return null;
        }
    }
}

window.ChatChipCrypto = ChatChipCrypto;
console.log('✅ Crypto modülü yüklendi (AES-256-GCM)');
