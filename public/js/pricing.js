// PRICING - Planlar ve Satın Alma

let plansData = [];
let currentPeriod = 'monthly';
let selectedPaymentMethod = 'bank_transfer';

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadPlans();
});

async function checkAuth() {
    const dm = window.DataManager;
    const token = dm.getToken();
    const user = dm.currentUser;

    if (!token || !user) {
        dm.currentUser = { id: 1, name: 'Ridvan Akkaya', email: 'ridvan@chatchip.com' };
        localStorage.setItem('chatchip_user', JSON.stringify(dm.currentUser));
    }

    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn && dm.currentUser) {
        profileBtn.textContent = dm.currentUser.name?.charAt(0).toUpperCase() || '👤';
    }
}

async function loadPlans() {
    const content = document.getElementById('pricingContent');
    content.innerHTML = '<div class="loading">⏳ Planlar yükleniyor...</div>';

    try {
        const res = await fetch('https://chatchip-production.up.railway.app/api/pricing');
        const data = await res.json();
        
        plansData = data.plans || data || [];
        console.log('📦 Planlar yüklendi:', plansData.length);

        if (plansData.length === 0) {
            content.innerHTML = `
                <div class="loading" style="color:#ef4444;">
                    ❌ Plan bulunamadı
                    <br><br>
                    <button onclick="loadPlans()" style="padding:8px 20px; border-radius:8px; border:1px solid var(--border); background:white; cursor:pointer;">🔄 Yenile</button>
                </div>
            `;
            return;
        }

        renderPricing(plansData);
    } catch (error) {
        console.error('Plan yükleme hatası:', error);
        content.innerHTML = `
            <div class="loading" style="color:#ef4444;">
                ❌ Planlar yüklenemedi: ${error.message}
                <br><br>
                <button onclick="loadPlans()" style="padding:8px 20px; border-radius:8px; border:1px solid var(--border); background:white; cursor:pointer;">🔄 Yenile</button>
            </div>
        `;
    }
}

function renderPricing(plans) {
    const content = document.getElementById('pricingContent');

    let html = `
        <div class="pricing-header">
            <h2>💰 Planlar ve Fiyatlandırma</h2>
            <p>Her plan satın alımında CV puanınız artar</p>
            <p style="font-size:0.85rem; color:#8B5CF6; margin-top:4px;">
                🧠 <strong>Tüm planlarda Coach.AI modülü HEDİYE!</strong>
            </p>
        </div>

        <div class="period-selector">
            <button class="period-btn ${currentPeriod === 'monthly' ? 'active' : ''}" data-period="monthly" onclick="setPeriod('monthly')">Aylık</button>
            <button class="period-btn ${currentPeriod === 'quarterly' ? 'active' : ''}" data-period="quarterly" onclick="setPeriod('quarterly')">3 Aylık</button>
            <button class="period-btn ${currentPeriod === 'yearly' ? 'active' : ''}" data-period="yearly" onclick="setPeriod('yearly')">Yıllık</button>
        </div>

        <div style="display:flex; justify-content:center; gap:12px; margin-bottom:16px; background:rgba(255,255,255,0.3); padding:10px; border-radius:12px; border:1px solid var(--border);">
            <button class="payment-method-btn ${selectedPaymentMethod === 'bank_transfer' ? 'active' : ''}" 
                    onclick="selectPaymentMethod('bank_transfer')" 
                    style="padding:6px 16px; border-radius:8px; border:2px solid ${selectedPaymentMethod === 'bank_transfer' ? 'var(--primary)' : 'var(--border)'}; background:${selectedPaymentMethod === 'bank_transfer' ? 'var(--primary)' : 'transparent'}; color:${selectedPaymentMethod === 'bank_transfer' ? 'white' : 'var(--text)'}; cursor:pointer; transition:all 0.3s; font-weight:600;">
                🏦 Havale / EFT
            </button>
            <button class="payment-method-btn ${selectedPaymentMethod === 'credit_card' ? 'active' : ''}" 
                    onclick="selectPaymentMethod('credit_card')" 
                    style="padding:6px 16px; border-radius:8px; border:2px solid ${selectedPaymentMethod === 'credit_card' ? 'var(--primary)' : 'var(--border)'}; background:${selectedPaymentMethod === 'credit_card' ? 'var(--primary)' : 'transparent'}; color:${selectedPaymentMethod === 'credit_card' ? 'white' : 'var(--text)'}; cursor:pointer; transition:all 0.3s; font-weight:600;">
                💳 Kredi Kartı (Yakında)
            </button>
        </div>

        <div class="plans-grid" id="plansGrid">
            ${plans.map((plan, index) => {
                const periodData = plan[currentPeriod] || plan.monthly || { price: 0, cv: 0, duration: '1 ay' };
                const price = periodData.price || 0;
                const cv = periodData.cv || 0;
                const kv = price;
                const pv = cv;
                const duration = periodData.duration || '1 ay';
                const isPopular = plan.name === 'Pro Plan';

                return `
                    <div class="plan-card ${isPopular ? 'popular' : ''}">
                        ${isPopular ? '<div class="popular-badge">🔥 Popüler</div>' : ''}
                        <div class="plan-name">${plan.name}</div>
                        <div class="plan-price">$${price} <span>/ ${duration}</span></div>
                        <div class="plan-stats">
                            <div class="stat-item">
                                <span class="label">CV</span>
                                <span class="value">+${cv}</span>
                            </div>
                            <div class="stat-item">
                                <span class="label">PV</span>
                                <span class="value">+${pv}</span>
                            </div>
                            <div class="stat-item">
                                <span class="label">KV</span>
                                <span class="value">+${kv}</span>
                            </div>
                        </div>
                        <ul class="features">
                            ${(plan.features || ['Temel Özellikler']).map(f => `<li>${f}</li>`).join('')}
                        </ul>
                        ${plan.features && plan.features.some(f => f.includes('Coach.AI')) ? '<div style="text-align:center; margin:4px 0 8px; font-size:0.65rem; color:#8B5CF6; font-weight:600;">🧠 Coach.AI HEDİYE!</div>' : ''}
                        <button class="buy-btn" onclick="purchasePlan('${plan.name}', '${currentPeriod}', ${price}, ${cv}, ${kv})">
                            Satın Al
                        </button>
                    </div>
                `;
            }).join('')}
        </div>

        <div class="info-box">
            💡 Her satın alımda CV, PV ve KV puanlarınız artar.
            <br>
            <strong>Kariyerinizi yükseltin!</strong>
            <br><br>
            <span style="font-size:0.85rem; color:#8B5CF6;">🧠 <strong>Coach.AI modülü</strong> tüm planlarda HEDİYE!</span>
            <br>
            <span style="font-size:0.75rem; color:var(--text-light);">MLM Koçu, Akademik Koç ve Kişisel Gelişim Koçu aktif!</span>
        </div>
    `;

    content.innerHTML = html;
}

function selectPaymentMethod(method) {
    selectedPaymentMethod = method;
    document.querySelectorAll('.payment-method-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.style.borderColor = 'var(--border)';
        btn.style.background = 'transparent';
        btn.style.color = 'var(--text)';
    });
    const activeBtn = document.querySelector(`.payment-method-btn[onclick*="${method}"]`);
    if (activeBtn) {
        activeBtn.style.borderColor = 'var(--primary)';
        activeBtn.style.background = 'var(--primary)';
        activeBtn.style.color = 'white';
    }
}

function setPeriod(period) {
    currentPeriod = period;
    
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.period === period) {
            btn.classList.add('active');
        }
    });

    renderPricing(plansData);
}

async function purchasePlan(planName, period, price, cv, kv) {
    const methodText = selectedPaymentMethod === 'bank_transfer' ? 'Havale/EFT' : 'Kredi Kartı';
    
    const confirmMsg = `${planName} - ${period} planını $${price} karşılığında ${methodText} ile satın almak istediğinize emin misiniz?\n\nCV: +${cv}\nPV: +${cv}\nKV: +${kv}\n\n🧠 Coach.AI modülü HEDİYE!`;
    
    if (!confirm(confirmMsg)) {
        return;
    }

    try {
        const dm = window.DataManager;
        const token = dm.getToken();

        if (!token) {
            showToast('❌ Lütfen önce giriş yapın!', 'error');
            return;
        }

        const response = await fetch('https://chatchip-production.up.railway.app/api/payments/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                planName,
                period,
                amount: price,
                cv: cv,
                kv: kv,
                paymentMethod: selectedPaymentMethod
            })
        });

        const data = await response.json();

        if (data.success) {
            if (selectedPaymentMethod === 'bank_transfer') {
                showToast(`✅ Satın alma isteği oluşturuldu! Admin onayı bekleniyor.`, 'info');
                setTimeout(() => {
                    window.location.href = '/index.html';
                }, 2000);
            } else if (selectedPaymentMethod === 'credit_card') {
                showToast(`💳 Kredi kartı ile ödeme başlatılıyor...`, 'info');
                setTimeout(() => {
                    window.location.href = '/index.html';
                }, 2000);
            }
        } else {
            showToast('❌ ' + (data.error || 'Satın alma başarısız'), 'error');
        }
    } catch (error) {
        console.error('Satın alma hatası:', error);
        showToast('❌ ' + error.message, 'error');
    }
}

function showToast(msg, type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast show ${type}`;
    toast.textContent = msg;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

window.loadPlans = loadPlans;
window.setPeriod = setPeriod;
window.purchasePlan = purchasePlan;
window.selectPaymentMethod = selectPaymentMethod;
window.showToast = showToast;

console.log('✅ Pricing yüklendi! (Coach.AI tüm planlarda hediye)');
