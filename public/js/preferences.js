// ChatChip personalization + lightweight UI helpers
// Kept separate from the core chat engine.

function loadSystemPrompt() {
    const saved = localStorage.getItem("chatchip_system_prompt");
    const input = document.getElementById("systemPromptInput");
    if (saved && input) {
        input.value = saved;
    }
}

function saveSystemPrompt() {
    const input = document.getElementById("systemPromptInput");
    if (!input) return;

    const prompt = input.value;
    localStorage.setItem("chatchip_system_prompt", prompt);
    showToast("✅ Sistem promptu kaydedildi!", "success");

    if (typeof closePromptPanel === "function") {
        closePromptPanel();
    }
}

function searchChats() {
    const input = document.getElementById('searchChatInput');
    if (!input) return;

    const query = input.value.toLowerCase();
    const items = document.querySelectorAll('.history-item');

    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(query) ? 'flex' : 'none';
    });
}

window.ChatChipPreferences = {
    loadSystemPrompt,
    saveSystemPrompt,
    searchChats
};

window.loadSystemPrompt = loadSystemPrompt;
window.saveSystemPrompt = saveSystemPrompt;
window.searchChats = searchChats;
