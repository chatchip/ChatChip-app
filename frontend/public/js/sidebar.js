// ============================================================
// SIDEBAR KONTROLLERİ (Bağımsız)
// ============================================================

function toggleSidebar(side) {
    console.log('🔄 toggleSidebar çağrıldı:', side);
    
    const left = document.getElementById('sidebarLeft');
    const right = document.getElementById('sidebarRight');
    const overlay = document.getElementById('overlay');
    
    console.log('📦 Elementler:', { left: !!left, right: !!right, overlay: !!overlay });
    
    if (side === 'left') {
        if (left) {
            left.classList.toggle('active');
            console.log('✅ Sol menü toggled, active:', left.classList.contains('active'));
        }
    } else if (side === 'right') {
        if (right) {
            right.classList.toggle('active');
            console.log('✅ Sağ menü toggled, active:', right.classList.contains('active'));
        }
    }
    
    if (overlay) {
        if (left?.classList.contains('active') || right?.classList.contains('active')) {
            overlay.classList.add('active');
        } else {
            overlay.classList.remove('active');
        }
    }
}

function closeAllSidebars() {
    console.log('🔄 closeAllSidebars çağrıldı');
    const left = document.getElementById('sidebarLeft');
    const right = document.getElementById('sidebarRight');
    const overlay = document.getElementById('overlay');
    
    if (left) left.classList.remove('active');
    if (right) right.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
}

// Global erişim
window.toggleSidebar = toggleSidebar;
window.closeAllSidebars = closeAllSidebars;

console.log('✅ Sidebar controller yüklendi!');
