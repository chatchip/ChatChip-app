// ============================================================
// 🔐 BACKOFFICE XSS HARDENING
// Dinamik kullanıcı/ekip metinlerini renderBackoffice'e girmeden önce
// HTML-safe hale getirir. Sayısal ve ilişki alanlarına dokunmaz.
// ============================================================
(function hardenBackofficeRendering() {
    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>'"]/g, char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        })[char]);
    }

    if (typeof window.renderBackoffice !== 'function') {
        console.warn('⚠️ Backoffice security: renderBackoffice bulunamadı');
        return;
    }

    const originalRenderBackoffice = window.renderBackoffice;

    window.renderBackoffice = function safeRenderBackoffice(mlmStatus, tree, userId) {
        const safeMlmStatus = mlmStatus && typeof mlmStatus === 'object'
            ? {
                ...mlmStatus,
                user: mlmStatus.user && typeof mlmStatus.user === 'object'
                    ? {
                        ...mlmStatus.user,
                        career_level: escapeHtml(mlmStatus.user.career_level)
                    }
                    : mlmStatus.user
            }
            : mlmStatus;

        const safeTree = tree && typeof tree === 'object'
            ? {
                ...tree,
                nodes: Array.isArray(tree.nodes)
                    ? tree.nodes.map(node => ({
                        ...node,
                        name: escapeHtml(node?.name),
                        position: escapeHtml(node?.position),
                        career_level: escapeHtml(node?.career_level)
                    }))
                    : tree.nodes
            }
            : tree;

        const originalUser = currentUser;
        if (currentUser && typeof currentUser === 'object') {
            currentUser = {
                ...currentUser,
                name: escapeHtml(currentUser.name),
                career_level: escapeHtml(currentUser.career_level)
            };
        }

        try {
            return originalRenderBackoffice(safeMlmStatus, safeTree, userId);
        } finally {
            currentUser = originalUser;
        }
    };

    console.log('🔐 Backoffice XSS hardening aktif');
})();
