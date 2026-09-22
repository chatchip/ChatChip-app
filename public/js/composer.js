// ChatChip composer/input interactions

function updateAppViewportHeight() {
    const height = window.visualViewport?.height || window.innerHeight;
    document.documentElement.style.setProperty('--app-height', `${height}px`);
}

function initCoreComposer() {
    const input = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const stopBtn = document.getElementById('stopBtn');

    if (sendBtn && typeof window.sendMessage === 'function') {
        sendBtn.addEventListener('click', window.sendMessage);
    }

    if (stopBtn && typeof window.stopMessage === 'function') {
        stopBtn.addEventListener('click', window.stopMessage);
    }

    if (input) {
        input.addEventListener('keydown', event => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                if (typeof window.sendMessage === 'function') {
                    window.sendMessage();
                }
            }
        });

        input.addEventListener('input', () => {
            input.style.height = 'auto';
            input.style.height = input.scrollHeight + 'px';
        });
    }
}

function initViewportHandling() {
    updateAppViewportHeight();

    window.addEventListener('pageshow', () => {
        requestAnimationFrame(() => {
            updateAppViewportHeight();
            setTimeout(updateAppViewportHeight, 150);
        });
    });

    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', updateAppViewportHeight);
    }
}

function initSwipeSend() {
    const swipeSendBtn = document.getElementById('sendBtn');
    const swipeMessageInput = document.getElementById('messageInput');

    if (!swipeSendBtn || !swipeMessageInput) return;

    let startY = 0;
    let currentY = 0;
    let isDraggingSend = false;
    let floatingMessage = null;
    let sendThreshold = 0;
    let swipeJustSent = false;

    function removeFloatingMessage() {
        if (floatingMessage) {
            floatingMessage.remove();
            floatingMessage = null;
        }
    }

    function resetSwipeSend() {
        isDraggingSend = false;

        swipeSendBtn.style.transition =
            'transform 0.25s cubic-bezier(.2,.8,.2,1)';
        swipeSendBtn.style.transform = 'translateY(0) scale(1)';

        swipeMessageInput.style.transition = 'opacity 0.2s ease';
        swipeMessageInput.style.opacity = '1';

        if (floatingMessage) {
            floatingMessage.style.transition =
                'transform 0.25s ease, opacity 0.2s ease';
            floatingMessage.style.transform =
                'translateY(0px) scale(0.96)';
            floatingMessage.style.opacity = '0';
            setTimeout(removeFloatingMessage, 250);
        }
    }

    swipeSendBtn.addEventListener('pointerdown', event => {
        startY = event.clientY;

        const inputWrapper = swipeSendBtn.closest('.input-wrapper');
        if (!inputWrapper) return;

        const buttonRect = swipeSendBtn.getBoundingClientRect();
        const wrapperRect = inputWrapper.getBoundingClientRect();

        sendThreshold = Math.max(1, buttonRect.top - wrapperRect.top);
        currentY = 0;
        isDraggingSend = true;

        swipeSendBtn.setPointerCapture(event.pointerId);
        swipeSendBtn.style.transition = 'none';

        const text = swipeMessageInput.value.trim();
        if (!text) return;

        const inputRect = swipeMessageInput.getBoundingClientRect();

        floatingMessage = document.createElement('div');
        floatingMessage.textContent = text;

        Object.assign(floatingMessage.style, {
            position: 'fixed',
            left: `${inputRect.left}px`,
            top: `${inputRect.top}px`,
            maxWidth: `${inputRect.width}px`,
            padding: '8px 12px',
            borderRadius: '18px',
            background: 'var(--primary)',
            color: '#fff',
            fontSize: '14px',
            lineHeight: '1.4',
            zIndex: '9999',
            pointerEvents: 'none',
            opacity: '0',
            transform: 'translateY(0px) scale(0.96)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)'
        });

        document.body.appendChild(floatingMessage);
    });

    swipeSendBtn.addEventListener('pointermove', event => {
        if (!isDraggingSend) return;

        const distance = event.clientY - startY;
        currentY = Math.min(0, distance);
        currentY = Math.max(currentY, -(sendThreshold + 30));

        const isReadyToSend = Math.abs(currentY) >= sendThreshold;
        const visualOffset = currentY < -6 ? -26 : 0;

        swipeSendBtn.style.transform =
            `translateY(${currentY + visualOffset}px) scale(${isReadyToSend ? 1.08 : 1})`;

        if (floatingMessage) {
            const progress = Math.min(
                Math.abs(currentY) / Math.max(sendThreshold, 1),
                1
            );

            floatingMessage.style.opacity = String(progress);
            floatingMessage.style.transform =
                `translateY(${currentY}px) scale(${0.96 + progress * 0.04})`;
            swipeMessageInput.style.opacity = String(1 - progress);
        }
    });

    swipeSendBtn.addEventListener('click', event => {
        if (swipeJustSent && event.detail !== 0) {
            event.preventDefault();
            event.stopImmediatePropagation();
            swipeJustSent = false;
        }
    }, true);

    swipeSendBtn.addEventListener('pointerup', () => {
        const shouldSend = Math.abs(currentY) >= sendThreshold;

        if (shouldSend && swipeMessageInput.value.trim()) {
            swipeJustSent = true;
            swipeSendBtn.click();

            setTimeout(() => {
                swipeJustSent = false;
            }, 300);
        }

        resetSwipeSend();
    });

    swipeSendBtn.addEventListener('pointercancel', resetSwipeSend);
}

function initSuggestionChips() {
    const messageInput = document.getElementById('messageInput');
    const quickSuggestions = document.getElementById('quickSuggestions');

    document.querySelectorAll('.suggestion-chip').forEach(button => {
        button.addEventListener('click', () => {
            const type = button.dataset.prompt;
            let starterText = '';

            if (type === 'Bir şey araştır') {
                starterText = 'Şunu araştır: ';
            } else if (type === 'Görsel oluştur') {
                starterText = 'Şu görseli oluştur: ';
            } else if (type === 'Kod yaz') {
                starterText = 'Şu konuda kod yaz: ';
            }

            if (!messageInput) return;
            messageInput.value = starterText;
            messageInput.focus();
            messageInput.setSelectionRange(
                messageInput.value.length,
                messageInput.value.length
            );

            if (quickSuggestions) {
                quickSuggestions.classList.add('hidden');
            }
        });
    });
}

function initComposer() {
    initCoreComposer();
    initViewportHandling();
    initSwipeSend();
    initSuggestionChips();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initComposer, { once: true });
} else {
    initComposer();
}

window.ChatChipComposer = {
    init: initComposer,
    updateViewportHeight: updateAppViewportHeight
};

window.updateAppViewportHeight = updateAppViewportHeight;

console.log('⌨️ Chat composer module yüklendi');
