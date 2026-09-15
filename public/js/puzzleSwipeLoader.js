// Loads Puzzle swipe only after the existing ChatChip script chain is initialized.
window.addEventListener('load', () => {
    if (document.querySelector('script[data-chatchip-puzzle-swipe]')) return;
    const script = document.createElement('script');
    script.src = '/js/puzzleSwipe.js';
    script.dataset.chatchipPuzzleSwipe = '1';
    document.head.appendChild(script);
}, { once: true });
