// BACKOFFICE - Kullanıcı Dashboard

console.log('📦 Backoffice.js yüklendi');

const boContent = document.getElementById('boContent');
let currentUser = null;

// 🔥 Sayfa yüklendiğinde çalışacak ana fonksiyon
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM yüklendi, backoffice başlatılıyor...');
    
    // DataManager'ı kontrol et
    if (typeof window.DataManager === 'undefined') {
        console.error('❌ DataManager bulunamadı!');
        boContent.innerHTML = `
            <div class="loading" style="color:#ef4444; text-align:center; padding:40px;">
                ❌ Sistem hatası! Lütfen sayfayı yenileyin.
                <br><br>
                <button onclick="location.reload()" style="padding:8px 20px; border-radius:8px; border:1px solid var(--border); background:white; cursor:pointer;">🔄 Yenile</button>
            </div>
        `;
        return;
    }
    
    // DataManager'dan kullanıcı bilgisini al
    const dm = window.DataManager;
    currentUser = dm.currentUser;
    
    console.log('👤 Current User:', currentUser);
    console.log('🆔 User ID:', currentUser?.id);
    console.log('📛 User Name:', currentUser?.name);
    
    // Kullanıcı kontrolü
    if (!currentUser || !currentUser.id) {
        console.error('❌ Kullanıcı bilgisi eksik!');
        
        // localStorage'dan tekrar dene
        try {
            const saved = localStorage.getItem('chatchip_user');
            if (saved) {
                const parsed = JSON.parse(saved);
                console.log('💾 localStorage\'dan kullanıcı bulundu:', parsed);
                if (parsed.id) {
                    currentUser = parsed;
                    dm.currentUser = parsed;
                    console.log('✅ currentUser güncellendi:', currentUser);
                }
            }
        } catch (e) {
            console.error('localStorage okuma hatası:', e);
        }
        
        // Hala yoksa yönlendir
        if (!currentUser || !currentUser.id) {
            boContent.innerHTML = `
                <div class="loading" style="text-align:center; padding:60px 20px;">
                    <p style="font-size:1.5rem; margin-bottom:12px;">🔒</p>
                    <p style="font-size:1.1rem; font-weight:600; color:var(--text);">Giriş Yapın</p>
                    <p style="font-size:0.85rem; color:var(--text-light); margin-bottom:20px;">Bu sayfayı görmek için lütfen giriş yapın.</p>
                    <a href="/index.html" class="action-btn" style="padding:10px 24px; border-radius:8px; background:var(--primary); color:white; text-decoration:none; display:inline-block;">Ana Sayfaya Dön</a>
                </div>
            `;
            return;
        }
    }
    
    // Profile butonunu güncelle
    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn && currentUser) {
        profileBtn.textContent = currentUser.name?.charAt(0).toUpperCase() || '👤';
    }
    
    // Backoffice'i yükle
    loadBackoffice();
});

async function loadBackoffice() {
    console.log('🔄 loadBackoffice başladı');
    console.log('👤 Mevcut kullanıcı:', currentUser);
    console.log('🆔 Kullanıcı ID:', currentUser?.id);

    if (!currentUser || !currentUser.id) {
        boContent.innerHTML = `
            <div class="loading" style="text-align:center; padding:40px; color:#ef4444;">
                ❌ Kullanıcı bilgisi bulunamadı!
                <br><br>
                <button onclick="location.reload()" style="padding:8px 20px; border-radius:8px; border:1px solid var(--border); background:white; cursor:pointer;">🔄 Yenile</button>
            </div>
        `;
        return;
    }

    boContent.innerHTML = '<div class="loading">⏳ Veriler yükleniyor...</div>';

    try {
        const dm = window.DataManager;
        
        // 🔥 MLM status ve Tree'yi al
        const [mlmStatus, tree] = await Promise.all([
            dm.getMLMStatus(),
            dm.getTree()
        ]);
        
        console.log('📊 MLM Status:', mlmStatus);
        console.log('🌳 Tree:', tree);
        
        // 🔥 Kullanıcı ID'sini currentUser'dan al (EN GÜVENİLİR KAYNAK)
        const userId = currentUser.id;
        console.log('🆔 Kullanılacak ID:', userId);
        
        // Eğer mlmStatus'ta user varsa ve içinde ek bilgiler varsa, currentUser'ı güncelle
        if (mlmStatus?.user) {
            const apiUser = mlmStatus.user;
            console.log('📥 API\'den gelen user:', apiUser);
            
            // currentUser'ı API'deki bilgilerle güncelle (ama id'yi koru)
            currentUser = {
                ...currentUser,
                ...apiUser,
                id: userId // ID'yi currentUser'dan al
            };
            
            // localStorage'ı güncelle
            localStorage.setItem('chatchip_user', JSON.stringify(currentUser));
            dm.currentUser = currentUser;
            
            console.log('✅ Kullanıcı güncellendi:', currentUser);
        }
        
        renderBackoffice(mlmStatus, tree, userId);
        
    } catch (error) {
        console.error('❌ Backoffice yükleme hatası:', error);
        boContent.innerHTML = `
            <div class="loading" style="color:#ef4444; text-align:center; padding:40px;">
                ❌ Veriler yüklenemedi: ${error.message}
                <br><br>
                <button onclick="loadBackoffice()" style="padding:8px 20px; border-radius:8px; border:1px solid var(--border); background:white; cursor:pointer;">🔄 Yenile</button>
            </div>
        `;
    }
}

function renderBackoffice(mlmStatus, tree, userId) {
    console.log('🎨 renderBackoffice başladı');
    console.log('🆔 Kullanıcı ID:', userId);
    
    // userId kontrolü
    if (!userId) {
        boContent.innerHTML = `
            <div class="loading" style="color:#ef4444; text-align:center; padding:40px;">
                ❌ Kullanıcı ID bulunamadı!
                <br><br>
                <button onclick="location.reload()" style="padding:8px 20px; border-radius:8px; border:1px solid var(--border); background:white; cursor:pointer;">🔄 Yenile</button>
            </div>
        `;
        return;
    }

    const data = mlmStatus?.user || {};
    const nodes = tree?.nodes || [];
    
    // Kullanıcı bilgileri
    const careerLevel = data.career_level || currentUser?.career_level || 'Starter';
    const kv = data.kv || 0;
    const leftCV = data.left_cv || 0;
    const rightCV = data.right_cv || 0;
    const leftPV = data.left_pv || 0;
    const rightPV = data.right_pv || 0;
    const multiplier = parseFloat(data.multiplier) || 0.09;
    
    // 🔥 Sol ve Sağ kol üyelerini filtrele
    const leftMembers = nodes.filter(n => {
        if (n.id === userId) return false;
        let current = n;
        while (current && current.sponsor_id) {
            if (current.sponsor_id === userId && current.position === 'left') return true;
            const parent = nodes.find(p => p.id === current.sponsor_id);
            if (!parent) break;
            current = parent;
        }
        return false;
    });
    
    const rightMembers = nodes.filter(n => {
        if (n.id === userId) return false;
        let current = n;
        while (current && current.sponsor_id) {
            if (current.sponsor_id === userId && current.position === 'right') return true;
            const parent = nodes.find(p => p.id === current.sponsor_id);
            if (!parent) break;
            current = parent;
        }
        return false;
    });
    
    const leftCount = leftMembers.length;
    const rightCount = rightMembers.length;
    const totalMembers = leftCount + rightCount;
    
    const isActive = kv >= 45;
    const activeBadge = isActive ? '✅ Aktif' : '❌ Pasif';
    const activeColor = isActive ? '#10B981' : '#EF4444';
    
    const rawEarnings = Math.min(parseFloat(leftCV) || 0, parseFloat(rightCV) || 0) * multiplier;
    const potentialEarnings = rawEarnings.toFixed(2);
    
    // ============================================================
    // KARİYER
    // ============================================================
    const careerLevels = ['Starter', 'Pioneer', 'Star', 'Leader', 'Emerald', 'Diamond', 'Blue Diamond', 'Green Diamond', 'Red Diamond'];
    const currentIndex = careerLevels.indexOf(careerLevel);
    
    let nextCareer = '🏆 Maksimum';
    let progress = 100;
    let requirements = [];
    
    if (currentIndex < careerLevels.length - 1) {
        nextCareer = careerLevels[currentIndex + 1];
        
        if (careerLevel === 'Starter') {
            requirements = [
                { label: 'Sol PV ≥ 1000', met: parseFloat(leftPV) >= 1000 },
                { label: 'Sağ PV ≥ 1000', met: parseFloat(rightPV) >= 1000 }
            ];
        } else {
            const careerMap = {
                'Pioneer': { label: 'Pioneer' },
                'Star': { label: 'Star' },
                'Leader': { label: 'Leader' },
                'Emerald': { label: 'Emerald' },
                'Diamond': { label: 'Diamond' },
                'Blue Diamond': { label: 'Blue Diamond' },
                'Green Diamond': { label: 'Green Diamond' }
            };
            
            const req = careerMap[nextCareer];
            if (req) {
                const leftCount = leftMembers.filter(m => m.career_level === req.label).length || 0;
                const rightCount = rightMembers.filter(m => m.career_level === req.label).length || 0;
                requirements = [
                    { label: `Sol Kol ${req.label} ≥ 2`, met: leftCount >= 2 },
                    { label: `Sağ Kol ${req.label} ≥ 2`, met: rightCount >= 2 }
                ];
            }
        }
        
        const total = requirements.length;
        const completed = requirements.filter(r => r.met).length;
        progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    }

    const careerColors = {
        'Starter': '#E8F5E9', 'Pioneer': '#E3F2FD', 'Star': '#FFF3E0',
        'Leader': '#F3E5F5', 'Emerald': '#E0F7FA', 'Diamond': '#FCE4EC',
        'Blue Diamond': '#E8EAF6', 'Green Diamond': '#E0F2F1', 'Red Diamond': '#FBE9E7'
    };
    const careerColor = careerColors[careerLevel] || '#E8F5E9';
    
    const isAdmin = currentUser?.is_admin === true || currentUser?.isAdmin === true;
    
    let requirementsHtml = '';
    if (requirements.length > 0) {
        requirementsHtml = requirements.map(r => `
            <div style="display:flex; align-items:center; gap:8px; padding:4px 0; font-size:0.75rem;">
                <span style="color:${r.met ? '#10B981' : '#EF4444'}; font-size:1rem;">${r.met ? '✅' : '⏳'}</span>
                <span style="color:var(--text);">${r.label}</span>
                <span style="margin-left:auto; font-weight:600; color:${r.met ? '#10B981' : 'var(--text-light)'};">
                    ${r.met ? 'Tamamlandı ✓' : 'Eksik'}
                </span>
            </div>
        `).join('');
    } else if (careerLevel === 'Red Diamond') {
        requirementsHtml = '<div style="font-size:0.75rem; color:var(--text-light); text-align:center;">🏆 En yüksek kariyer seviyesindesin!</div>';
    }

    // 🔥 REFERRAL LINKLERİ - DOĞRU USER ID İLE
    const baseUrl = window.location.origin;
    const leftRefLink = `${baseUrl}/register?position=left&ref=${userId}`;
    const rightRefLink = `${baseUrl}/register?position=right&ref=${userId}`;
    
    console.log('🔗 Sol Link:', leftRefLink);
    console.log('🔗 Sağ Link:', rightRefLink);

    let html = `
        <!-- 🔥 Kullanıcı ID Gösterimi -->
        <div style="background:#e8f5e9; padding:10px 16px; border-radius:8px; margin-bottom:16px; border:1px solid #81c784; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <span style="font-size:0.8rem; color:#2e7d32;">✅ Kullanıcı ID:</span>
                <strong style="font-size:1.1rem; color:#1b5e20; margin-left:6px;">${userId}</strong>
            </div>
            <div>
                <span style="font-size:0.8rem; color:#2e7d32;">👤</span>
                <strong style="color:#1b5e20;">${currentUser?.name || 'İsimsiz'}</strong>
            </div>
        </div>

        <div class="career-card">
            <div class="career-header">
                <div>
                    <div class="label">Mevcut Kariyer</div>
                    <div class="level" style="background:${careerColor}; padding:4px 16px; border-radius:20px; display:inline-block; font-size:1.2rem;">
                        ${careerLevel}
                    </div>
                </div>
                <div style="display:flex; flex-direction:column; align-items:flex-end;">
                    <span style="font-size:0.6rem; color:var(--text-light);">KV</span>
                    <span style="font-size:1.2rem; font-weight:700; color:#8B5CF6;">${kv}</span>
                    <span style="font-size:0.6rem; color:${activeColor};">${activeBadge}</span>
                </div>
            </div>

            <div style="margin-top:12px; padding:12px; background:rgba(255,255,255,0.5); border-radius:8px; border:1px solid var(--border);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                    <span style="font-size:0.8rem; font-weight:600; color:var(--text);">🎯 Sonraki Kariyer: <strong>${nextCareer}</strong></span>
                    <span style="font-size:0.8rem; font-weight:700; color:var(--primary);">%${progress}</span>
                </div>
                <div class="progress-track" style="height:6px; background:var(--border); border-radius:10px; overflow:hidden;">
                    <div class="progress-fill" style="height:100%; width:${progress}%; background:linear-gradient(90deg, var(--primary), var(--primary-dark)); border-radius:10px; transition:width 0.6s ease;"></div>
                </div>
                ${requirementsHtml ? `<div style="margin-top:8px; border-top:1px solid var(--border); padding-top:8px;">${requirementsHtml}</div>` : ''}
            </div>
        </div>

        <div class="legs">
            <div class="leg left">
                <div class="leg-title">🟦 Sol Kol</div>
                <div class="value">${leftCount}</div>
                <div class="sub">${formatNumber(leftCV)} CV</div>
                <div class="sub" style="color:#10B981;">${formatNumber(leftPV)} PV</div>
            </div>
            <div class="leg right">
                <div class="leg-title">🟩 Sağ Kol</div>
                <div class="value">${rightCount}</div>
                <div class="sub">${formatNumber(rightCV)} CV</div>
                <div class="sub" style="color:#10B981;">${formatNumber(rightPV)} PV</div>
            </div>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="label">Binary Çarpanı</div>
                <div class="value gold">${(multiplier * 100).toFixed(0)}%</div>
            </div>
            <div class="stat-card">
                <div class="label">Toplam Üye</div>
                <div class="value">${totalMembers}</div>
            </div>
            <div class="stat-card">
                <div class="label">Potansiyel Kazanç</div>
                <div class="value gold">$ ${potentialEarnings}</div>
            </div>
        </div>

        <div class="section-header">
            <span class="section-title">👤 Üye Yönetimi</span>
        </div>

        <div class="section-title">🔗 Davet Bağlantıları</div>
        <div class="ref-card">
            <span class="label left">SOL</span>
            <input type="text" id="leftRefInput" readonly value="${leftRefLink}">
            <button class="copy-btn" onclick="copyRef('leftRefInput')">📋 Kopyala</button>
        </div>
        <div class="ref-card">
            <span class="label right">SAĞ</span>
            <input type="text" id="rightRefInput" readonly value="${rightRefLink}">
            <button class="copy-btn" onclick="copyRef('rightRefInput')">📋 Kopyala</button>
        </div>

        <div class="section-header">
            <span class="section-title">🧬 Ekip Ağacı</span>
            <a href="/tree-detail.html" class="action-btn">Detaylı Gör</a>
        </div>

        ${isAdmin ? `
            <div class="section-header" style="margin-top:16px; border-top:1px solid var(--border); padding-top:16px;">
                <span class="section-title">👑 Admin Yönetimi</span>
                <a href="/admin-panel.html" class="action-btn" style="background:#8B5CF6; color:white; border-color:#8B5CF6;">
                    Admin Paneli
                </a>
            </div>
        ` : ''}

        <div class="section-title">📋 Son Kayıt Olanlar</div>
        <div class="team-list" id="recentTeam">
            ${nodes.slice(0, 5).map(m => `
                <div class="team-item">
                    <span class="name">${m.name || 'İsimsiz'}</span>
                    <span class="position ${m.position || ''}">${m.position || 'Üye'}</span>
                    <span class="date">${m.career_level || 'Starter'}</span>
                </div>
            `).join('') || '<div style="color:var(--text-light);font-size:0.8rem;">Henüz üye yok</div>'}
        </div>
    `;

    boContent.innerHTML = html;
}

function formatNumber(num) {
    if (num === null || num === undefined) return '0';
    const number = parseFloat(num);
    if (isNaN(number) || number === 0) return '0';
    const abs = Math.abs(number);
    if (abs >= 1000000) return (number / 1000000).toFixed(2) + 'M';
    if (abs >= 1000) return (number / 1000).toFixed(2) + 'K';
    return number.toFixed(2);
}

function copyRef(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.select();
    input.setSelectionRange(0, 99999);
    try {
        document.execCommand('copy');
        showToast('✅ Link kopyalandı!', 'success');
    } catch (e) {
        navigator.clipboard.writeText(input.value).then(() => {
            showToast('✅ Link kopyalandı!', 'success');
        }).catch(() => {
            showToast('❌ Kopyalanamadı', 'error');
        });
    }
}

function showToast(msg, type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = `toast show ${type}`;
    toast.textContent = msg;
    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '12px 24px',
        borderRadius: '8px',
        background: type === 'success' ? '#10B981' : '#EF4444',
        color: 'white',
        fontWeight: '600',
        zIndex: '9999',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        transition: 'all 0.3s ease'
    });
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

window.loadBackoffice = loadBackoffice;
window.copyRef = copyRef;
window.showToast = showToast;

console.log('✅ Backoffice.js tamamen yüklendi!');
