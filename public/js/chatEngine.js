// ChatChip normal chat pipeline
// Orchestrates normal text chat. DataManager remains the backend/API access layer.

async function ensureCryptoKey(getCryptoKey, setCryptoKey) {
    let cryptoKey = getCryptoKey();

    if (cryptoKey) return cryptoKey;

    const savedJwk = localStorage.getItem('chatchip_crypto_key_jwk');
    if (!savedJwk) return null;

    try {
        cryptoKey = await window.crypto.subtle.importKey(
            'jwk',
            JSON.parse(savedJwk),
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
        );
        setCryptoKey(cryptoKey);
        console.log('✅ CryptoKey tekrar yüklendi');
        return cryptoKey;
    } catch (error) {
        console.error('❌ CryptoKey yüklenemedi:', error);
        return null;
    }
}

function collectHistory(limit = 15) {
    const historyMessages = [];
    const messageElements = document.querySelectorAll('#messages .message');
    const startIndex = Math.max(0, messageElements.length - limit);

    for (let i = startIndex; i < messageElements.length; i++) {
        const element = messageElements[i];
        const role = element.classList.contains('user') ? 'user' : 'assistant';
        const content =
            element.querySelector('.bubble .markdown-body')?.textContent ||
            element.querySelector('.bubble')?.textContent ||
            '';

        if (content && content.trim()) {
            historyMessages.push({
                role,
                content: content.trim()
            });
        }
    }

    return historyMessages;
}

async function ensureSession(text, context) {
    const dm = window.DataManager;
    let sessionId = context.getSessionId();

    if (!sessionId) {
        const title = text.length > 30 ? text.substring(0, 30) + '...' : text;
        const result = await dm.createSession(title);

        if (!result.success) {
            context.showToast('❌ Sohbet oluşturulamadı', 'error');
            return null;
        }

        sessionId = result.session.id;
        context.setSessionId(sessionId);
        context.setFirstMessage(false);

        context.setSessions([
            result.session,
            ...context.getSessions()
        ]);
        context.renderSessions();

        const pageTitle = document.querySelector('.page-title');
        if (pageTitle) {
            pageTitle.textContent = '💬 ' + result.session.title;
        }

        return sessionId;
    }

    if (context.getFirstMessage()) {
        const sessions = context.getSessions();
        const session = sessions.find(item => item.id === sessionId);

        if (session && (session.title === 'Yeni Sohbet' || !session.title)) {
            const newTitle = text.length > 30
                ? text.substring(0, 30) + '...'
                : text;

            try {
                const result = await dm.updateSession(sessionId, newTitle);

                if (result.success) {
                    context.setSessions(
                        context.getSessions().map(item =>
                            item.id === sessionId
                                ? { ...item, title: result.session.title }
                                : item
                        )
                    );
                    context.renderSessions();

                    const pageTitle = document.querySelector('.page-title');
                    if (pageTitle) {
                        pageTitle.textContent = '💬 ' + result.session.title;
                    }
                }
            } catch (error) {
                console.error('Başlık güncelleme hatası:', error);
            }
        }

        context.setFirstMessage(false);
    }

    return sessionId;
}

function setBusy(context, busy, controller = null) {
    context.setProcessing(busy);
    context.setAbortController(controller);

    context.sendBtn.style.display = busy ? 'none' : 'flex';
    context.stopBtn.style.display = busy ? 'flex' : 'none';
    context.input.disabled = busy;
}

async function runNormalChat(text, context) {
    if (!context.getCurrentUser()) {
        context.showToast('⚠️ Lütfen önce giriş yapın!', 'error');
        return;
    }

    const currentPlan = context.getCurrentPlan();
    if (currentPlan && currentPlan.isExpired) {
        context.showToast('⛔ Planınız sona erdi! Sohbet botu devre dışı.', 'error');
        return;
    }

    const modelSelector = document.getElementById('modelSelector');
    const selectedModel = modelSelector ? modelSelector.value : '1.0';
    localStorage.setItem('chatchip_selected_model', selectedModel);

    const coachSelector = document.getElementById('coachSelector');
    const selectedCoach = coachSelector ? coachSelector.value : 'standard';

    console.log(`🎯 Model: ${selectedModel}, Koç: ${selectedCoach}`);

    const sessionId = await ensureSession(text, context);
    if (!sessionId) return;

    const controller = new AbortController();
    setBusy(context, true, controller);

    const fullMessage = text || '';
    context.addMessage(fullMessage, 'user');

    context.input.value = '';
    context.input.style.height = 'auto';
    context.removeImagePreviewUI();

    const botMsgId = context.addMessage('', 'bot', true);
    const systemPrompt = localStorage.getItem('chatchip_system_prompt') || '';
    const dm = window.DataManager;

    try {
        const cryptoKey = await ensureCryptoKey(
            context.getCryptoKey,
            context.setCryptoKey
        );

        if (!cryptoKey) {
            console.warn('⚠️ CryptoKey bulunamadı, mesaj şifrelenmeden gönderilmiyor');
            context.showToast(
                '⚠️ Güvenlik anahtarı bulunamadı, lütfen tekrar giriş yapın',
                'error'
            );
            setBusy(context, false, null);
            return;
        }

        try {
            const encrypted = await ChatChipCrypto.encryptWithKey(
                fullMessage,
                cryptoKey
            );

            await dm.saveEncryptedMessage(
                encrypted.data,
                encrypted.iv,
                sessionId
            );

            console.log('✅ Kullanıcı mesajı şifreli olarak kaydedildi (CryptoKey)');
        } catch (encryptError) {
            console.error('❌ Şifreleme hatası:', encryptError);
            context.showToast(
                '⚠️ Mesaj şifrelenirken hata oluştu',
                'warning'
            );
        }

        const historyMessages = collectHistory(15);
        console.log('📜 Geçmiş mesajlar:', historyMessages.length);

        const response = await dm.sendMessage(
            fullMessage,
            selectedCoach,
            systemPrompt,
            sessionId,
            controller.signal,
            historyMessages
        );

        if (!response.ok) {
            const errorData = await response.json();

            if (errorData.code === 'PLAN_REQUIRED') {
                context.showToast('⚠️ ' + errorData.error, 'error');
                context.updateMessageMarkdown(
                    botMsgId,
                    '⚠️ ' + errorData.error +
                    '\n\n[Plan satın almak için tıklayın](/pricing.html)'
                );
                setBusy(context, false, null);
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
                if (!line.startsWith('data: ')) continue;

                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                    const json = JSON.parse(data);

                    if (json.chunk) {
                        fullText += json.chunk;
                        context.updateMessageMarkdown(botMsgId, fullText);
                    }

                    if (json.sessionId) {
                        context.setSessionId(json.sessionId);
                        setTimeout(context.loadSessions, 1000);
                    }
                } catch (_) {}
            }
        }

        const botMessage = document.getElementById(botMsgId);
        const actions = botMessage?.querySelector('.message-actions');
        if (actions) {
            actions.style.display = 'flex';
        }

        if (fullText) {
            try {
                const activeCryptoKey = context.getCryptoKey();

                if (activeCryptoKey) {
                    const encryptedResponse =
                        await ChatChipCrypto.encryptWithKey(
                            fullText,
                            activeCryptoKey
                        );

                    await dm.saveEncryptedMessage(
                        encryptedResponse.data,
                        encryptedResponse.iv,
                        context.getSessionId(),
                        true
                    );

                    console.log('✅ AI yanıtı şifreli olarak kaydedildi (CryptoKey)');
                }
            } catch (encryptError) {
                console.error(
                    '❌ AI yanıtı şifreleme hatası:',
                    encryptError
                );
            }
        } else {
            context.updateMessageMarkdown(
                botMsgId,
                '⚠️ Yanıt alınamadı.'
            );
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            context.updateMessageMarkdown(
                botMsgId,
                '⏹️ Yanıt durduruldu.'
            );
            context.showToast('⏹️ Yanıt durduruldu', 'info');
        } else {
            console.error('❌ Chat error:', error);
            context.updateMessageMarkdown(
                botMsgId,
                '❌ Hata: ' + error.message
            );
            context.showToast(
                '❌ Bir hata oluştu: ' + error.message,
                'error'
            );
        }
    } finally {
        setBusy(context, false, null);
        context.clearCurrentImage();
        context.chatArea.scrollTop = context.chatArea.scrollHeight;
    }
}

window.ChatChipChatEngine = {
    run: runNormalChat,
    collectHistory
};

console.log('🧠 Chat engine yüklendi');
