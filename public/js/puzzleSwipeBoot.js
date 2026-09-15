// Puzzle #71 boot entrypoint. Kept separate so index.html remains untouched.
(() => {
    const boot = () => {
        if (document.querySelector('script[data-chatchip-puzzle-swipe]')) return;
        const script = document.createElement('script');
        script.src = '/js/puzzleSwipe.js';
        script.dataset.chatchipPuzzleSwipe = '1';
        document.head.appendChild(script);
    };

    if (document.readyState === 'complete') boot();
    else window.addEventListener('load', boot, { once: true });
})();
