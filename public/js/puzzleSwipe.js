// ChatChip Puzzle #71 — one deliberate upward swipe = one attempt
(() => {
    const API = 'https://chatchip-puzzle-production.up.railway.app/api/puzzle/71/attempt';
    const SWIPE_MIN_PX = 42;
    let startY = null;
    let busy = false;

    function formatAttempt(n) {
        return new Intl.NumberFormat('tr-TR').format(n || 0);
    }

    function showResult(data) {
        if (typeof window.addMessage !== 'function') return;
        const text = `₿ Bitcoin Puzzle #71 · Ödül: 7.1 BTC\nDeneme #${formatAttempt(data.attempt)} · ${data.address}\nBit farkı: ${data.bit_difference} · ${data.matched ? 'Eşleşme bulundu' : 'Eşleşme yok'}`;
        window.addMessage(text, 'bot');
        const chatArea = document.getElementById('chatArea');
        if (chatArea) chatArea.scrollTop = chatArea.scrollHeight;
    }

    async function runAttempt() {
        if (busy) return;
        const input = document.getElementById('messageInput');
        const token = window.DataManager?.getToken?.();

        if (!token) {
            window.showToast?.('Puzzle denemesi için önce giriş yapın.', 'error');
            return;
        }

        busy = true;
        try {
            const response = await fetch(API, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json().catch(() => ({}));
            if (response.status === 429) {
                window.showToast?.('1 saniyelik bekleme süresi.', 'info');
                return;
            }
            if (!response.ok || !data.success) throw new Error('Puzzle servisine ulaşılamadı');
            showResult(data);
        } catch (error) {
            console.error('Puzzle #71 attempt error:', error);
            window.showToast?.('Puzzle denemesi yapılamadı.', 'error');
        } finally {
            busy = false;
            if (input) input.focus();
        }
    }

    function init() {
        const sendBtn = document.getElementById('sendBtn');
        const input = document.getElementById('messageInput');
        if (!sendBtn || !input || sendBtn.dataset.puzzleSwipeReady === '1') return;

        sendBtn.dataset.puzzleSwipeReady = '1';
        sendBtn.style.touchAction = 'none';

        sendBtn.addEventListener('pointerdown', (event) => {
            startY = event.clientY;
        });

        sendBtn.addEventListener('pointerup', (event) => {
            if (startY === null) return;
            const distance = startY - event.clientY;
            startY = null;
            if (distance < SWIPE_MIN_PX) return;

            event.preventDefault();
            event.stopImmediatePropagation();

            if (input.value.trim()) {
                window.sendMessage?.();
                return;
            }

            runAttempt();
        }, true);

        sendBtn.addEventListener('pointercancel', () => {
            startY = null;
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
