// ChatChip image upload module
// Keeps the existing upload flow, but reduces large images in the browser before upload.
// The backend remains the final image processor.

const IMAGE_UPLOAD_MAX_DIMENSION = 1600;
const IMAGE_UPLOAD_JPEG_QUALITY = 0.82;
const IMAGE_UPLOAD_COMPRESS_THRESHOLD = 1024 * 1024;

function openFileUpload() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.click();
}

function loadImageForUpload(file) {
    return new Promise((resolve, reject) => {
        const objectUrl = URL.createObjectURL(file);
        const image = new Image();

        image.onload = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(image);
        };

        image.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Görsel tarayıcıda açılamadı'));
        };

        image.src = objectUrl;
    });
}

async function optimizeImageForUpload(file) {
    const supportedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

    // Unknown/animated/special formats are sent unchanged; backend keeps handling them.
    if (!supportedTypes.has(file.type)) return file;

    try {
        const image = await loadImageForUpload(file);
        const width = image.naturalWidth || image.width;
        const height = image.naturalHeight || image.height;
        const largestSide = Math.max(width, height);

        const needsResize = largestSide > IMAGE_UPLOAD_MAX_DIMENSION;
        const needsCompression = file.size > IMAGE_UPLOAD_COMPRESS_THRESHOLD;

        if (!needsResize && !needsCompression) return file;

        const scale = needsResize ? IMAGE_UPLOAD_MAX_DIMENSION / largestSide : 1;
        const targetWidth = Math.max(1, Math.round(width * scale));
        const targetHeight = Math.max(1, Math.round(height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const context = canvas.getContext('2d', { alpha: false });
        if (!context) return file;

        // JPEG has no alpha channel, so transparent pixels should not become black.
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, targetWidth, targetHeight);
        context.drawImage(image, 0, 0, targetWidth, targetHeight);

        const blob = await new Promise(resolve => {
            canvas.toBlob(resolve, 'image/jpeg', IMAGE_UPLOAD_JPEG_QUALITY);
        });

        if (!blob || blob.size >= file.size) return file;

        const baseName = (file.name || 'image').replace(/\.[^.]+$/, '');
        const optimized = new File([blob], `${baseName}.jpg`, {
            type: 'image/jpeg',
            lastModified: Date.now()
        });

        console.log(
            `📦 Görsel optimize edildi: ${(file.size / 1024 / 1024).toFixed(2)} MB → ${(optimized.size / 1024 / 1024).toFixed(2)} MB`
        );

        return optimized;
    } catch (error) {
        console.warn('⚠️ Görsel tarayıcıda optimize edilemedi, orijinal dosya gönderiliyor:', error);
        return file;
    }
}

async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert('❌ Lütfen bir resim dosyası seçin!');
        event.target.value = '';
        return;
    }

    if (file.size > 20 * 1024 * 1024) {
        alert('❌ Dosya çok büyük! Maksimum 20MB.');
        event.target.value = '';
        return;
    }

    showToast(`📷 ${file.name} hazırlanıyor...`, 'info');

    try {
        const uploadFile = await optimizeImageForUpload(file);
        const formData = new FormData();
        formData.append('image', uploadFile);

        const token = localStorage.getItem('chatchip_token');
        const response = await fetch('https://chatchip-production.up.railway.app/api/upload/image', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            console.log('📸 data.fileUrl:', data.fileUrl);

            let imageUrl = data.fileUrl;
            if (imageUrl && imageUrl.startsWith('http://')) {
                imageUrl = imageUrl.replace('http://', 'https://');
            }

            imageUrl = encodeURI(imageUrl);
            currentImageUrl = imageUrl;
            localStorage.setItem('chatchip_current_image_url', currentImageUrl);
            console.log('📸 currentImageUrl set:', currentImageUrl);

            const input = document.getElementById('messageInput');
            if (input) {
                input.value = '';
                input.placeholder = '📝 Görsel hakkında bir şeyler yaz...';
                input.focus();
            }

            showImagePreview(currentImageUrl);
            showToast(`✅ ${file.name} yüklendi! Mesajını yaz ve gönder.`, 'success');
        } else {
            showToast('❌ ' + (data.error || 'Dosya yüklenirken hata oluştu!'), 'error');
        }
    } catch (error) {
        console.error('Dosya yükleme hatası:', error);
        showToast('❌ Dosya yüklenirken hata oluştu!', 'error');
    }

    event.target.value = '';
}
