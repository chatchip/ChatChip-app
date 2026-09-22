// ChatChip message rendering and lightweight chat UI helpers

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
        }
        return text;
    } catch (e) {
        console.error('Markdown render error:', e);
        return text;
    }
}

function addMessage(text, type, isTemp = false, timestamp = null) {
    const messagesDiv = document.getElementById('messages');
    if (!messagesDiv) return '';

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

        const actions = document.createElement('div');
        actions.className = 'message-actions';
        actions.style.display = 'none';
        actions.innerHTML = `
            <button type="button" class="message-action-btn" data-action="speak" title="Sesli oku" onclick="toggleSpeechPlayback(this)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5 11 5"></polygon>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                </svg>
                <span>Sesli oku</span>
            </button>
            <button type="button" class="message-action-btn" data-action="copy" title="Kopyala" onclick="copyMessage(this)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span>Kopyala</span>
            </button>
            <button type="button" class="message-action-btn" data-action="share" title="Paylaş" onclick="shareMessage(this)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
        const rawText = String(text || '');
        const imageMatch = rawText.match(/!\[.*?\]\((.*?)\)/);

        if (imageMatch) {
            const imageUrl = imageMatch[1];
            const textWithoutImage = rawText.replace(/!\[.*?\]\(.*?\)/, '').trim();
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
            bubble.textContent = rawText || '...';
        }
    }

    const time = document.createElement('span');
    time.className = 'time';
    const date = timestamp ? new Date(timestamp) : new Date();
    time.textContent = date.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit'
    });

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

    let contentDiv = bubble.querySelector('.markdown-body');
    if (!contentDiv) {
        contentDiv = document.createElement('div');
        contentDiv.className = 'markdown-body';
        bubble.prepend(contentDiv);
    }

    contentDiv.innerHTML = renderMarkdown(text);

    const actions = bubble.querySelector('.message-actions');
    const time = bubble.querySelector('.time');
    if (actions) bubble.appendChild(actions);
    if (time) bubble.appendChild(time);

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

function setImageLoadingAnimation(loadingMsgId, text) {
    const wrapper = document.getElementById(loadingMsgId);
    const bubble = wrapper?.querySelector('.bubble');
    if (!bubble) return;

    const markdownBody = document.createElement('div');
    markdownBody.className = 'markdown-body';
    const icon = document.createElement('span');
    icon.className = 'chatchip-loading-icon';
    icon.textContent = '✦';
    const label = document.createElement('span');
    label.textContent = String(text ?? '');
    markdownBody.appendChild(icon);
    markdownBody.appendChild(label);
    bubble.replaceChildren(markdownBody);
}

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

    navigator.clipboard.writeText(text)
        .then(() => showToast('✅ Yanıt kopyalandı!', 'success'))
        .catch(error => {
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
        navigator.share({ title: 'ChatChip AI', text }).catch(error => {
            if (error.name !== 'AbortError') {
                console.error('Paylaşım hatası:', error);
                showToast('❌ Paylaşım başarısız!', 'error');
            }
        });
        return;
    }

    navigator.clipboard.writeText(text)
        .then(() => showToast('📋 Paylaşım desteklenmiyor, yanıt kopyalandı!', 'info'))
        .catch(error => {
            console.error('Kopyalama hatası:', error);
            showToast('❌ Paylaşım başarısız!', 'error');
        });
}

window.ChatChipMessages = {
    renderMarkdown,
    addMessage,
    updateMessageMarkdown,
    setImageLoadingAnimation,
    showToast,
    copyMessage,
    shareMessage
};

window.renderMarkdown = renderMarkdown;
window.addMessage = addMessage;
window.updateMessageMarkdown = updateMessageMarkdown;
window.setImageLoadingAnimation = setImageLoadingAnimation;
window.showToast = showToast;
window.copyMessage = copyMessage;
window.shareMessage = shareMessage;

console.log('💬 Chat message UI module yüklendi');
