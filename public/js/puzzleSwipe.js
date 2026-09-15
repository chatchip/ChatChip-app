// ChatChip Puzzle #71 — empty composer + deliberate upward swipe = one attempt
(() => {
    const API = 'https://chatchip-puzzle-production.up.railway.app/api/puzzle/71/attempt';
    const SWIPE_MIN_PX = 42;
    let startY = null;
    let startX = null;
    let busy = false;

    function formatAttempt(n) { return new Intl.NumberFormat('tr-TR').format(n || 0); }

    function installStyles() {
        if (document.getElementById('chatchip-puzzle-styles')) return;
        const style = document.createElement('style');
        style.id = 'chatchip-puzzle-styles';
        style.textContent = `
            .chatchip-puzzle-result { align-self:flex-start;width:fit-content;max-width:min(92%,560px);margin:7px 0;padding:12px 14px;border-radius:17px;background:rgba(105,205,190,.055);border:1px solid rgba(86,170,158,.12);box-shadow:0 4px 18px rgba(0,0,0,.025);backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);color:inherit;font-size:.96rem;line-height:1.55;overflow-wrap:anywhere; }
            .chatchip-puzzle-result .puzzle-line + .puzzle-line { margin-top:2px; }
            .input-wrapper .chatchip-puzzle-swipe-hint { position:absolute;right:14px;bottom:50px;z-index:1;pointer-events:none;width:22px;height:42px;overflow:visible;opacity:1;transition:opacity .18s ease; }
            .input-wrapper .chatchip-puzzle-swipe-hint.hidden { opacity:0; }
            .input-wrapper .chatchip-puzzle-swipe-hint span { position:absolute;left:4px;bottom:0;font-size:14px;line-height:1;color:var(--text-light);opacity:0;animation:chatchipPuzzleArrow 1.7s ease-out infinite; }
            .input-wrapper .chatchip-puzzle-swipe-hint span:nth-child(2){animation-delay:.55s}.input-wrapper .chatchip-puzzle-swipe-hint span:nth-child(3){animation-delay:1.1s}
            @keyframes chatchipPuzzleArrow { 0%{transform:translateY(0);opacity:0}18%{opacity:.38}70%{opacity:.16}100%{transform:translateY(-27px);opacity:0} }
        `;
        document.head.appendChild(style);
    }

    function showResult(data) {
        const messages = document.getElementById('messages');
        if (!messages) return;
        const bubble = document.createElement('div');
        bubble.className = 'chatchip-puzzle-result';
        [`₿ Bitcoin Puzzle #71 · Ödül: 7.1 BTC`,`Deneme #${formatAttempt(data.attempt)} · ${data.address}`,`Bit farkı: ${data.bit_difference} · ${data.matched ? 'Eşleşme bulundu' : 'Eşleşme yok'}`].forEach(text => {
            const line = document.createElement('div'); line.className = 'puzzle-line'; line.textContent = text; bubble.appendChild(line);
        });
        messages.appendChild(bubble);
        const chatArea = document.getElementById('chatArea');
        if (chatArea) chatArea.scrollTop = chatArea.scrollHeight;
    }

    function createSwipeHint(sendBtn, input) {
        const wrapper = sendBtn.closest('.input-wrapper');
        if (!wrapper) return () => {};
        wrapper.querySelector('.chatchip-puzzle-swipe-hint')?.remove();
        const hint = document.createElement('div');
        hint.className = 'chatchip-puzzle-swipe-hint'; hint.setAttribute('aria-hidden','true');
        hint.innerHTML = '<span>⌃</span><span>⌃</span><span>⌃</span>'; wrapper.appendChild(hint);
        const update = () => hint.classList.toggle('hidden', !!input.value.trim() || busy);
        input.addEventListener('input', update); update(); return update;
    }

    async function runAttempt(updateHint) {
        if (busy) return;
        const token = window.DataManager?.getToken?.();
        if (!token) { window.showToast?.('Puzzle denemesi için önce giriş yapın.','error'); return; }
        busy = true; updateHint?.();
        try {
            const response = await fetch(API,{method:'POST',headers:{Authorization:`Bearer ${token}`}});
            const data = await response.json().catch(() => ({}));
            if (response.status === 429) { window.showToast?.('1 saniyelik bekleme süresi.','info'); return; }
            if (!response.ok || !data.success) throw new Error('Puzzle servisine ulaşılamadı');
            showResult(data);
        } catch (error) {
            console.error('Puzzle #71 attempt error:',error); window.showToast?.('Puzzle denemesi yapılamadı.','error');
        } finally { busy = false; updateHint?.(); }
    }

    function init() {
        const sendBtn = document.getElementById('sendBtn');
        const input = document.getElementById('messageInput');
        if (!sendBtn || !input || sendBtn.dataset.puzzleSwipeReady === '1') return;
        installStyles();
        sendBtn.dataset.puzzleSwipeReady = '1';
        const updateHint = createSwipeHint(sendBtn,input);

        // Puzzle yalnızca input BOŞKEN swipe hareketini dinler.
        // Normal mesaj gönderme akışına, sendMessage'a ve buton stiline hiç dokunmaz.
        sendBtn.addEventListener('pointerdown', event => {
            if (input.value.trim()) { startY = null; startX = null; return; }
            startY = event.clientY; startX = event.clientX;
        }, { passive:true });

        sendBtn.addEventListener('pointerup', event => {
            if (startY === null || input.value.trim()) { startY = null; startX = null; return; }
            const dy = startY - event.clientY;
            const dx = Math.abs((startX ?? event.clientX) - event.clientX);
            startY = null; startX = null;
            if (dy < SWIPE_MIN_PX || dy <= dx) return;
            event.preventDefault();
            event.stopImmediatePropagation();
            runAttempt(updateHint);
        }, true);

        sendBtn.addEventListener('pointercancel', () => { startY = null; startX = null; });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
