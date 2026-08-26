// CUZDAN - Yeni Tasarım

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadBankInfo();
    loadWalletStats();
});

async function checkAuth() {
    const dm = window.DataManager;
    const token = dm.getToken();
    currentUser = dm.currentUser;

    if (!token || !currentUser) {
        document.getElementById('cuzdanContent').innerHTML = `
            <div style="text-align:center; padding:40px 20px;">
                <p style="font-size:1.2rem;">🔒</p>
                <p style="font-size:0.9rem; font-weight:600; color:var(--text);">Giriş Yapın</p>
                <a href="/index.html" style="padding:8px 20px; border-radius:8px; background:var(--primary); color:white; text-decoration:none; display:inline-block; margin-top:8px; font-size:0.8rem;">Ana Sayfa</a>
            </div>
        `;
        return;
    }

    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn && currentUser) {
        profileBtn.textContent = currentUser.name?.charAt(0).toUpperCase() || '👤';
    }
}

async function loadWalletStats() {
    const container = document.getElementById('walletStats');
    if (!container) return;
    
    container.innerHTML = '<div class="loading">⏳ Yükleniyor...</div>';

    try {
        const dm = window.DataManager;
        const stats = await dm.getMLMStatus();
        renderWalletStats(stats);
    } catch (error) {
        console.error('Cüzdan yükleme hatası:', error);
        container.innerHTML = `<div style="text-align:center; padding:16px; color:#ef4444; font-size:0.8rem;">❌ ${error.message}</div>`;
    }
}

function renderWalletStats(stats) {
    const container = document.getElementById('walletStats');
    const data = stats?.user || {};

    const careerLevel = data.career_level || 'Starter';
    const highestCareer = data.highest_career || careerLevel;
    const kv = data.kv || 0;
    const leftCV = data.left_cv || 0;
    const rightCV = data.right_cv || 0;
    const isActive = kv >= 45;

    // Hesaplamalar
    const multipliers = {
        'Starter': 0.09, 'Pioneer': 0.11, 'Star': 0.12,
        'Leader': 0.13, 'Emerald': 0.15, 'Diamond': 0.16,
        'Blue Diamond': 0.18, 'Green Diamond': 0.20, 'Red Diamond': 0.22
    };
    const multiplier = multipliers[careerLevel] || 0.09;
    const potentialEarnings = Math.min(leftCV, rightCV) * multiplier;

    const careerRewards = {
        'Starter': 0, 'Pioneer': 400, 'Star': 700, 'Leader': 1200,
        'Emerald': 3000, 'Diamond': 5000, 'Blue Diamond': 15000,
        'Green Diamond': 40000, 'Red Diamond': 80000
    };
    const careerReward = careerRewards[careerLevel] || 0;

    // Geçen hafta kazancı (weekly_matches'dan)
    const weeklyEarning = data.weekly_earned || 0;
    
    // Geçen ay kariyer kazancı (career_history'dan)
    const monthlyCareerEarning = data.monthly_career_earned || 0;

    // Hesaba aktarılmayı bekleyen tutar
    const pendingBalance = data.pending_balance || 0;

    container.innerHTML = `
        <!-- ⚡ ANA KART: KV ve Aktiflik (Bakiye KALDIRILDI!) -->
        <div class="balance-card" style="background: linear-gradient(135deg, #2DD4BF, #14B8A6);">
            <div class="label" style="opacity:0.8;">📊 Kariyer Durumu</div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin: 4px 0;">
                <span style="font-size:1.8rem; font-weight:700;">${kv}</span>
                <span style="font-size:1rem; font-weight:600; background:rgba(255,255,255,0.2); padding:4px 14px; border-radius:20px;">${isActive ? '✅ Aktif' : '❌ Pasif'}</span>
            </div>
            <div class="sub" style="font-size:0.8rem;">${careerLevel} · ${isActive ? 'Aktif üye' : 'Pasif'}</div>
            <div class="row" style="margin-top:8px; border-top:1px solid rgba(255,255,255,0.1); padding-top:8px;">
                <div class="item">
                    <div class="value" style="font-size:0.9rem;">$ ${formatNumber(potentialEarnings)}</div>
                    <div class="label" style="font-size:0.55rem;">Potansiyel Kazanç</div>
                </div>
                <div class="item">
                    <div class="value" style="font-size:0.9rem;">${formatNumber(leftCV)} / ${formatNumber(rightCV)}</div>
                    <div class="label" style="font-size:0.55rem;">Sol / Sağ CV</div>
                </div>
            </div>
        </div>

        <!-- 📊 KAZANÇ DETAYLARI (Geçen Hafta / Geçen Ay) -->
        <div class="stats-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px;">
            <div class="stat-card">
                <div class="number gold">$ ${formatNumber(weeklyEarning)}</div>
                <div class="label">📅 Geçen Hafta Kazancı</div>
            </div>
            <div class="stat-card">
                <div class="number gold">$ ${formatNumber(monthlyCareerEarning)}</div>
                <div class="label">📆 Geçen Ay Kariyer Kazancı</div>
            </div>
        </div>

        <!-- 🎯 Kariyer Bilgileri -->
        <div class="section-title">🎯 Kariyer Bilgileri</div>
        <div class="reward-grid">
            <div class="reward-box">
                <div class="label">Mevcut Kariyer</div>
                <div class="value">${careerLevel}</div>
            </div>
            <div class="reward-box" style="border-color:#F59E0B; background:rgba(245,158,11,0.06);">
                <div class="label">🏆 En Yüksek Kariyer</div>
                <div class="value" style="color:#D97706;">${highestCareer}</div>
            </div>
            <div class="reward-box">
                <div class="label">Kariyer Ödülü</div>
                <div class="value purple">$ ${formatNumber(careerReward)}</div>
            </div>
            <div class="reward-box">
                <div class="label">Potansiyel Kazanç</div>
                <div class="value green">$ ${formatNumber(potentialEarnings)}</div>
            </div>
        </div>
    `;

// ============================================================
// IBAN BİLGİLERİ
// ============================================================
async function loadBankInfo() {
    try {
        const dm = window.DataManager;
        const result = await dm.getBankInfo();
        
        const accountHolderInput = document.getElementById('accountHolder');
        if (accountHolderInput && currentUser && currentUser.name) {
            accountHolderInput.value = currentUser.name;
            accountHolderInput.readOnly = true;
            accountHolderInput.style.background = '#f0f0f0';
            accountHolderInput.style.color = '#555';
        }
        
        if (result.success && result.data) {
            const data = result.data;
            document.getElementById('bankName').value = data.bank_name || '';
            document.getElementById('ibanInput').value = data.iban || '';
            document.getElementById('tcNo').value = data.tc_no || '';
        }
    } catch (error) {
        console.error('IBAN yüklenemedi:', error);
        const accountHolderInput = document.getElementById('accountHolder');
        if (accountHolderInput && currentUser && currentUser.name) {
            accountHolderInput.value = currentUser.name;
        }
    }
}
async function saveBankInfo() {
    const bankName = document.getElementById('bankName').value.trim();
    const iban = document.getElementById('ibanInput').value.trim();
    const tcNo = document.getElementById('tcNo').value.trim();
    const accountHolder = document.getElementById('accountHolder').value.trim();

    if (!bankName || !iban || !tcNo || !accountHolder) {
        showStatus('❌ Tüm alanları doldurun.', 'error');
        return;
    }

    try {
        const dm = window.DataManager;
        const result = await dm.updateBankInfo({ bank_name: bankName, iban, tc_no: tcNo, bank_account_holder: accountHolder });
        showStatus(result.success ? '✅ Kaydedildi!' : '❌ ' + result.error, result.success ? 'success' : 'error');
    } catch (error) {
        showStatus('❌ ' + error.message, 'error');
    }
}

function showStatus(msg, type = 'info') {
    const status = document.getElementById('bankInfoStatus');
    status.textContent = msg;
    status.style.display = 'block';
    status.style.color = type === 'success' ? '#10B981' : '#EF4444';
    setTimeout(() => { status.style.display = 'none'; }, 3000);
}

function formatNumber(num) {
    if (!num || num === 0) return '0';
    const abs = Math.abs(num);
    if (abs >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (abs >= 1000) return (num / 1000).toFixed(2) + 'K';
    return num.toString();
}

window.loadBankInfo = loadBankInfo;
window.saveBankInfo = saveBankInfo;
window.loadWalletStats = loadWalletStats;

console.log('✅ Cüzdan yüklendi!');
