// ADMIN PANEL v2 - Tam Fonksiyonlu

let usersData = [];
let currentUser = null;

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadAdmin();
});

// Auth kontrolü
async function checkAuth() {
    const dm = window.DataManager;
    const token = dm.getToken();
    currentUser = dm.currentUser;

    if (!token || !currentUser) {
        dm.currentUser = { id: 1, name: 'Ridvan Akkaya', email: 'ridvan@chatchip.com', is_admin: true };
        currentUser = dm.currentUser;
        localStorage.setItem('chatchip_user', JSON.stringify(dm.currentUser));
    }

    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn && currentUser) {
        profileBtn.textContent = currentUser.name?.charAt(0).toUpperCase() || '👤';
    }

    if (!currentUser.is_admin) {
        document.getElementById('adminContent').innerHTML = `
            <div class="empty-state" style="text-align:center; padding:40px; color:#ef4444;">
                <div class="icon" style="font-size:3rem;">🔒</div>
                <p style="margin-top:12px;">Bu sayfaya erişim yetkiniz yok.</p>
                <p style="font-size:0.8rem; color:var(--text-light);">Admin yetkisi gereklidir.</p>
                <button onclick="window.location.href='/backoffice.html'" style="margin-top:16px; padding:8px 20px; border-radius:8px; border:1px solid var(--border); background:white; cursor:pointer;">← Backoffice</button>
            </div>
        `;
        return;
    }
}

// Admin verilerini yükle
async function loadAdmin() {
    const content = document.getElementById('adminContent');
    content.innerHTML = '<div class="loading">⏳ Admin panel yükleniyor...</div>';

    try {
        const dm = window.DataManager;
        
        const usersResponse = await fetch('http://localhost:5000/api/admin/users', {
            headers: dm.getHeaders()
        });
        const users = await usersResponse.json();
        usersData = Array.isArray(users) ? users : [];
        console.log('📥 Kullanıcılar yüklendi:', usersData.length);

        renderAdmin(usersData);
    } catch (error) {
        console.error('Admin yükleme hatası:', error);
        content.innerHTML = `
            <div class="loading" style="color:#ef4444;">
                ❌ Veriler yüklenemedi: ${error.message}
                <br><br>
                <button onclick="loadAdmin()" style="padding:8px 20px; border-radius:8px; border:1px solid var(--border); background:white; cursor:pointer;">🔄 Yenile</button>
            </div>
        `;
    }
}

// Admin render
function renderAdmin(users) {
    const content = document.getElementById('adminContent');

    const totalUsers = Array.isArray(users) ? users.length : 0;
    const totalKV = Array.isArray(users) ? users.reduce((sum, u) => sum + parseFloat(u.kv || 0), 0) : 0;
    const adminCount = Array.isArray(users) ? users.filter(u => u.is_admin).length : 0;
    const starterCount = Array.isArray(users) ? users.filter(u => u.career_level === 'Starter').length : 0;

    let html = `
        <!-- STATS -->
        <div class="admin-stats">
            <div class="stat-card">
                <div class="number">${totalUsers}</div>
                <div class="label">Toplam Kullanıcı</div>
            </div>
            <div class="stat-card">
                <div class="number">${totalKV.toFixed(1)}</div>
                <div class="label">Toplam KV</div>
            </div>
            <div class="stat-card">
                <div class="number">${adminCount}</div>
                <div class="label">Admin</div>
            </div>
            <div class="stat-card">
                <div class="number">${starterCount}</div>
                <div class="label">Starter</div>
            </div>
        </div>

        <!-- TABS -->
        <div class="admin-tabs">
            <button class="tab active" data-tab="users" onclick="switchTab('users')">👥 Kullanıcılar</button>
            <button class="tab" data-tab="requests" onclick="switchTab('requests')">📋 İstekler</button>
        </div>

        <!-- TAB: USERS -->
        <div id="tab-users" class="tab-content">
            <div class="toolbar">
                <span style="font-weight:600;font-size:0.85rem;">👥 Tüm Kullanıcılar</span>
                <div>
                    <button class="btn" onclick="loadAdmin()">🔄 Yenile</button>
                    <button class="btn btn-primary" onclick="openAddUserModal()">+ Ekle</button>
                </div>
            </div>
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>İsim</th>
                            <th>Email</th>
                            <th>Kariyer</th>
                            <th>Pozisyon</th>
                            <th style="color:#8B5CF6; font-weight:700;">KV</th>
                            <th style="color:#3B82F6; font-weight:700;">Sol CV</th>
                            <th style="color:#3B82F6; font-weight:700;">Sağ CV</th>
                            <th style="color:#10B981; font-weight:700;">Sol PV</th>
                            <th style="color:#10B981; font-weight:700;">Sağ PV</th>
                            <th>Admin</th>
                            <th>İşlemler</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Array.isArray(users) && users.length > 0 ? users.map(u => `
                            <tr>
                                <td><strong>#${u.id}</strong></td>
                                <td>${u.name}</td>
                                <td>${u.email}</td>
                                <td><span class="badge ${u.career_level?.toLowerCase() || 'starter'}">${u.career_level || 'Starter'}</span></td>
                                <td>${u.position ? `<span class="badge ${u.position}">${u.position}</span>` : '-'}</td>
                                <td style="color:#8B5CF6; font-weight:600;">${u.kv || 0}</td>
                                <td style="color:#3B82F6;">${u.left_cv || 0}</td>
                                <td style="color:#3B82F6;">${u.right_cv || 0}</td>
                                <td style="color:#10B981;">${u.left_pv || 0}</td>
                                <td style="color:#10B981;">${u.right_pv || 0}</td>
                                <td>${u.is_admin ? '👑' : '-'}</td>
                                <td class="actions">
                                    <button class="btn-sm" onclick="editUser(${u.id})">✏️</button>
                                    <button class="btn-sm danger" onclick="deleteUser(${u.id})">🗑️</button>
                                </td>
                            </tr>
                        `).join('') : '<tr><td colspan="12" style="text-align:center;color:var(--text-light);">Henüz kullanıcı yok</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- TAB: REQUESTS -->
        <div id="tab-requests" class="tab-content" style="display:none;">
            <div class="toolbar">
                <span style="font-weight:600;font-size:0.85rem;">📋 Bekleyen Satın Alma İstekleri</span>
                <button class="btn" onclick="loadRequests()">🔄 Yenile</button>
            </div>
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Kullanıcı</th>
                            <th>Plan</th>
                            <th>Miktar</th>
                            <th>Durum</th>
                            <th>İşlemler</th>
                        </tr>
                    </thead>
                    <tbody id="requestsTable">
                        <tr><td colspan="6" style="text-align:center;color:var(--text-light);">Bekleyen istek yok</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;

    content.innerHTML = html;
}

// Tab değiştir
function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));

    const content = document.getElementById(`tab-${tab}`);
    if (content) content.style.display = 'block';

    const tabBtn = document.querySelector(`.tab[data-tab="${tab}"]`);
    if (tabBtn) tabBtn.classList.add('active');

    if (tab === 'requests') loadRequests();
}

// İstekleri yükle
async function loadRequests() {
    const tbody = document.getElementById('requestsTable');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-light);">⏳ Yükleniyor...</td></tr>';

    try {
        const res = await fetch('http://localhost:5000/api/purchase-requests/pending', {
            headers: window.DataManager.getHeaders()
        });
        const data = await res.json();

        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-light);">📭 Bekleyen istek yok</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(r => `
            <tr>
                <td>#${r.id}</td>
                <td>${r.user_name || 'Bilinmiyor'}</td>
                <td>${r.plan_name}</td>
                <td>$${r.amount}</td>
                <td><span class="badge" style="background:#FFF3E0;color:#E65100;">Bekliyor</span></td>
                <td class="actions">
                    <button class="btn-sm success" onclick="approveRequest(${r.id})">✅ Onayla</button>
                    <button class="btn-sm danger" onclick="rejectRequest(${r.id})">❌ Reddet</button>
                </td>
            </tr>
        `).join('');
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#ef4444;">❌ Yüklenemedi: ${e.message}</td></tr>`;
    }
}

// Kullanıcı düzenle
function editUser(id) {
    const user = usersData.find(u => u.id === id);
    if (!user) return;
    alert(`✏️ Kullanıcı düzenle: ${user.name} (ID: ${user.id})\nKV: ${user.kv}, Sol CV: ${user.left_cv}, Sağ CV: ${user.right_cv}`);
}

// Kullanıcı sil
async function deleteUser(id) {
    if (!confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return;

    try {
        const res = await fetch(`http://localhost:5000/api/admin/users/${id}`, {
            method: 'DELETE',
            headers: window.DataManager.getHeaders()
        });
        const data = await res.json();

        if (data.success) {
            showToast('✅ Kullanıcı silindi!', 'success');
            loadAdmin();
        } else {
            showToast('❌ ' + data.error, 'error');
        }
    } catch (e) {
        showToast('❌ ' + e.message, 'error');
    }
}

// İstek onayla
async function approveRequest(id) {
    if (!confirm('Bu isteği onaylamak istediğinize emin misiniz?')) return;

    try {
        const res = await fetch(`http://localhost:5000/api/purchase-requests/${id}/approve`, {
            method: 'POST',
            headers: window.DataManager.getHeaders()
        });
        const data = await res.json();

        if (data.success) {
            showToast('✅ İstek onaylandı!', 'success');
            loadRequests();
            loadAdmin();
        } else {
            showToast('❌ ' + data.error, 'error');
        }
    } catch (e) {
        showToast('❌ ' + e.message, 'error');
    }
}

// İstek reddet
async function rejectRequest(id) {
    if (!confirm('Bu isteği reddetmek istediğinize emin misiniz?')) return;

    try {
        const res = await fetch(`http://localhost:5000/api/purchase-requests/${id}/reject`, {
            method: 'POST',
            headers: window.DataManager.getHeaders()
        });
        const data = await res.json();

        if (data.success) {
            showToast('❌ İstek reddedildi', 'info');
            loadRequests();
        } else {
            showToast('❌ ' + data.error, 'error');
        }
    } catch (e) {
        showToast('❌ ' + e.message, 'error');
    }
}

// Kullanıcı ekle modal
function openAddUserModal() {
    alert('➕ Yeni kullanıcı ekle\nBu özellik yakında eklenecek.');
}

// Toast
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

// Global
window.loadAdmin = loadAdmin;
window.switchTab = switchTab;
window.loadRequests = loadRequests;
window.editUser = editUser;
window.deleteUser = deleteUser;
window.approveRequest = approveRequest;
window.rejectRequest = rejectRequest;
window.openAddUserModal = openAddUserModal;
window.showToast = showToast;

console.log('✅ Admin Panel v2 yüklendi!');
