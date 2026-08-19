// TREE DETAIL - LAZY LOADING (3 SEVİYE)

let treeData = null;
let currentRootId = null;
let expandedNodes = new Set();
let nodeHistory = [];
const MAX_DEPTH = 2; // 0,1,2 = 3 seviye

function formatNumber(num) {
    if (!num || num === 0) return '0';
    const abs = Math.abs(num);
    if (abs >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (abs >= 1000) return (num / 1000).toFixed(2) + 'K';
    return num.toString();
}

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadTree();
});

async function checkAuth() {
    const dm = window.DataManager;
    const token = dm.getToken();
    const user = dm.currentUser;

    if (!token || !user) {
        document.getElementById('treeWrapper').innerHTML = `
            <div class="empty-state" style="text-align:center; padding:60px 20px;">
                <p style="font-size:1.5rem; margin-bottom:12px;">🔒</p>
                <p style="font-size:1.1rem; font-weight:600; color:var(--text);">Giriş Yapın</p>
                <p style="font-size:0.85rem; color:var(--text-light); margin-bottom:20px;">Ağacı görmek için lütfen giriş yapın.</p>
                <a href="/index.html" class="action-btn" style="padding:10px 24px; border-radius:8px; background:var(--primary); color:white; text-decoration:none; display:inline-block;">Ana Sayfaya Dön</a>
            </div>
        `;
        return;
    }

    const profileBtn = document.getElementById('profileBtn');
    if (profileBtn && user) {
        profileBtn.textContent = user.name?.charAt(0).toUpperCase() || '👤';
    }
}

async function loadTree(rootId = null) {
    const wrapper = document.getElementById('treeWrapper');
    wrapper.innerHTML = '<div class="loading">⏳ Ağaç yükleniyor...</div>';
    try {
        const dm = window.DataManager;
        const data = await dm.getTree();
        treeData = data;
        if (!data || !data.root) {
            wrapper.innerHTML = `<div class="empty-state"><div class="icon">🌳</div><p>Ağaçta henüz üye yok</p><button onclick="loadTree()" style="margin-top:8px; padding:4px 14px; border-radius:8px; border:1px solid var(--border); background:white; cursor:pointer;">🔄 Yenile</button></div>`;
            return;
        }
        
        if (rootId) {
            const found = data.nodes.find(n => n.id === rootId);
            if (found) {
                currentRootId = rootId;
                document.getElementById('rootName').textContent = found.name || 'Kök';
                if (!nodeHistory.includes(rootId)) {
                    nodeHistory.push(rootId);
                }
            } else {
                currentRootId = data.root.id;
                document.getElementById('rootName').textContent = data.root.name || 'Kök';
            }
        } else {
            currentRootId = data.root.id;
            document.getElementById('rootName').textContent = data.root.name || 'Kök';
            nodeHistory = [currentRootId];
        }
        
        document.getElementById('treeStats').textContent = `${data.total || data.nodes?.length || 0} üye`;
        document.getElementById('breadcrumbBar').style.display = 'flex';
        renderTree(data, currentRootId);
    } catch (error) {
        console.error('Tree yükleme hatası:', error);
        wrapper.innerHTML = `<div class="empty-state" style="color:#ef4444;"><div class="icon">❌</div><p>${error.message}</p><button onclick="loadTree()" style="margin-top:8px; padding:4px 14px; border-radius:8px; border:1px solid var(--border); background:white; cursor:pointer;">🔄 Yenile</button></div>`;
    }
}

function renderTree(data, rootId) {
    const wrapper = document.getElementById('treeWrapper');
    const root = data.nodes.find(n => n.id === rootId) || data.root;
    const nodes = data.nodes || [];
    let html = '<div class="tree-container">';
    html += renderNodeLazy(root, nodes, 0, true);
    html += '</div>';
    wrapper.innerHTML = html;
}

function renderNodeLazy(node, allNodes, depth, isRoot = false) {
    const children = allNodes.filter(n => n.sponsor_id === node.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    
    // 🔥 3 seviyeden sonra (depth >= MAX_DEPTH) alt üyeleri gösterme, sadece "▶" butonu göster
    const showChildren = (isExpanded || depth < MAX_DEPTH) && hasChildren;
    const showExpandButton = hasChildren && depth >= MAX_DEPTH && !isExpanded;

    const careerColors = {
        'Starter': '#E8F5E9', 'Pioneer': '#E3F2FD', 'Star': '#FFF3E0',
        'Leader': '#F3E5F5', 'Emerald': '#E0F7FA', 'Diamond': '#FCE4EC',
        'Blue Diamond': '#E8EAF6', 'Green Diamond': '#E0F2F1', 'Red Diamond': '#FBE9E7'
    };
    const careerColor = careerColors[node.career_level] || '#E8F5E9';
    const isActive = (node.kv || 0) >= 45;
    const expandIcon = hasChildren && depth >= MAX_DEPTH ? (isExpanded ? ' ▼' : ' ▶') : '';

    let html = `<div class="node" data-id="${node.id}" data-depth="${depth}">`;

    const clickable = 'onclick="setRoot(' + node.id + ')" style="cursor:pointer;"';

    html += `
        <div class="node-card ${isRoot ? 'root' : ''}" ${clickable}>
            <div class="node-header">
                <span class="name">${isRoot ? '👑 ' : ''}${node.name || 'İsimsiz'}</span>
                <span class="id-badge">#${node.id}</span>
                <span class="career" style="background:${careerColor};">${node.career_level || 'Starter'}</span>
            </div>
            
            <div class="stats-row">
                <div class="stat-item">
                    <span class="label">KV</span>
                    <span class="value kv">${formatNumber(node.kv)}</span>
                </div>
                <div class="stat-item">
                    <span class="label">Durum</span>
                    <span class="value" style="color:${isActive ? '#10B981' : '#EF4444'}; font-size:0.6rem; font-weight:700;">
                        ${isActive ? '✅' : '❌'}
                    </span>
                </div>
            </div>
            
            <div class="stats-row">
                <div class="stat-item">
                    <span class="label">Sol CV</span>
                    <span class="value cv">${formatNumber(node.left_cv)}</span>
                </div>
                <div class="stat-item">
                    <span class="label">Sağ CV</span>
                    <span class="value cv">${formatNumber(node.right_cv)}</span>
                </div>
            </div>
            
            <div class="stats-row">
                <div class="stat-item">
                    <span class="label">Sol PV</span>
                    <span class="value pv">${formatNumber(node.left_pv)}</span>
                </div>
                <div class="stat-item">
                    <span class="label">Sağ PV</span>
                    <span class="value pv">${formatNumber(node.right_pv)}</span>
                </div>
            </div>
            
            ${hasChildren && depth >= MAX_DEPTH ? `<div class="expand-icon" style="text-align:center; margin-top:4px; font-size:0.6rem; color:var(--text-light); cursor:pointer;" onclick="event.stopPropagation(); toggleNode(${node.id})">${expandIcon} ${children.length} alt üye</div>` : ''}
        </div>
    `;

    // ÇOCUKLAR
    if (showChildren) {
        html += `<div class="children">`;

        const leftChild = children.find(c => c.position === 'left');
        if (leftChild) {
            html += `<div class="branch left">`;
            html += `<span class="leg-label">🟦</span>`;
            html += renderNodeLazy(leftChild, allNodes, depth + 1, false);
            html += `</div>`;
        } else {
            html += `
                <div class="branch left empty" >
                    <span class="leg-label" style="cursor:pointer;">➕ Sol</span>
                </div>
            `;
        }

        const rightChild = children.find(c => c.position === 'right');
        if (rightChild) {
            html += `<div class="branch right">`;
            html += `<span class="leg-label">🟩</span>`;
            html += renderNodeLazy(rightChild, allNodes, depth + 1, false);
            html += `</div>`;
        } else {
            html += `
                <div class="branch right empty" >
                    <span class="leg-label" style="cursor:pointer;">➕ Sağ</span>
                </div>
            `;
        }

        html += `</div>`;
    } else if (showExpandButton) {
        // 🔥 3. seviyede alt üye varsa ama kapalıysa buton göster
        html += `
            <div class="children" style="padding-top:4px;">
                <div class="branch" style="flex:1; text-align:center;">
                    <span class="leg-label" onclick="event.stopPropagation(); toggleNode(${node.id})" style="cursor:pointer; background:rgba(255,255,255,0.4); padding:4px 14px; border-radius:8px; font-size:0.6rem; font-weight:600;">
                        ▶ ${children.length} alt üye
                    </span>
                </div>
            </div>
        `;
    } else if (!hasChildren && depth < 3) {
        // Hiç çocuğu olmayan (leaf node) için + butonları
        html += `
            <div class="children" style="padding-top:6px;">
                <div class="branch left empty" >
                    <span class="leg-label" style="cursor:pointer;">➕ Sol</span>
                </div>
                <div class="branch right empty" >
                    <span class="leg-label" style="cursor:pointer;">➕ Sağ</span>
                </div>
            </div>
        `;
    }

    html += `</div>`;
    return html;
}

function setRoot(nodeId) {
    if (nodeId === currentRootId) {
        toggleNode(nodeId);
        return;
    }
    console.log('🔄 Kök değiştiriliyor:', nodeId);
    currentRootId = nodeId;
    expandedNodes = new Set([nodeId]);
    if (!nodeHistory.includes(nodeId)) {
        nodeHistory.push(nodeId);
    }
    renderTree(treeData, nodeId);
    
    const rootNode = treeData.nodes.find(n => n.id === nodeId);
    if (rootNode) {
        document.getElementById('rootName').textContent = rootNode.name || 'Kök';
    }
    document.getElementById('breadcrumbBar').style.display = 'flex';
}

function goToParent() {
    if (!treeData || !currentRootId) return;
    
    const currentNode = treeData.nodes.find(n => n.id === currentRootId);
    if (!currentNode || !currentNode.sponsor_id) {
        showToast('❌ Zaten en üsttesiniz!', 'info');
        return;
    }
    
    const parentId = currentNode.sponsor_id;
    const parentNode = treeData.nodes.find(n => n.id === parentId);
    if (!parentNode) {
        showToast('❌ Üst düğüm bulunamadı!', 'error');
        return;
    }
    
    nodeHistory = nodeHistory.filter(id => id !== currentRootId);
    currentRootId = parentId;
    expandedNodes = new Set([parentId]);
    renderTree(treeData, parentId);
    document.getElementById('rootName').textContent = parentNode.name || 'Kök';
    showToast(`⬆️ ${parentNode.name} seviyesine çıkıldı`, 'success');
}

function toggleNode(nodeId) {
    if (expandedNodes.has(nodeId)) {
        expandedNodes.delete(nodeId);
    } else {
        expandedNodes.add(nodeId);
    }
    renderTree(treeData, currentRootId);
}

function resetToRoot() {
    const rootId = treeData?.root?.id || 1;
    currentRootId = rootId;
    expandedNodes = new Set([rootId]);
    nodeHistory = [rootId];
    renderTree(treeData, rootId);
    document.getElementById('rootName').textContent = treeData?.root?.name || 'Kök';
    showToast('🏠 Ana köke dönüldü', 'info');
}

function addMember(sponsorId, position) {
    const positionText = position === 'left' ? 'Sol' : 'Sağ';
    console.log('➕ Yeni üye ekleniyor:', { sponsorId, position });
    
    if (!confirm(`"${positionText} Kol"a yeni üye eklemek istediğinize emin misiniz?`)) return;
    
    const returnUrl = window.location.href;
    sessionStorage.setItem('returnUrl', returnUrl);
    
    window.location.href = `/register?ref=${sponsorId}&position=${position}`;
}

function searchNode(event) {
    if (event.key !== 'Enter') return;
    const query = document.getElementById('searchInput').value.trim().toLowerCase();
    if (!query || !treeData) { showToast('🔍 Lütfen bir isim veya ID girin', 'info'); return; }
    const nodes = treeData.nodes || [];
    const found = nodes.filter(n => n.name?.toLowerCase().includes(query) || String(n.id).includes(query));
    if (found.length > 0) {
        showToast(`🔍 ${found.map(f => `${f.name} (#${f.id})`).join(', ')}`, 'success');
    } else {
        showToast('❌ Kullanıcı bulunamadı', 'error');
    }
}

function showToast(msg, type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = `toast show ${type}`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
}

window.loadTree = loadTree;
window.searchNode = searchNode;
window.addMember = addMember;
window.toggleNode = toggleNode;
window.setRoot = setRoot;
window.resetToRoot = resetToRoot;
window.goToParent = goToParent;

console.log('✅ Tree Detail (Lazy - 3 Seviye) yüklendi!');
