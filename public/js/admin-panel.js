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
            <button onclick="switchTab('business')" id="tabBusiness" style="flex:1;padding:${isMobile() ? '6px 8px' : '8px 16px'};border:none;border-radius:6px;background:transparent;color:#6b7280;cursor:pointer;font-size:${isMobile() ? '11px' : '13px'};" title="AI İşletmeler">🤖</button>
            <button onclick="switchTab('partners')" id="tabPartners" style="flex:1;padding:${isMobile() ? '6px 8px' : '8px 16px'};border:none;border-radius:6px;background:transparent;color:#6b7280;cursor:pointer;font-size:${isMobile() ? '11px' : '13px'};" title="Partner / Bayi">🤝</button>
        </div>

        <!-- 🔥 ARA INPUT - TABLO DIŞINDA (SABİT) -->
        <div id="searchContainer" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:6px;">
            <div style="display:flex;gap:6px;flex:1;min-width:${isMobile() ? '120px' : '200px'};">
                <input type="text" id="searchInput" placeholder="🔍 Ara..." 
                    style="flex:1;padding:${isMobile() ? '6px 8px' : '8px 12px'};border:1px solid #d1d5db;border-radius:6px;font-size:${isMobile() ? '11px' : '13px'};outline:none;min-width:${isMobile() ? '60px' : '120px'};background:#ffffff;color:#333333;"
                    oninput="searchUsers(this.value)" autocomplete="off">
                <button onclick="clearSearch()" style="padding:${isMobile() ? '4px 8px' : '6px 12px'};border-radius:6px;border:1px solid #d1d5db;background:white;cursor:pointer;font-size:${isMobile() ? '10px' : '12px'};">✕</button>
            </div>
            <button onclick="openAddUser()" style="padding:${isMobile() ? '4px 10px' : '6px 14px'};border-radius:6px;border:1px solid #3b82f6;background:#3b82f6;color:white;cursor:pointer;font-size:${isMobile() ? '11px' : '13px'};white-space:nowrap;">➕</button>
        </div>

        <!-- KULLANICI TABLOSU -->
        <div id="panelUsers">${renderUserTable()}</div>
        <div id="panelRequests" style="display:none;">📋 Bekleyen istekler yükleniyor...</div>
        <div id="panelReports" style="display:none;">📊 Raporlar yükleniyor...</div>
        <div id="panelBusiness" style="display:none;">🤖 İşletme verileri yükleniyor...</div>
        <div id="panelPartners" style="display:none;">🤝 Partner verileri yükleniyor...</div>
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
        input.focus();
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
    document.querySelectorAll('#panelUsers, #panelRequests, #panelReports, #panelBusiness, #panelPartners').forEach(el => el.style.display = 'none');
    document.querySelectorAll('#tabUsers, #tabRequests, #tabReports, #tabBusiness, #tabPartners').forEach(el => {
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
    } else if (tab === 'business') {
        document.getElementById('panelBusiness').style.display = 'block';
        document.getElementById('tabBusiness').style.background = '#3b82f6';
        document.getElementById('tabBusiness').style.color = '#fff';
        loadBusinessOverview();
    } else if (tab === 'partners') {
        document.getElementById('panelPartners').style.display = 'block';
        document.getElementById('tabPartners').style.background = '#3b82f6';
        document.getElementById('tabPartners').style.color = '#fff';
        loadPartners();
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

        // 🔥 Haftalık kazanç tablosu
        let weeklyTableHtml = '';
        if (weekly.data && weekly.data.length > 0) {
            weeklyTableHtml = `
                <div style="margin-top:12px;background:#fff;border-radius:8px;border:1px solid #e5e7eb;overflow-x:auto;padding:8px;">
                    <table style="width:100%;border-collapse:collapse;font-size:${mobile ? '10px' : '12px'};">
                        <thead>
                            <tr style="background:#f9fafb;border-bottom:2px solid #e5e7eb;">
                                <th style="padding:6px 10px;text-align:left;">Kullanıcı</th>
                                <th style="padding:6px 10px;text-align:left;">Kazanç</th>
                                <th style="padding:6px 10px;text-align:left;">Tarih</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${weekly.data.map(w => `
                                <tr style="border-bottom:1px solid #f3f4f6;">
                                    <td style="padding:6px 10px;">${w.user_name || 'Bilinmiyor'}</td>
                                    <td style="padding:6px 10px;color:#10B981;font-weight:600;">$${parseFloat(w.earned).toFixed(2)}</td>
                                    <td style="padding:6px 10px;font-size:${mobile ? '9px' : '11px'};color:#6b7280;">${w.match_date ? new Date(w.match_date).toLocaleDateString('tr-TR') : '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            weeklyTableHtml = `<div style="margin-top:12px;padding:16px;background:#f9fafb;border-radius:8px;text-align:center;color:#6b7280;font-size:${mobile ? '11px' : '13px'};">📭 Henüz haftalık kazanç yok</div>`;
        }

        // 🔥 Kariyer ödülleri tablosu
        let careerTableHtml = '';
        if (career.data && career.data.length > 0) {
            careerTableHtml = `
                <div style="margin-top:12px;background:#fff;border-radius:8px;border:1px solid #e5e7eb;overflow-x:auto;padding:8px;">
                    <table style="width:100%;border-collapse:collapse;font-size:${mobile ? '10px' : '12px'};">
                        <thead>
                            <tr style="background:#f9fafb;border-bottom:2px solid #e5e7eb;">
                                <th style="padding:6px 10px;text-align:left;">Kullanıcı</th>
                                <th style="padding:6px 10px;text-align:left;">Ödül</th>
                                <th style="padding:6px 10px;text-align:left;">Kariyer</th>
                                <th style="padding:6px 10px;text-align:left;">Tarih</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${career.data.map(c => `
                                <tr style="border-bottom:1px solid #f3f4f6;">
                                    <td style="padding:6px 10px;">${c.user_name || 'Bilinmiyor'}</td>
                                    <td style="padding:6px 10px;color:#8B5CF6;font-weight:600;">$${parseFloat(c.reward).toFixed(2)}</td>
                                    <td style="padding:6px 10px;">${c.new_career || '-'}</td>
                                    <td style="padding:6px 10px;font-size:${mobile ? '9px' : '11px'};color:#6b7280;">${c.calc_date ? new Date(c.calc_date).toLocaleDateString('tr-TR') : '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            careerTableHtml = `<div style="margin-top:12px;padding:16px;background:#f9fafb;border-radius:8px;text-align:center;color:#6b7280;font-size:${mobile ? '11px' : '13px'};">📭 Henüz kariyer ödülü yok</div>`;
        }

        container.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                <span style="font-weight:600;font-size:${mobile ? '12px' : '14px'};">📊 Raporlar</span>
                <div style="display:flex;gap:4px;">
                    <button onclick="exportCSV('users')" style="padding:${mobile ? '4px 8px' : '6px 12px'};border-radius:4px;border:1px solid #d1d5db;background:white;cursor:pointer;font-size:${mobile ? '9px' : '12px'};">📥</button>
                </div>
            </div>

            <!-- Özet Kartları -->
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

            <!-- Haftalık Kazançlar -->
            <div style="margin-top:12px;">
                <div style="font-weight:600;font-size:${mobile ? '11px' : '13px'};color:#1f2937;margin-bottom:6px;">📅 Haftalık Kazançlar</div>
                ${weeklyTableHtml}
            </div>

            <!-- Kariyer Ödülleri -->
            <div style="margin-top:16px;">
                <div style="font-weight:600;font-size:${mobile ? '11px' : '13px'};color:#1f2937;margin-bottom:6px;">🏆 Kariyer Ödülleri</div>
                ${careerTableHtml}
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


// ============================================================
// 🤖 AI İŞLETMELER / KOTA OPERASYON PANELİ
// ============================================================
async function loadBusinessOverview() {
    const container = document.getElementById('panelBusiness');
    container.innerHTML = '<div style="text-align:center;padding:30px;">⏳ İşletmeler yükleniyor...</div>';

    try {
        const token = localStorage.getItem('chatchip_token');
        const res = await fetch('https://chatchip-production.up.railway.app/api/admin/business-overview', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'İşletme verileri alınamadı');

        const s = data.summary || {};
        const customers = data.customers || [];
        const mobile = isMobile();

        const cards = [
            ['👥 Müşteri', s.total_customers || 0],
            ['🟢 Aktif', s.active_subscriptions || 0],
            ['🤖 AI Çalışanı', s.total_agents || 0],
            ['▦ QR', s.total_qr || 0],
            ['💬 Bu Ay', s.monthly_messages || 0],
            ['⚠️ Kota %80+', s.quota_warning_80 || 0],
            ['⛔ Kota Bitti', s.quota_exhausted || 0]
        ].map(([label,value]) => `
            <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:10px;text-align:center;">
                <div style="font-size:${mobile?'16px':'22px'};font-weight:700;">${value}</div>
                <div style="font-size:${mobile?'9px':'11px'};color:#6b7280;margin-top:3px;">${label}</div>
            </div>`).join('');

        let rows = customers.map(c => {
            const pct = Number(c.monthly_percent || 0);
            const status = c.subscription_active ? '🟢 Aktif' : '⚪ Pasif';
            const last = c.last_activity_at ? new Date(c.last_activity_at).toLocaleString('tr-TR') : '-';
            const expires = c.plan_expires_at ? new Date(c.plan_expires_at).toLocaleDateString('tr-TR') : '-';
            return `
              <tr style="border-bottom:1px solid #f3f4f6;">
                <td style="padding:8px 10px;"><strong>${c.name || '-'}</strong><br><span style="font-size:10px;color:#6b7280;">${c.email || ''}</span></td>
                <td style="padding:8px 10px;">${c.plan_type || 'free'}<br><span style="font-size:10px;color:#6b7280;">${expires}</span></td>
                <td style="padding:8px 10px;">${status}</td>
                <td style="padding:8px 10px;min-width:160px;">
                    <div style="display:flex;justify-content:space-between;font-size:11px;"><span>${c.monthly_used || 0} / ${c.monthly_limit || 2000}</span><strong>${pct}%</strong></div>
                    <div style="height:7px;background:#e5e7eb;border-radius:999px;overflow:hidden;margin-top:5px;"><div style="height:100%;width:${Math.min(100,pct)}%;background:${pct>=100?'#ef4444':pct>=80?'#f59e0b':'#10b981'};"></div></div>
                    <div style="font-size:10px;color:#6b7280;margin-top:3px;">Kalan: ${c.monthly_remaining || 0}</div>
                </td>
                <td style="padding:8px 10px;text-align:center;">${c.agent_count || 0}</td>
                <td style="padding:8px 10px;text-align:center;">${c.qr_count || 0}</td>
                <td style="padding:8px 10px;text-align:center;">${c.conversation_count || 0}</td>
                <td style="padding:8px 10px;text-align:center;">${c.purchase_intent_count || 0}</td>
                <td style="padding:8px 10px;font-size:11px;white-space:nowrap;">${last}</td>
                <td style="padding:8px 10px;text-align:center;"><button onclick="startSupportSession(${c.id})" style="padding:5px 9px;border:1px solid #3b82f6;background:#fff;color:#2563eb;border-radius:6px;cursor:pointer;font-size:11px;">🛠️ Destek</button></td>
              </tr>`;
        }).join('');

        if (!rows) rows = '<tr><td colspan="10" style="padding:25px;text-align:center;color:#6b7280;">Henüz müşteri verisi yok.</td></tr>';

        container.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                <div><strong>🤖 AI İşletme Operasyonları</strong><div style="font-size:11px;color:#6b7280;">Aylık paket kotası: ${data.limit || 2000} mesaj</div></div>
                <button onclick="loadBusinessOverview()" style="padding:6px 12px;border:1px solid #d1d5db;background:#fff;border-radius:6px;cursor:pointer;">🔄</button>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(105px,1fr));gap:7px;margin-bottom:12px;">${cards}</div>
            <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;overflow-x:auto;">
              <table style="width:100%;border-collapse:collapse;font-size:${mobile?'10px':'12px'};min-width:1000px;">
                <thead><tr style="background:#f9fafb;border-bottom:2px solid #e5e7eb;">
                  <th style="padding:8px 10px;text-align:left;">Müşteri</th><th style="padding:8px 10px;">Plan</th><th style="padding:8px 10px;">Durum</th>
                  <th style="padding:8px 10px;">Aylık Kota</th><th style="padding:8px 10px;">AI</th><th style="padding:8px 10px;">QR</th>
                  <th style="padding:8px 10px;">Görüşme</th><th style="padding:8px 10px;">Satın Alma Niyeti</th><th style="padding:8px 10px;">Son Aktivite</th><th style="padding:8px 10px;">Destek</th>
                </tr></thead>
                <tbody>${rows}</tbody>
              </table>
            </div>`;
    } catch (e) {
        container.innerHTML = '<div style="color:#ef4444;text-align:center;padding:30px;">❌ ' + e.message + '</div>';
    }
}

async function startSupportSession(userId) {
    try {
        const adminToken = localStorage.getItem('chatchip_token');
        const adminUser = localStorage.getItem('chatchip_user');
        const r = await fetch('https://chatchip-production.up.railway.app/api/admin/support-session/' + encodeURIComponent(userId), {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + adminToken }
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'Destek modu başlatılamadı');

        sessionStorage.setItem('chatchip_support_admin_token', adminToken);
        sessionStorage.setItem('chatchip_support_admin_user', adminUser || '');
        sessionStorage.setItem('chatchip_support_customer', JSON.stringify(d.customer || {}));
        localStorage.setItem('chatchip_token', d.token);
        localStorage.setItem('chatchip_user', JSON.stringify(d.customer || {}));
        window.location.href = '/ai-employees.html?support=1';
    } catch (e) {
        alert('Destek modu açılamadı: ' + e.message);
    }
}


// ============================================================
// 🤝 PARTNER / BAYİ YÖNETİMİ — MLM'DEN BAĞIMSIZ
// ============================================================
async function adminApi(path, options={}) {
    const token=localStorage.getItem('chatchip_token');
    const r=await fetch('https://chatchip-production.up.railway.app/api/admin'+path,{
        ...options,
        headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json',...(options.headers||{})}
    });
    const d=await r.json();
    if(!r.ok) throw new Error(d.error||'İşlem başarısız');
    return d;
}

async function loadPartners(){
    const c=document.getElementById('panelPartners');
    c.innerHTML='<div style="text-align:center;padding:30px;">⏳ Partnerler yükleniyor...</div>';
    try{
        const [pd,ad]=await Promise.all([adminApi('/partners'),adminApi('/partner-assignments')]);
        const partners=pd.partners||[], assignments=ad.assignments||[];
        const rows=partners.map(p=>`<tr style="border-bottom:1px solid #f3f4f6;">
            <td style="padding:8px"><strong>${p.name}</strong><br><small>${p.email||''} ${p.phone||''}</small></td>
            <td style="padding:8px"><code>${p.partner_code}</code></td>
            <td style="padding:8px;text-align:center">${p.status==='active'?'🟢 Aktif':'⚪ Pasif'}</td>
            <td style="padding:8px;text-align:center">${p.customer_count||0}</td>
            <td style="padding:8px;text-align:center">${p.active_customer_count||0}</td>
            <td style="padding:8px;text-align:center">% ${Number(p.commission_rate||0).toFixed(1)}</td>
            <td style="padding:8px;text-align:center"><button onclick="assignPartnerPanelAccount(${p.id})" style="padding:4px 7px;border:1px solid #3b82f6;background:white;color:#2563eb;border-radius:5px;cursor:pointer">${p.user_id?'Panel Hesabını Değiştir':'Panel Hesabı Ata'}</button></td>
        </tr>`).join('')||'<tr><td colspan="6" style="padding:25px;text-align:center;color:#6b7280">Henüz partner yok.</td></tr>';
        const ar=assignments.map(a=>`<tr style="border-bottom:1px solid #f3f4f6;"><td style="padding:7px">${a.customer_name||'-'}<br><small>${a.customer_email||''}</small></td><td style="padding:7px">${a.partner_name} <code>${a.partner_code}</code></td><td style="padding:7px;text-align:center"><button onclick="removePartnerAssignment(${a.user_id})" style="border:1px solid #ef4444;background:white;color:#ef4444;border-radius:5px;padding:4px 7px;cursor:pointer">Kaldır</button></td></tr>`).join('')||'<tr><td colspan="3" style="padding:20px;text-align:center;color:#6b7280">Henüz işletme ataması yok.</td></tr>';
        c.innerHTML=`
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:12px"><div><strong>🤝 Partner / Bayi Yönetimi</strong><div style="font-size:11px;color:#6b7280">MLM sisteminden bağımsız satış ve attribution altyapısı.</div></div><button onclick="openPartnerCreate()" style="padding:7px 12px;background:#3b82f6;color:white;border:0;border-radius:6px;cursor:pointer">➕ Partner</button></div>
          <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;overflow-x:auto;margin-bottom:14px"><table style="width:100%;border-collapse:collapse;font-size:12px;min-width:650px"><thead><tr style="background:#f9fafb"><th style="padding:8px;text-align:left">Partner</th><th>Kod</th><th>Durum</th><th>Müşteri</th><th>Aktif</th><th>Komisyon</th><th>Panel</th></tr></thead><tbody>${rows}</tbody></table></div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:7px"><strong>🏢 İşletme → Partner Bağlantısı</strong><button onclick="openPartnerAssign()" style="padding:6px 10px;border:1px solid #3b82f6;background:white;color:#2563eb;border-radius:6px;cursor:pointer">🔗 İşletme Ata</button></div>
          <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px;min-width:550px"><thead><tr style="background:#f9fafb"><th style="padding:8px;text-align:left">İşletme</th><th>Partner</th><th>İşlem</th></tr></thead><tbody>${ar}</tbody></table></div>`;
    }catch(e){c.innerHTML='<div style="color:#ef4444;text-align:center;padding:30px">❌ '+e.message+'</div>'}
}

function openPartnerCreate(){
    const name=prompt('Partner / danışman adı:'); if(!name)return;
    const email=prompt('E-posta (opsiyonel):')||'';
    const phone=prompt('Telefon (opsiyonel):')||'';
    const rate=prompt('Devam komisyon oranı (%)','10'); if(rate===null)return;
    adminApi('/partners',{method:'POST',body:JSON.stringify({name,email,phone,commission_rate:Number(rate)})}).then(d=>{alert('✅ Partner oluşturuldu. Kod: '+d.partner.partner_code);loadPartners()}).catch(e=>alert('❌ '+e.message));
}

async function openPartnerAssign(){
    try{
        const [pd,bd]=await Promise.all([adminApi('/partners'),adminApi('/business-overview')]);
        const partners=(pd.partners||[]).filter(p=>p.status==='active');
        const customers=bd.customers||[];
        if(!partners.length)return alert('Önce aktif bir partner oluşturun.');
        if(!customers.length)return alert('Bağlanabilecek işletme bulunamadı.');

        document.getElementById('partnerAssignModal')?.remove();
        const customerOptions=customers.map(x=>`<option value="${x.id}">${escapePartnerHtml(x.name||'İsimsiz')} — ${escapePartnerHtml(x.email||'')}</option>`).join('');
        const partnerOptions=partners.map(x=>`<option value="${x.id}">${escapePartnerHtml(x.name)} — ${escapePartnerHtml(x.partner_code)}</option>`).join('');
        document.body.insertAdjacentHTML('beforeend',`
          <div id="partnerAssignModal" style="position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px">
            <div style="background:white;width:460px;max-width:100%;border-radius:12px;padding:20px">
              <h3 style="margin:0 0 16px">🔗 İşletmeyi Partnere Bağla</h3>
              <label style="display:block;font-size:12px;font-weight:700;margin-bottom:5px">İşletme</label>
              <select id="partnerAssignCustomer" style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:7px;margin-bottom:14px">${customerOptions}</select>
              <label style="display:block;font-size:12px;font-weight:700;margin-bottom:5px">Partner / Danışman</label>
              <select id="partnerAssignPartner" style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:7px;margin-bottom:18px">${partnerOptions}</select>
              <div style="display:flex;gap:8px">
                <button onclick="savePartnerAssignment()" style="flex:1;padding:10px;background:#3b82f6;color:white;border:0;border-radius:7px;cursor:pointer;font-weight:700">Bağla</button>
                <button onclick="document.getElementById('partnerAssignModal')?.remove()" style="flex:1;padding:10px;background:#f3f4f6;border:0;border-radius:7px;cursor:pointer">İptal</button>
              </div>
            </div>
          </div>`);
    }catch(e){alert('❌ '+e.message)}
}

function escapePartnerHtml(v){
    return String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}

async function savePartnerAssignment(){
    const userId=Number(document.getElementById('partnerAssignCustomer')?.value);
    const partnerId=Number(document.getElementById('partnerAssignPartner')?.value);
    if(!userId||!partnerId)return alert('İşletme ve partner seçin.');
    try{
        await adminApi('/users/'+encodeURIComponent(userId)+'/partner',{method:'PUT',body:JSON.stringify({partner_id:partnerId})});
        document.getElementById('partnerAssignModal')?.remove();
        alert('✅ İşletme partnere bağlandı.');
        loadPartners();
    }catch(e){alert('❌ '+e.message)}
}

async function removePartnerAssignment(userId){
    if(!confirm('Bu işletmenin partner bağlantısı kaldırılsın mı?'))return;
    try{await adminApi('/users/'+encodeURIComponent(userId)+'/partner',{method:'DELETE'});loadPartners()}catch(e){alert('❌ '+e.message)}
}

async function assignPartnerPanelAccount(partnerId){
 try{
  const users=usersData||[];
  if(!users.length)return alert('Kullanıcı listesi bulunamadı.');
  document.getElementById('partnerAccountModal')?.remove();
  const options=users.map(u=>`<option value="${u.id}">${escapePartnerHtml(u.name||'İsimsiz')} — ${escapePartnerHtml(u.email||'')}</option>`).join('');
  document.body.insertAdjacentHTML('beforeend',`
   <div id="partnerAccountModal" style="position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px">
    <div style="background:white;width:500px;max-width:100%;border-radius:12px;padding:20px">
     <h3 style="margin:0 0 8px">👤 Bayi Panel Hesabı Ata</h3>
     <div style="font-size:12px;color:#6b7280;margin-bottom:12px">Kullanıcıyı adı veya e-postasıyla ara ve seç. Bayilik yetkisini yalnızca merkez atar.</div>
     <input id="partnerAccountSearch" type="text" placeholder="🔍 Kullanıcı ara..." oninput="filterPartnerAccountUsers()" style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:7px;margin-bottom:8px">
     <select id="partnerAccountUser" size="8" style="width:100%;padding:8px;border:1px solid #d1d5db;border-radius:7px;margin-bottom:14px">${options}</select>
     <div style="display:flex;gap:8px">
      <button onclick="savePartnerPanelAccount(${partnerId})" style="flex:1;padding:10px;background:#3b82f6;color:white;border:0;border-radius:7px;cursor:pointer;font-weight:700">Hesabı Ata</button>
      <button onclick="document.getElementById('partnerAccountModal')?.remove()" style="flex:1;padding:10px;background:#f3f4f6;border:0;border-radius:7px;cursor:pointer">İptal</button>
     </div>
    </div>
   </div>`);
  document.getElementById('partnerAccountSearch')?.focus();
 }catch(e){alert('❌ '+e.message)}
}
function filterPartnerAccountUsers(){
 const q=(document.getElementById('partnerAccountSearch')?.value||'').toLowerCase().trim();
 const sel=document.getElementById('partnerAccountUser'); if(!sel)return;
 sel.innerHTML=(usersData||[]).filter(u=>!q||(u.name||'').toLowerCase().includes(q)||(u.email||'').toLowerCase().includes(q)).map(u=>`<option value="${u.id}">${escapePartnerHtml(u.name||'İsimsiz')} — ${escapePartnerHtml(u.email||'')}</option>`).join('');
}
async function savePartnerPanelAccount(partnerId){
 const userId=Number(document.getElementById('partnerAccountUser')?.value);
 if(!userId)return alert('Bir kullanıcı seçin.');
 try{
  await adminApi('/partners/'+encodeURIComponent(partnerId)+'/account',{method:'PUT',body:JSON.stringify({user_id:userId})});
  document.getElementById('partnerAccountModal')?.remove();
  alert('✅ Bayilik panel hesabı merkez tarafından atandı.');
  loadPartners();
 }catch(e){alert('❌ '+e.message)}
}
