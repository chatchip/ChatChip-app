// ADMIN PANEL - TAM SÜRÜM + MOBİLDE SADECE TEMEL BİLGİLER

let usersData = [];
let filteredUsers = [];
let currentPage = 1;
const PAGE_SIZE = 10;

// Mobil kontrolü
function isMobile() {
    return window.innerWidth <= 768;
}

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadAdmin();
});

function checkAuth() {
    const token = localStorage.getItem('chatchip_token');
    const user = JSON.parse(localStorage.getItem('chatchip_user') || 'null');
    if (!token || !user || !user.is_admin) {
        window.location.href = '/index.html';
    }
}

async function loadAdmin() {
    const content = document.getElementById('adminContent');
    content.innerHTML = '<div style="text-align:center;padding:40px;">⏳ Yükleniyor...</div>';

    try {
        const token = localStorage.getItem('chatchip_token');
        const res = await fetch('https://chatchip-production.up.railway.app/api/admin/users', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const users = await res.json();
        usersData = users;
        filteredUsers = users;
        currentPage = 1;
        renderAdmin(users);
    } catch (e) {
        content.innerHTML = '<div style="color:red;text-align:center;padding:40px;">❌ Hata: ' + e.message + '</div>';
    }
}

function renderAdmin(users) {
    const content = document.getElementById('adminContent');
    const totalUsers = users.length;
    const totalKV = users.reduce((s, u) => s + parseFloat(u.kv || 0), 0);
    const totalCV = users.reduce((s, u) => s + parseFloat(u.left_cv || 0) + parseFloat(u.right_cv || 0), 0);
    const adminCount = users.filter(u => u.is_admin).length;
    const activeUsers = users.filter(u => parseFloat(u.kv || 0) >= 45).length;

    let html = `
        <!-- İSTATİSTİKLER -->
        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-bottom:12px;">
            <div style="background:#fff;padding:8px 4px;border-radius:6px;border:1px solid #e5e7eb;text-align:center;">
                <div style="font-size:${isMobile() ? '14px' : '20px'};font-weight:700;">${totalUsers}</div>
                <div style="font-size:${isMobile() ? '8px' : '11px'};color:#6b7280;">👥</div>
            </div>
            <div style="background:#fff;padding:8px 4px;border-radius:6px;border:1px solid #e5e7eb;text-align:center;">
                <div style="font-size:${isMobile() ? '14px' : '20px'};font-weight:700;color:#8B5CF6;">${totalKV.toFixed(1)}</div>
                <div style="font-size:${isMobile() ? '8px' : '11px'};color:#6b7280;">📊</div>
            </div>
            <div style="background:#fff;padding:8px 4px;border-radius:6px;border:1px solid #e5e7eb;text-align:center;">
                <div style="font-size:${isMobile() ? '14px' : '20px'};font-weight:700;color:#3B82F6;">${totalCV.toFixed(1)}</div>
                <div style="font-size:${isMobile() ? '8px' : '11px'};color:#6b7280;">📊</div>
            </div>
            <div style="background:#fff;padding:8px 4px;border-radius:6px;border:1px solid #e5e7eb;text-align:center;">
                <div style="font-size:${isMobile() ? '14px' : '20px'};font-weight:700;">${adminCount}</div>
                <div style="font-size:${isMobile() ? '8px' : '11px'};color:#6b7280;">👑</div>
            </div>
            <div style="background:#fff;padding:8px 4px;border-radius:6px;border:1px solid #e5e7eb;text-align:center;">
                <div style="font-size:${isMobile() ? '14px' : '20px'};font-weight:700;color:#10B981;">${activeUsers}</div>
                <div style="font-size:${isMobile() ? '8px' : '11px'};color:#6b7280;">✅</div>
            </div>
        </div>

        <!-- TABLAR -->
        <div style="display:flex;gap:4px;margin-bottom:12px;background:#f3f4f6;padding:4px;border-radius:8px;">
            <button onclick="switchTab('users')" id="tabUsers" style="flex:1;padding:${isMobile() ? '6px 8px' : '8px 16px'};border:none;border-radius:6px;background:#3b82f6;color:#fff;font-weight:600;cursor:pointer;font-size:${isMobile() ? '11px' : '13px'};">👥</button>
            <button onclick="switchTab('requests')" id="tabRequests" style="flex:1;padding:${isMobile() ? '6px 8px' : '8px 16px'};border:none;border-radius:6px;background:transparent;color:#6b7280;cursor:pointer;font-size:${isMobile() ? '11px' : '13px'};">📋</button>
            <button onclick="switchTab('reports')" id="tabReports" style="flex:1;padding:${isMobile() ? '6px 8px' : '8px 16px'};border:none;border-radius:6px;background:transparent;color:#6b7280;cursor:pointer;font-size:${isMobile() ? '11px' : '13px'};">📊</button>
        </div>

        <!-- KULLANICI TABLOSU -->
        <div id="panelUsers">${renderUserTable()}</div>
        <div id="panelRequests" style="display:none;">📋 Bekleyen istekler yükleniyor...</div>
        <div id="panelReports" style="display:none;">📊 Raporlar yükleniyor...</div>
    `;

    content.innerHTML = html;
}

// 🔥 RENDER USER TABLE - MOBİLDE SADECE TEMEL BİLGİLER
function renderUserTable() {
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const pageUsers = filteredUsers.slice(start, end);
    const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);
    const mobile = isMobile();

    let html = `
    <div style="display:flex;gap:6px;flex:1;min-width:${mobile ? '120px' : '200px'};">
    <input type="text" id="searchInput" placeholder="🔍 Ara..." 
        style="flex:1;padding:${mobile ? '6px 8px' : '8px 12px'};border:1px solid #d1d5db;border-radius:6px;font-size:${mobile ? '11px' : '13px'};outline:none;min-width:${mobile ? '60px' : '120px'};position:relative;z-index:9999;"
        oninput="searchUsers(this.value)" 
        onclick="event.stopPropagation();"
        autocomplete="off">
    <button onclick="clearSearch()" style="padding:${mobile ? '4px 8px' : '6px 12px'};border-radius:6px;border:1px solid #d1d5db;background:white;cursor:pointer;font-size:${mobile ? '10px' : '12px'};">✕</button>
</div>

        <!-- TABLO -->
        <div style="background:#fff;border-radius:8px;border:1px solid #e5e7eb;overflow-x:auto;-webkit-overflow-scrolling:touch;">
            <table style="width:100%;border-collapse:collapse;font-size:${mobile ? '11px' : '13px'};min-width:${mobile ? '320px' : '900px'};">
                <thead>
                    <tr style="background:#f9fafb;border-bottom:2px solid #e5e7eb;">
                        <th style="padding:${mobile ? '4px 4px' : '8px 10px'};">ID</th>
                        <th style="padding:${mobile ? '4px 4px' : '8px 10px'};">İsim</th>
                        ${!mobile ? `<th style="padding:8px 10px;">Email</th>` : ''}
                        ${!mobile ? `<th style="padding:8px 10px;">Telefon</th>` : ''}
                        <th style="padding:${mobile ? '4px 4px' : '8px 10px'};">Kariyer</th>
                        <th style="padding:${mobile ? '4px 4px' : '8px 10px'};color:#8B5CF6;">KV</th>
                        ${!mobile ? `<th style="padding:8px 10px;color:#3B82F6;">Sol CV</th>` : ''}
                        ${!mobile ? `<th style="padding:8px 10px;color:#3B82F6;">Sağ CV</th>` : ''}
                        ${!mobile ? `<th style="padding:8px 10px;color:#10B981;">Sol PV</th>` : ''}
                        ${!mobile ? `<th style="padding:8px 10px;color:#10B981;">Sağ PV</th>` : ''}
                        <th style="padding:${mobile ? '4px 4px' : '8px 10px'};">Plan</th>
                        ${!mobile ? `<th style="padding:8px 10px;">Admin</th>` : ''}
                        <th style="padding:${mobile ? '4px 4px' : '8px 10px'};">İşlem</th>
                    </tr>
                </thead>
                <tbody>
    `;

    if (pageUsers.length === 0) {
        html += `
            <tr>
                <td colspan="${mobile ? 7 : 13}" style="text-align:center;padding:20px;color:#6b7280;font-size:${mobile ? '11px' : '13px'};">🔍 Kullanıcı bulunamadı</td>
            </tr>
        `;
    } else {
        pageUsers.forEach(u => {
            html += `
                <tr style="border-bottom:1px solid #f3f4f6;">
                    <td style="padding:${mobile ? '4px 4px' : '8px 10px'};">${u.id}</td>
                    <td style="padding:${mobile ? '4px 4px' : '8px 10px'};${mobile ? 'max-width:40px;overflow:hidden;text-overflow:ellipsis;' : ''}">${u.name}</td>
                    ${!mobile ? `<td style="padding:8px 10px;">${u.email}</td>` : ''}
                    ${!mobile ? `<td style="padding:8px 10px;">${u.phone || '-'}</td>` : ''}
                    <td style="padding:${mobile ? '4px 4px' : '8px 10px'};font-size:${mobile ? '9px' : '13px'};">${u.career_level || 'Starter'}</td>
                    <td style="padding:${mobile ? '4px 4px' : '8px 10px'};color:#8B5CF6;font-weight:600;font-size:${mobile ? '10px' : '13px'};">${u.kv || 0}</td>
                    ${!mobile ? `<td style="padding:8px 10px;color:#3B82F6;">${u.left_cv || 0}</td>` : ''}
                    ${!mobile ? `<td style="padding:8px 10px;color:#3B82F6;">${u.right_cv || 0}</td>` : ''}
                    ${!mobile ? `<td style="padding:8px 10px;color:#10B981;">${u.left_pv || 0}</td>` : ''}
                    ${!mobile ? `<td style="padding:8px 10px;color:#10B981;">${u.right_pv || 0}</td>` : ''}
                    <td style="padding:${mobile ? '4px 4px' : '8px 10px'};font-size:${mobile ? '9px' : '13px'};">${u.plan_type || 'free'}</td>
                    ${!mobile ? `<td style="padding:8px 10px;">${u.is_admin ? '✅' : '❌'}</td>` : ''}
                    <td style="padding:${mobile ? '4px 4px' : '8px 10px'};">
                        <button onclick="editUser(${u.id})" style="padding:${mobile ? '2px 4px' : '4px 8px'};border-radius:4px;border:1px solid #3b82f6;background:white;color:#3b82f6;cursor:pointer;font-size:${mobile ? '9px' : '11px'};" title="Düzenle">✏️</button>
                        <button onclick="deleteUser(${u.id})" style="padding:${mobile ? '2px 4px' : '4px 8px'};border-radius:4px;border:1px solid #ef4444;background:white;color:#ef4444;cursor:pointer;font-size:${mobile ? '9px' : '11px'};" title="Sil">🗑️</button>
                    </td>
                </tr>
            `;
        });
    }

    html += `
                </tbody>
            </table>
        </div>

        <!-- SAYFALAMA -->
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;flex-wrap:wrap;gap:6px;">
            <span style="font-size:${mobile ? '10px' : '13px'};color:#6b7280;">
                ${filteredUsers.length}
            </span>
            <div style="display:flex;gap:3px;flex-wrap:wrap;">
                <button onclick="goToPage(${currentPage - 1})" ${currentPage <= 1 ? 'disabled style="opacity:0.4;"' : ''} 
                    style="padding:${mobile ? '3px 6px' : '6px 12px'};border-radius:4px;border:1px solid #d1d5db;background:white;cursor:pointer;font-size:${mobile ? '10px' : '12px'};">◀</button>
    `;

    const maxButtons = mobile ? 3 : 10;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    if (endPage - startPage < maxButtons - 1) {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === currentPage;
        html += `
            <button onclick="goToPage(${i})" 
                style="padding:${mobile ? '3px 6px' : '6px 12px'};border-radius:4px;border:1px solid ${isActive ? '#3b82f6' : '#d1d5db'};background:${isActive ? '#3b82f6' : 'white'};color:${isActive ? 'white' : '#333'};cursor:pointer;font-size:${mobile ? '10px' : '12px'};font-weight:${isActive ? '700' : '400'};">
                ${i}
            </button>
        `;
    }

    if (totalPages > maxButtons && endPage < totalPages) {
        html += `<span style="padding:${mobile ? '2px 4px' : '6px 12px'};font-size:${mobile ? '10px' : '12px'};color:#6b7280;">...</span>`;
        html += `
            <button onclick="goToPage(${totalPages})" 
                style="padding:${mobile ? '3px 6px' : '6px 12px'};border-radius:4px;border:1px solid #d1d5db;background:white;cursor:pointer;font-size:${mobile ? '10px' : '12px'};">
                ${totalPages}
            </button>
        `;
    }

    html += `
                <button onclick="goToPage(${currentPage + 1})" ${currentPage >= totalPages ? 'disabled style="opacity:0.4;"' : ''} 
                    style="padding:${mobile ? '3px 6px' : '6px 12px'};border-radius:4px;border:1px solid #d1d5db;background:white;cursor:pointer;font-size:${mobile ? '10px' : '12px'};">▶</button>
            </div>
        </div>
    `;

    return html;
}

// 🔍 ARAMA
function searchUsers(query) {
    if (!query || query.trim() === '') {
        filteredUsers = usersData;
    } else {
        const q = query.toLowerCase().trim();
        filteredUsers = usersData.filter(u => 
            u.name?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q) ||
            String(u.id).includes(q)
        );
    }
    currentPage = 1;
    document.getElementById('panelUsers').innerHTML = renderUserTable();
}

function clearSearch() {
    const input = document.getElementById('searchInput');
    if (input) {
        input.value = '';
    }
    filteredUsers = usersData;
    currentPage = 1;
    document.getElementById('panelUsers').innerHTML = renderUserTable();
}

// 📄 SAYFALAMA
function goToPage(page) {
    const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    document.getElementById('panelUsers').innerHTML = renderUserTable();
    document.querySelector('.admin-content')?.scrollTo(0, 0);
}

// ============================================================
// 📋 TAB DEĞİŞTİRME
// ============================================================

function switchTab(tab) {
    document.querySelectorAll('#panelUsers, #panelRequests, #panelReports').forEach(el => el.style.display = 'none');
    document.querySelectorAll('#tabUsers, #tabRequests, #tabReports').forEach(el => {
        el.style.background = 'transparent';
        el.style.color = '#6b7280';
    });

    if (tab === 'users') {
        document.getElementById('panelUsers').style.display = 'block';
        document.getElementById('tabUsers').style.background = '#3b82f6';
        document.getElementById('tabUsers').style.color = '#fff';
    } else if (tab === 'requests') {
        document.getElementById('panelRequests').style.display = 'block';
        document.getElementById('tabRequests').style.background = '#3b82f6';
        document.getElementById('tabRequests').style.color = '#fff';
        loadRequests();
    } else if (tab === 'reports') {
        document.getElementById('panelReports').style.display = 'block';
        document.getElementById('tabReports').style.background = '#3b82f6';
        document.getElementById('tabReports').style.color = '#fff';
        loadReports();
    }
}

// ============================================================
// 📋 BEKLEYEN İSTEKLER
// ============================================================

async function loadRequests() {
    const container = document.getElementById('panelRequests');
    try {
        const token = localStorage.getItem('chatchip_token');
        const res = await fetch('https://chatchip-production.up.railway.app/api/purchase-requests/pending', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        if (!data || data.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:30px;color:#6b7280;">📭 Bekleyen istek yok</div>';
            return;
        }
        const mobile = isMobile();
        let html = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                <span style="font-weight:600;font-size:${mobile ? '12px' : '14px'};">📋 İstekler (${data.length})</span>
                <button onclick="loadRequests()" style="padding:${mobile ? '4px 10px' : '6px 14px'};border-radius:6px;border:1px solid #d1d5db;background:white;cursor:pointer;font-size:${mobile ? '11px' : '13px'};">🔄</button>
            </div>
            <div style="background:#fff;border-radius:8px;border:1px solid #e5e7eb;overflow-x:auto;-webkit-overflow-scrolling:touch;">
                <table style="width:100%;border-collapse:collapse;font-size:${mobile ? '11px' : '13px'};min-width:${mobile ? '350px' : '600px'};">
                    <thead>
                        <tr style="background:#f9fafb;border-bottom:2px solid #e5e7eb;">
                            <th style="padding:${mobile ? '4px 4px' : '8px 10px'};">ID</th>
                            <th style="padding:${mobile ? '4px 4px' : '8px 10px'};">Kullanıcı</th>
                            <th style="padding:${mobile ? '4px 4px' : '8px 10px'};">Plan</th>
                            <th style="padding:${mobile ? '4px 4px' : '8px 10px'};">Tutar</th>
                            <th style="padding:${mobile ? '4px 4px' : '8px 10px'};">İşlem</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        data.forEach(r => {
            html += `
                <tr style="border-bottom:1px solid #f3f4f6;">
                    <td style="padding:${mobile ? '4px 4px' : '8px 10px'};">${r.id}</td>
                    <td style="padding:${mobile ? '4px 4px' : '8px 10px'};">${r.user_name || 'Bilinmiyor'}</td>
                    <td style="padding:${mobile ? '4px 4px' : '8px 10px'};">${r.plan_name}</td>
                    <td style="padding:${mobile ? '4px 4px' : '8px 10px'};">$${r.amount}</td>
                    <td style="padding:${mobile ? '4px 4px' : '8px 10px'};">
                        <button onclick="approveRequest(${r.id})" style="padding:${mobile ? '2px 6px' : '4px 10px'};border-radius:4px;border:1px solid #22c55e;background:white;color:#22c55e;cursor:pointer;font-size:${mobile ? '9px' : '12px'};">✅</button>
                        <button onclick="rejectRequest(${r.id})" style="padding:${mobile ? '2px 6px' : '4px 10px'};border-radius:4px;border:1px solid #ef4444;background:white;color:#ef4444;cursor:pointer;font-size:${mobile ? '9px' : '12px'};">❌</button>
                    </td>
                </tr>
            `;
        });
        html += `
                    </tbody>
                </table>
            </div>
        `;
        container.innerHTML = html;
    } catch (e) {
        container.innerHTML = '<div style="color:red;text-align:center;padding:20px;">❌ Hata</div>';
    }
}

// ============================================================
// 📊 RAPORLAR
// ============================================================

async function loadReports() {
    const container = document.getElementById('panelReports');
    container.innerHTML = '<div style="text-align:center;padding:30px;">⏳ Yükleniyor...</div>';

    try {
        const token = localStorage.getItem('chatchip_token');
        const headers = { 'Authorization': 'Bearer ' + token };

        const weeklyRes = await fetch('https://chatchip-production.up.railway.app/api/payment-reports/weekly-earnings', { headers });
        const weekly = await weeklyRes.json();

        const careerRes = await fetch('https://chatchip-production.up.railway.app/api/payment-reports/career-earnings', { headers });
        const career = await careerRes.json();

        const totalWeekly = weekly?.summary?.totalEarned || 0;
        const totalCareer = career?.summary?.totalRewards || 0;
        const mobile = isMobile();

        container.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                <span style="font-weight:600;font-size:${mobile ? '12px' : '14px'};">📊 Raporlar</span>
                <div style="display:flex;gap:4px;">
                    <button onclick="exportCSV('users')" style="padding:${mobile ? '4px 8px' : '6px 12px'};border-radius:4px;border:1px solid #d1d5db;background:white;cursor:pointer;font-size:${mobile ? '9px' : '12px'};">📥</button>
                </div>
            </div>
            <div style="display:grid;grid-template-columns:${mobile ? '1fr 1fr' : 'repeat(4,1fr)'};gap:8px;margin-bottom:12px;">
                <div style="background:#f9fafb;padding:${mobile ? '10px' : '16px'};border-radius:8px;text-align:center;">
                    <div style="font-size:${mobile ? '16px' : '24px'};font-weight:700;color:#10B981;">$${totalWeekly.toFixed(2)}</div>
                    <div style="font-size:${mobile ? '8px' : '12px'};color:#6b7280;">Haftalık</div>
                </div>
                <div style="background:#f9fafb;padding:${mobile ? '10px' : '16px'};border-radius:8px;text-align:center;">
                    <div style="font-size:${mobile ? '16px' : '24px'};font-weight:700;color:#8B5CF6;">$${totalCareer.toFixed(2)}</div>
                    <div style="font-size:${mobile ? '8px' : '12px'};color:#6b7280;">Kariyer</div>
                </div>
                <div style="background:#f9fafb;padding:${mobile ? '10px' : '16px'};border-radius:8px;text-align:center;">
                    <div style="font-size:${mobile ? '16px' : '24px'};font-weight:700;color:#F59E0B;">$${(totalWeekly + totalCareer).toFixed(2)}</div>
                    <div style="font-size:${mobile ? '8px' : '12px'};color:#6b7280;">Toplam</div>
                </div>
                <div style="background:#f9fafb;padding:${mobile ? '10px' : '16px'};border-radius:8px;text-align:center;">
                    <div style="font-size:${mobile ? '16px' : '24px'};font-weight:700;color:#3B82F6;">${usersData.length}</div>
                    <div style="font-size:${mobile ? '8px' : '12px'};color:#6b7280;">Kullanıcı</div>
                </div>
            </div>
        `;
    } catch (e) {
        container.innerHTML = '<div style="color:red;text-align:center;padding:20px;">❌ Hata</div>';
    }
}

// ============================================================
// 📥 CSV EXPORT
// ============================================================

async function exportCSV(type) {
    try {
        let url = '', fileName = '';
        const token = localStorage.getItem('chatchip_token');
        const headers = { 'Authorization': 'Bearer ' + token };

        switch(type) {
            case 'users':
                url = 'https://chatchip-production.up.railway.app/api/admin/users';
                fileName = 'kullanicilar.csv';
                break;
            default: return;
        }

        const res = await fetch(url, { headers });
        const data = await res.json();
        let rows = data.data || data || [];
        if (!rows || rows.length === 0) { alert('Veri bulunamadı!'); return; }

        const keys = Object.keys(rows[0]);
        let csv = keys.join(',') + '\n';
        rows.forEach(row => {
            csv += keys.map(k => row[k] || '').join(',') + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        alert('✅ İndirildi!');
    } catch (e) {
        alert('❌ Hata');
    }
}

// ============================================================
// ✏️ KULLANICI DÜZENLEME
// ============================================================

async function editUser(id) {
    const user = usersData.find(u => u.id === id);
    if (!user) { alert('Kullanıcı bulunamadı!'); return; }

    const purchases = await loadUserPurchases(id);

    let historyHtml = '';
    if (purchases && purchases.length > 0) {
        historyHtml = purchases.map(p => `
            <tr style="border-bottom:1px solid #f3f4f6;">
                <td style="padding:4px 6px;">${p.plan_name}</td>
                <td style="padding:4px 6px;">$${p.amount}</td>
                <td style="padding:4px 6px;color:${p.status === 'approved' ? '#10B981' : p.status === 'refunded' ? '#ef4444' : '#F59E0B'};font-weight:600;">
                    ${p.status === 'approved' ? '✅ Onaylandı' : p.status === 'refunded' ? '❌ İade Edildi' : '⏳ Bekliyor'}
                </td>
                <td style="padding:4px 6px;">${new Date(p.created_at).toLocaleDateString('tr-TR')}</td>
                <td style="padding:4px 6px;">
                    ${p.status === 'approved' ? `<button onclick="refundPurchase(${p.id}, ${id})" style="padding:2px 8px;border-radius:4px;border:1px solid #F59E0B;background:rgba(245,158,11,0.1);color:#D97706;cursor:pointer;font-size:11px;">🔄 İade</button>` : '-'}
                </td>
            </tr>
        `).join('');
    } else {
        historyHtml = '<tr><td colspan="5" style="text-align:center;padding:12px;color:#6b7280;">📭 Satın alma geçmişi yok</td></tr>';
    }

    const html = `
        <div id="editModal" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);padding:16px;">
            <div style="background:white;padding:24px;border-radius:12px;width:700px;max-width:100%;max-height:90vh;overflow-y:auto;">
                <h3 style="margin-bottom:16px;">✏️ Kullanıcı Düzenle</h3>
                <input type="hidden" id="editId" value="${user.id}">

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                    <div>
                        <label style="display:block;font-weight:600;font-size:12px;">Ad Soyad</label>
                        <input type="text" id="editName" value="${user.name}" style="width:100%;padding:6px 10px;border:1px solid #d1d5db;border-radius:6px;">
                    </div>
                    <div>
                        <label style="display:block;font-weight:600;font-size:12px;">Email</label>
                        <input type="email" id="editEmail" value="${user.email}" style="width:100%;padding:6px 10px;border:1px solid #d1d5db;border-radius:6px;">
                    </div>
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px;">
                    <div>
                        <label style="display:block;font-weight:600;font-size:12px;">Telefon</label>
                        <input type="text" id="editPhone" value="${user.phone || ''}" style="width:100%;padding:6px 10px;border:1px solid #d1d5db;border-radius:6px;">
                    </div>
                    <div>
                        <label style="display:block;font-weight:600;font-size:12px;">TC Kimlik</label>
                        <input type="text" id="editTc" value="${user.tc_no || ''}" style="width:100%;padding:6px 10px;border:1px solid #d1d5db;border-radius:6px;">
                    </div>
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:8px;background:#f9fafb;padding:10px;border-radius:6px;">
                    <div>
                        <label style="display:block;font-weight:600;font-size:11px;color:#8B5CF6;">KV</label>
                        <input type="number" id="editKv" value="${user.kv || 0}" step="0.01" style="width:100%;padding:6px 8px;border:1px solid #d1d5db;border-radius:4px;">
                    </div>
                    <div>
                        <label style="display:block;font-weight:600;font-size:11px;color:#3B82F6;">Sol CV</label>
                        <input type="number" id="editLeftCv" value="${user.left_cv || 0}" step="0.01" style="width:100%;padding:6px 8px;border:1px solid #d1d5db;border-radius:4px;">
                    </div>
                    <div>
                        <label style="display:block;font-weight:600;font-size:11px;color:#3B82F6;">Sağ CV</label>
                        <input type="number" id="editRightCv" value="${user.right_cv || 0}" step="0.01" style="width:100%;padding:6px 8px;border:1px solid #d1d5db;border-radius:4px;">
                    </div>
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:4px;background:#f0fdf4;padding:10px;border-radius:6px;">
                    <div>
                        <label style="display:block;font-weight:600;font-size:11px;color:#10B981;">Sol PV</label>
                        <input type="number" id="editLeftPv" value="${user.left_pv || 0}" step="0.01" style="width:100%;padding:6px 8px;border:1px solid #d1d5db;border-radius:4px;">
                    </div>
                    <div>
                        <label style="display:block;font-weight:600;font-size:11px;color:#10B981;">Sağ PV</label>
                        <input type="number" id="editRightPv" value="${user.right_pv || 0}" step="0.01" style="width:100%;padding:6px 8px;border:1px solid #d1d5db;border-radius:4px;">
                    </div>
                    <div>
                        <label style="display:block;font-weight:600;font-size:11px;color:#F59E0B;">Kişisel PV</label>
                        <input type="number" id="editPersonalPv" value="${user.personal_pv || 0}" step="0.01" style="width:100%;padding:6px 8px;border:1px solid #d1d5db;border-radius:4px;">
                    </div>
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px;">
                    <div>
                        <label style="display:block;font-weight:600;font-size:12px;">Kariyer</label>
                        <select id="editCareer" style="width:100%;padding:6px 10px;border:1px solid #d1d5db;border-radius:6px;">
                            ${['Starter','Pioneer','Star','Leader','Emerald','Diamond','Blue Diamond','Green Diamond','Red Diamond'].map(c => 
                                `<option value="${c}" ${user.career_level === c ? 'selected' : ''}>${c}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div>
                        <label style="display:block;font-weight:600;font-size:12px;">Plan</label>
                        <select id="editPlan" style="width:100%;padding:6px 10px;border:1px solid #d1d5db;border-radius:6px;">
                            <option value="free" ${user.plan_type === 'free' ? 'selected' : ''}>Ücretsiz</option>
                            <option value="Lite" ${user.plan_type === 'Lite' ? 'selected' : ''}>Lite</option>
                            <option value="Plus" ${user.plan_type === 'Plus' ? 'selected' : ''}>Plus</option>
                            <option value="Pro" ${user.plan_type === 'Pro' ? 'selected' : ''}>Pro</option>
                        </select>
                    </div>
                </div>

                <div style="margin-top:8px;">
                    <label style="display:block;font-weight:600;font-size:12px;">Admin Yetkisi</label>
                    <select id="editAdmin" style="width:100%;padding:6px 10px;border:1px solid #d1d5db;border-radius:6px;">
                        <option value="false" ${!user.is_admin ? 'selected' : ''}>Hayır</option>
                        <option value="true" ${user.is_admin ? 'selected' : ''}>Evet</option>
                    </select>
                </div>

                <div style="border-top:2px solid #e5e7eb;padding-top:12px;margin-top:12px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                        <span style="font-weight:600;font-size:14px;">📜 Satın Alma Geçmişi</span>
                        <button onclick="refreshHistory(${user.id})" style="padding:4px 12px;border-radius:4px;border:1px solid #3b82f6;background:white;color:#3b82f6;cursor:pointer;font-size:12px;">🔄 Yenile</button>
                    </div>
                    <div id="historyContainer" style="max-height:200px;overflow-y:auto;font-size:12px;">
                        <table style="width:100%;border-collapse:collapse;">
                            <thead>
                                <tr style="background:#f9fafb;border-bottom:1px solid #e5e7eb;">
                                    <th style="padding:4px 6px;text-align:left;">Plan</th>
                                    <th style="padding:4px 6px;text-align:left;">Tutar</th>
                                    <th style="padding:4px 6px;text-align:left;">Durum</th>
                                    <th style="padding:4px 6px;text-align:left;">Tarih</th>
                                    <th style="padding:4px 6px;text-align:left;">İşlem</th>
                                </tr>
                            </thead>
                            <tbody>${historyHtml}</tbody>
                        </table>
                    </div>
                </div>

                <div style="display:flex;gap:8px;margin-top:12px;">
                    <button onclick="saveEdit()" style="flex:1;padding:10px;background:#3b82f6;color:white;border:none;border-radius:6px;cursor:pointer;">💾 Kaydet</button>
                    <button onclick="closeEdit()" style="flex:1;padding:10px;background:#6b7280;color:white;border:none;border-radius:6px;cursor:pointer;">İptal</button>
                </div>
            </div>
        </div>
    `;
    closeEdit();
    document.body.insertAdjacentHTML('beforeend', html);
}

function closeEdit() {
    const el = document.getElementById('editModal');
    if (el) el.remove();
}

async function loadUserPurchases(userId) {
    try {
        const token = localStorage.getItem('chatchip_token');
        const res = await fetch(`https://chatchip-production.up.railway.app/api/admin/users/${userId}/purchases`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        return data.success ? data.purchases : [];
    } catch (e) {
        return [];
    }
}

async function refreshHistory(userId) {
    const container = document.getElementById('historyContainer');
    container.innerHTML = '<div style="text-align:center;padding:8px;color:#6b7280;">⏳ Yükleniyor...</div>';
    try {
        const purchases = await loadUserPurchases(userId);
        let html = '';
        if (purchases && purchases.length > 0) {
            html = purchases.map(p => `
                <tr style="border-bottom:1px solid #f3f4f6;">
                    <td style="padding:4px 6px;">${p.plan_name}</td>
                    <td style="padding:4px 6px;">$${p.amount}</td>
                    <td style="padding:4px 6px;color:${p.status === 'approved' ? '#10B981' : p.status === 'refunded' ? '#ef4444' : '#F59E0B'};font-weight:600;">
                        ${p.status === 'approved' ? '✅ Onaylandı' : p.status === 'refunded' ? '❌ İade Edildi' : '⏳ Bekliyor'}
                    </td>
                    <td style="padding:4px 6px;">${new Date(p.created_at).toLocaleDateString('tr-TR')}</td>
                    <td style="padding:4px 6px;">
                        ${p.status === 'approved' ? `<button onclick="refundPurchase(${p.id}, ${userId})" style="padding:2px 8px;border-radius:4px;border:1px solid #F59E0B;background:rgba(245,158,11,0.1);color:#D97706;cursor:pointer;font-size:11px;">🔄 İade</button>` : '-'}
                    </td>
                </tr>
            `).join('');
        } else {
            html = '<tr><td colspan="5" style="text-align:center;padding:12px;color:#6b7280;">📭 Satın alma geçmişi yok</td></tr>';
        }
        container.innerHTML = `<table style="width:100%;border-collapse:collapse;"><thead><tr style="background:#f9fafb;border-bottom:1px solid #e5e7eb;"><th style="padding:4px 6px;text-align:left;">Plan</th><th style="padding:4px 6px;text-align:left;">Tutar</th><th style="padding:4px 6px;text-align:left;">Durum</th><th style="padding:4px 6px;text-align:left;">Tarih</th><th style="padding:4px 6px;text-align:left;">İşlem</th></tr></thead><tbody>${html}</tbody></table>`;
    } catch (e) {
        container.innerHTML = '<div style="color:red;text-align:center;padding:8px;">❌ Yüklenemedi</div>';
    }
}

async function saveEdit() {
    const id = document.getElementById('editId').value;
    const name = document.getElementById('editName').value.trim();
    const email = document.getElementById('editEmail').value.trim();
    const phone = document.getElementById('editPhone').value.trim();
    const tc_no = document.getElementById('editTc').value.trim();
    const career_level = document.getElementById('editCareer').value;
    const plan_type = document.getElementById('editPlan').value;
    const is_admin = document.getElementById('editAdmin').value === 'true';
    const kv = parseFloat(document.getElementById('editKv').value) || 0;
    const left_cv = parseFloat(document.getElementById('editLeftCv').value) || 0;
    const right_cv = parseFloat(document.getElementById('editRightCv').value) || 0;
    const left_pv = parseFloat(document.getElementById('editLeftPv').value) || 0;
    const right_pv = parseFloat(document.getElementById('editRightPv').value) || 0;
    const personal_pv = parseFloat(document.getElementById('editPersonalPv').value) || 0;

    if (!name || !email) { alert('Ad ve Email zorunlu!'); return; }

    try {
        const token = localStorage.getItem('chatchip_token');
        const res = await fetch(`https://chatchip-production.up.railway.app/api/admin/users/${id}`, {
            method: 'PUT',
            headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone, tc_no, career_level, plan_type, is_admin, kv, left_cv, right_cv, left_pv, right_pv, personal_pv })
        });
        const data = await res.json();
        if (data.success) {
            alert('✅ Kullanıcı güncellendi!');
            closeEdit();
            loadAdmin();
        } else {
            alert('❌ ' + (data.error || 'Güncelleme başarısız'));
        }
    } catch (e) {
        alert('❌ ' + e.message);
    }
}

// ============================================================
// 🗑️ KULLANICI SİL
// ============================================================

async function deleteUser(id) {
    if (!confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return;
    try {
        const token = localStorage.getItem('chatchip_token');
        const res = await fetch(`https://chatchip-production.up.railway.app/api/admin/users/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        if (data.success) {
            alert('✅ Kullanıcı silindi!');
            loadAdmin();
        } else {
            alert('❌ ' + data.error);
        }
    } catch (e) {
        alert('❌ ' + e.message);
    }
}

// ============================================================
// ➕ KULLANICI EKLE
// ============================================================

function openAddUser() {
    const mobile = isMobile();
    const html = `
        <div id="addModal" style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;">
            <div style="background:white;padding:${mobile ? '16px' : '24px'};border-radius:12px;width:450px;max-width:100%;max-height:90vh;overflow-y:auto;">
                <h3 style="margin-bottom:16px;font-size:${mobile ? '16px' : '20px'};">➕ Yeni Kullanıcı</h3>
                <div style="margin-bottom:8px;">
                    <label style="display:block;font-weight:600;font-size:${mobile ? '11px' : '12px'};">Ad Soyad</label>
                    <input type="text" id="addName" style="width:100%;padding:6px 10px;border:1px solid #d1d5db;border-radius:6px;font-size:${mobile ? '13px' : '14px'};">
                </div>
                <div style="margin-bottom:8px;">
                    <label style="display:block;font-weight:600;font-size:${mobile ? '11px' : '12px'};">Email</label>
                    <input type="email" id="addEmail" style="width:100%;padding:6px 10px;border:1px solid #d1d5db;border-radius:6px;font-size:${mobile ? '13px' : '14px'};">
                </div>
                <div style="margin-bottom:8px;">
                    <label style="display:block;font-weight:600;font-size:${mobile ? '11px' : '12px'};">Telefon</label>
                    <input type="text" id="addPhone" style="width:100%;padding:6px 10px;border:1px solid #d1d5db;border-radius:6px;font-size:${mobile ? '13px' : '14px'};">
                </div>
                <div style="margin-bottom:8px;">
                    <label style="display:block;font-weight:600;font-size:${mobile ? '11px' : '12px'};">Şifre</label>
                    <input type="password" id="addPassword" style="width:100%;padding:6px 10px;border:1px solid #d1d5db;border-radius:6px;font-size:${mobile ? '13px' : '14px'};">
                </div>
                <div style="margin-bottom:8px;">
                    <label style="display:block;font-weight:600;font-size:${mobile ? '11px' : '12px'};">Sponsor ID</label>
                    <input type="number" id="addSponsor" value="1" style="width:100%;padding:6px 10px;border:1px solid #d1d5db;border-radius:6px;font-size:${mobile ? '13px' : '14px'};">
                </div>
                <div style="margin-bottom:12px;">
                    <label style="display:block;font-weight:600;font-size:${mobile ? '11px' : '12px'};">Pozisyon</label>
                    <select id="addPosition" style="width:100%;padding:6px 10px;border:1px solid #d1d5db;border-radius:6px;font-size:${mobile ? '13px' : '14px'};">
                        <option value="left">Sol</option>
                        <option value="right">Sağ</option>
                    </select>
                </div>
                <div style="display:flex;gap:8px;">
                    <button onclick="saveAddUser()" style="flex:1;padding:${mobile ? '8px' : '10px'};background:#3b82f6;color:white;border:none;border-radius:6px;cursor:pointer;font-size:${mobile ? '14px' : '16px'};font-weight:600;">➕ Ekle</button>
                    <button onclick="closeAdd()" style="flex:1;padding:${mobile ? '8px' : '10px'};background:#6b7280;color:white;border:none;border-radius:6px;cursor:pointer;font-size:${mobile ? '14px' : '16px'};font-weight:600;">İptal</button>
                </div>
            </div>
        </div>
    `;
    closeAdd();
    document.body.insertAdjacentHTML('beforeend', html);
}

function closeAdd() {
    const el = document.getElementById('addModal');
    if (el) el.remove();
}

async function saveAddUser() {
    const name = document.getElementById('addName').value.trim();
    const email = document.getElementById('addEmail').value.trim();
    const phone = document.getElementById('addPhone').value.trim();
    const password = document.getElementById('addPassword').value;
    const sponsor_id = parseInt(document.getElementById('addSponsor').value) || 1;
    const position = document.getElementById('addPosition').value;

    if (!name || !email || !password) {
        alert('Ad, Email ve Şifre zorunlu!');
        return;
    }

    try {
        const token = localStorage.getItem('chatchip_token');
        const res = await fetch('https://chatchip-production.up.railway.app/api/auth/register', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone, password, sponsor_id, position })
        });
        const data = await res.json();
        if (data.success) {
            alert('✅ Kullanıcı eklendi!');
            closeAdd();
            loadAdmin();
        } else {
            alert('❌ ' + (data.error || 'Ekleme başarısız'));
        }
    } catch (e) {
        alert('❌ ' + e.message);
    }
}

// ============================================================
// ✅ ONAYLA / REDDET
// ============================================================

async function approveRequest(id) {
    if (!confirm('Onayla?')) return;
    try {
        const token = localStorage.getItem('chatchip_token');
        const res = await fetch(`https://chatchip-production.up.railway.app/api/purchase-requests/${id}/approve`, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        if (data.success) {
            alert('✅ Onaylandı!');
            loadRequests();
            loadAdmin();
        } else {
            alert('❌ ' + data.error);
        }
    } catch (e) {
        alert('❌ ' + e.message);
    }
}

async function rejectRequest(id) {
    if (!confirm('Reddet?')) return;
    try {
        const token = localStorage.getItem('chatchip_token');
        const res = await fetch(`https://chatchip-production.up.railway.app/api/purchase-requests/${id}/reject`, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        if (data.success) {
            alert('❌ Reddedildi');
            loadRequests();
        } else {
            alert('❌ ' + data.error);
        }
    } catch (e) {
        alert('❌ ' + e.message);
    }
}

// ============================================================
// 🔄 REFUND (İADE)
// ============================================================

async function refundPurchase(purchaseId, userId) {
    if (!confirm('İade et?')) return;
    try {
        const token = localStorage.getItem('chatchip_token');
        const res = await fetch(`https://chatchip-production.up.railway.app/api/refund/purchase/${purchaseId}`, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        if (data.success) {
            alert('✅ İade başarılı!');
            loadAdmin();
        } else {
            alert('❌ ' + (data.error || 'İade başarısız'));
        }
    } catch (e) {
        alert('❌ ' + e.message);
    }
}

// Pencere yeniden boyutlandığında tabloyu yenile
window.addEventListener('resize', function() {
    if (document.getElementById('panelUsers') && document.getElementById('panelUsers').style.display !== 'none') {
        document.getElementById('panelUsers').innerHTML = renderUserTable();
    }
});
