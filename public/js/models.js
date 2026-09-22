// ChatChip model + coach selector module
// Isolated so model/coach choices can evolve independently from the chat core.

let availableModels = [];

// ============================================================
// 🔥 MODELLERİ YÜKLE
// ============================================================
async function loadModels() {
    try {
        const dm = window.DataManager;
        const result = await dm.getAvailableModels();
        
        if (result.success && result.models) {
            availableModels = result.models;
            updateModelSelector();
        }
    } catch (error) {
        console.error('Model yükleme hatası:', error);
    }
}

function updateModelSelector() {
    const selector = document.getElementById('modelSelector');
    if (!selector) return;
    
    const currentValue = selector.value;
    selector.innerHTML = '';
    
    availableModels.forEach(model => {
        const option = document.createElement('option');
        option.value = model.version;
        option.textContent = model.label;
        option.disabled = !model.isAvailable;
        selector.appendChild(option);
    });
    
    if (!availableModels.find(m => m.version === currentValue) || currentValue === '') {
        const firstAvailable = availableModels.find(m => m.isAvailable);
        selector.value = firstAvailable ? firstAvailable.version : availableModels[0]?.version || '1.0';
    } else {
        selector.value = currentValue;
    }
    
    localStorage.setItem('chatchip_selected_model', selector.value);
}

// ============================================================
// 🔥 KOÇ DURUMU
// ============================================================
function updateCoachStatus() {
    // Boş, sadece hata vermesin
}

function initModelCoachSelectors() {
    const modelSelector = document.getElementById('modelSelector');
    if (modelSelector) {
        modelSelector.addEventListener('change', function() {
            localStorage.setItem('chatchip_selected_model', this.value);
        });
    }

    const coachSelector = document.getElementById('coachSelector');
    if (coachSelector) {
        coachSelector.addEventListener('change', updateCoachStatus);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initModelCoachSelectors, { once: true });
} else {
    initModelCoachSelectors();
}

window.ChatChipModels = {
    load: loadModels,
    getAvailable: () => [...availableModels],
    updateSelector: updateModelSelector,
    updateCoachStatus
};

window.loadModels = loadModels;
window.updateCoachStatus = updateCoachStatus;
