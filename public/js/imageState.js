// ChatChip active image state + upload preview module
// Keeps temporary image state in memory only. Do not persist active edit state in localStorage.

let currentImageUrl = null;
let previewContainer = null;

function getCurrentImage() {
    return currentImageUrl;
}

function setCurrentImage(imageUrl) {
    currentImageUrl = imageUrl || null;
    return currentImageUrl;
}

function consumeCurrentImage() {
    const imageUrl = currentImageUrl;
    clearCurrentImage();
    return imageUrl;
}

function showImagePreview(imageUrl) {
    setCurrentImage(imageUrl);

    if (previewContainer) {
        previewContainer.remove();
        previewContainer = null;
    }

    previewContainer = document.createElement('div');
    previewContainer.className = 'image-preview-container';
    previewContainer.style.cssText = `
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
        background: var(--bg-secondary);
        border: 1px solid var(--border);
        border-radius: 8px;
        margin-bottom: 6px;
        animation: fadeIn 0.3s ease;
    `;

    const img = document.createElement('img');
    img.src = imageUrl;
    img.style.cssText = `
        width: 60px;
        height: 60px;
        object-fit: cover;
        border-radius: 6px;
        border: 1px solid var(--border);
    `;

    const info = document.createElement('span');
    info.className = 'info';
    info.textContent = '📷 Görsel eklendi';
    info.style.cssText = `
        font-size: 0.8rem;
        color: var(--text-light);
        flex: 1;
    `;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = '✕';
    removeBtn.style.cssText = `
        background: none;
        border: none;
        color: var(--text-light);
        cursor: pointer;
        font-size: 1rem;
        padding: 4px 8px;
        border-radius: 4px;
        transition: all 0.2s;
    `;

    removeBtn.onmouseover = function() {
        this.style.background = 'rgba(239, 68, 68, 0.1)';
        this.style.color = '#EF4444';
    };

    removeBtn.onmouseout = function() {
        this.style.background = 'none';
        this.style.color = 'var(--text-light)';
    };

    removeBtn.onclick = function() {
        clearImagePreview();
        if (typeof showToast === 'function') {
            showToast('📷 Görsel kaldırıldı', 'info');
        }
    };

    previewContainer.appendChild(img);
    previewContainer.appendChild(info);
    previewContainer.appendChild(removeBtn);

    const inputWrapper = document.querySelector('.input-wrapper');
    if (inputWrapper?.parentNode) {
        inputWrapper.parentNode.insertBefore(previewContainer, inputWrapper);
    }
}

function removeImagePreviewUI() {
    if (previewContainer) {
        previewContainer.remove();
        previewContainer = null;
    }

    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.placeholder = 'Mesajını yaz...';
    }
}

function clearCurrentImage() {
    currentImageUrl = null;
    localStorage.removeItem('chatchip_current_image_url');
    removeImagePreviewUI();
    console.log('🗑️ Görsel temizlendi');
}

function clearImagePreview() {
    clearCurrentImage();

    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.value = '';
    }

    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.placeholder = 'Mesajınızı yazın...';
    }

    console.log('🗑️ Görsel preview temizlendi');
}

function initImageUploadControls() {
    const fileUploadBtn = document.getElementById('fileUploadBtn');
    const fileInput = document.getElementById('fileInput');

    if (fileUploadBtn && typeof openFileUpload === 'function') {
        fileUploadBtn.addEventListener('click', openFileUpload);
        console.log('📎 Dosya yükleme butonu hazır');
    }

    if (fileInput && typeof handleFileUpload === 'function') {
        fileInput.addEventListener('change', handleFileUpload);
        console.log('📎 Dosya input hazır');
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initImageUploadControls, { once: true });
} else {
    initImageUploadControls();
}

window.ChatChipImageState = {
    getCurrent: getCurrentImage,
    setCurrent: setCurrentImage,
    consumeCurrent: consumeCurrentImage,
    showPreview: showImagePreview,
    clear: clearCurrentImage,
    clearPreview: clearImagePreview,
    removePreviewUI: removeImagePreviewUI
};

window.showImagePreview = showImagePreview;
window.clearImagePreview = clearImagePreview;
window.removeImagePreviewUI = removeImagePreviewUI;
window.clearCurrentImage = clearCurrentImage;
