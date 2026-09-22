// Loads optional ChatChip modules only after the existing script chain is initialized.
window.addEventListener('load', () => {
    if (!document.querySelector('script[data-chatchip-puzzle-swipe]')) {
        const puzzleScript = document.createElement('script');
        puzzleScript.src = '/js/puzzleSwipe.js';
        puzzleScript.dataset.chatchipPuzzleSwipe = '1';
        document.head.appendChild(puzzleScript);
    }

    if (!document.querySelector('script[data-chatchip-integrations]')) {
        const integrationsScript = document.createElement('script');
        integrationsScript.src = '/js/integrations.js?v=20260922-hotfix2';
        integrationsScript.dataset.chatchipIntegrations = '1';
        document.head.appendChild(integrationsScript);
    }
}, { once: true });
