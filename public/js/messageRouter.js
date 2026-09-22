// ChatChip message intent router
// Rule-based only. No AI classification is used here.

const EDIT_KEYWORDS = [
    'değiştir',
    'düzenle',
    'çevir',
    'ekle',
    'kaldır',
    'renk',
    'style',
    'tarz',
    'anime',
    'karikatür',
    'çizim',
    'filtre',
    'boya',
    'değiş'
];

const IMAGE_PATTERNS = [
    /resim\s*(yap|oluştur|üret|çiz|göster|iste|ver)/i,
    /fotoğraf\s*(yap|oluştur|üret|çek|göster|iste|ver)/i,
    /görsel\s*(yap|oluştur|üret|çiz|göster|iste|ver)/i,
    /çiz\s*(yap|oluştur|üret|göster|iste|ver)/i,
    /göster\s*(resim|fotoğraf|görsel|çizim)/i,
    /make\s*(image|photo|picture)/i,
    /create\s*(image|photo|picture)/i,
    /generate\s*(image|photo|picture)/i,
    /draw\s*(a|an|)/i,
    /kedi\s*(resmi|görseli|fotoğrafı|çizimi)/i,
    /köpek\s*(resmi|görseli|fotoğrafı|çizimi)/i,
    /manzara\s*(resmi|görseli|fotoğrafı|çizimi)/i,
    /portre\s*(yap|çiz|oluştur|göster|iste|ver)/i,
    /karikatür\s*(yap|çiz|oluştur|göster|iste|ver)/i,
    /bana\s*(bir|)\s*(resim|fotoğraf|görsel|çizim)\s*(yap|oluştur|üret|çiz|göster|iste|ver)/i,
    /[a-zA-ZğüşıöçĞÜŞİÖÇ]+\s*(resmi|görseli|fotoğrafı|çizimi)/i,
    /(yapar\s*mısın|yapabilir\s*misin|çizebilir\s*misin|gösterebilir\s*misin)/i
];

function isInfoQuestion(text) {
    const lower = String(text || '').toLowerCase();

    return lower.includes('nasıl') ||
           lower.includes('nedir') ||
           lower.includes('ne yapmalıyım') ||
           lower.includes('ne yapmam lazım') ||
           lower.includes('önerir misin') ||
           lower.includes('tavsiye') ||
           lower.includes('yardım');
}

function isImageEditCommand(text) {
    const lower = String(text || '').toLowerCase();
    return EDIT_KEYWORDS.some(keyword => lower.includes(keyword));
}

function isImageGenerateCommand(text) {
    return IMAGE_PATTERNS.some(pattern => pattern.test(String(text || '')));
}

function cleanImagePrompt(text) {
    const original = String(text || '');

    let cleanPrompt = original
        .replace(/resim|fotoğraf|göster|yap|oluştur|üret|çiz|çek|make|create|generate|draw|portre|karikatür|lütfen|rica|bana|bir|tane|mısın|misin|yapar|yapabilir|çizebilir|gösterebilir/gi, '')
        .trim();

    if (!cleanPrompt || cleanPrompt.length < 2) {
        cleanPrompt = original;
    }

    return cleanPrompt;
}

function resolveIntent(text, options = {}) {
    const hasActiveImage = options.hasActiveImage === true;

    if (hasActiveImage && text && isImageEditCommand(text)) {
        return {
            type: 'image_edit',
            cleanPrompt: text
        };
    }

    const infoQuestion = isInfoQuestion(text);
    const imageCommand = isImageGenerateCommand(text);

    console.log('🖼️ IMAGE DEBUG:', {
        text,
        isImageCommand: imageCommand,
        isInfoQuestion: infoQuestion
    });

    if (imageCommand && !infoQuestion) {
        return {
            type: 'image_generate',
            cleanPrompt: cleanImagePrompt(text)
        };
    }

    return {
        type: 'chat',
        cleanPrompt: text
    };
}

window.ChatChipMessageRouter = {
    resolveIntent,
    isImageEditCommand,
    isImageGenerateCommand,
    isInfoQuestion,
    cleanImagePrompt
};

console.log('🧭 Message router yüklendi');
