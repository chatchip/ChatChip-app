// ChatChip voice module
// Speech recognition + text-to-speech extracted from app.js without behavior changes.

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
