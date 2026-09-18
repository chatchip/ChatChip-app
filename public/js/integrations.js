// ============================================================
// 🔌 CHATCHIP ENTEGRASYONLARI + AI ÇALIŞAN GİRİŞİ
// Gmail OAuth bağlantısı Composio üzerinden backend tarafından başlatılır.
// Ana ekranda yalnızca Gmail ve AI Çalışanı gösterilir.
// ============================================================

(function initIntegrations() {
    const API_BASE = 'https://api.thechatchip.com/api';
    let aiEmployee = null;

    function getToken() { return window.DataManager?.getToken?.() || localStorage.getItem('chatchip_token'); }
    function getGmailButton() { return document.querySelector('.integration-connect[data-integration="Gmail"]'); }
    function getAiEmployeeCard() { return document.querySelector('.integration-card[data-feature="ai-employee"]'); }
    function buildAiEmployeeCard() {
        const card = document.createElement('div'); card.className='integration-card'; card.dataset.feature='ai-employee';
        card.innerHTML=`<span class="integration-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.5"></circle><path d="M5 20c.8-3.2 3.2-5 7-5s6.2 1.8 7 5"></path><path d="M18.5 4.5v4"></path><path d="M16.5 6.5h4"></path></svg></span><span class="integration-name">AI Çalışanı</span><button type="button" class="integration-connect" data-integration="AIEmployee">Oluştur</button>`;
        return card;
    }
    function simplifyQuickActions(){const row=document.getElementById('quickSuggestions');if(!row)return;const gmailCard=getGmailButton()?.closest('.integration-card');if(!gmailCard)return;row.replaceChildren(gmailCard,buildAiEmployeeCard());row.style.gridTemplateColumns='repeat(2, minmax(0, 1fr))';row.style.maxWidth='360px';row.setAttribute('aria-label','ChatChip araçları');const note=row.nextElementSibling;if(note?.classList.contains('integration-note'))note.textContent="ChatChip'i işine bağla, AI çalışanını yönet.";}
    function setAiEmployeeState(agent){aiEmployee=agent||null;const card=getAiEmployeeCard();if(!card)return;const name=card.querySelector('.integration-name'),button=card.querySelector('.integration-connect[data-integration="AIEmployee"]');if(!name||!button)return;if(aiEmployee){name.textContent='AI Çalışanım';button.textContent='Yönet';button.dataset.mode='manage';if(aiEmployee.id!=null)button.dataset.agentId=String(aiEmployee.id);if(aiEmployee.slug)button.dataset.slug=aiEmployee.slug;}else{name.textContent='AI Çalışanı';button.textContent='Oluştur';button.dataset.mode='create';delete button.dataset.agentId;delete button.dataset.slug;}}
    async function checkAiEmployeeStatus(){const token=getToken();if(!token){setAiEmployeeState(null);return;}try{const response=await fetch(`${API_BASE}/agents`,{method:'GET',headers:{Authorization:`Bearer ${token}`},cache:'no-store'});let data=null;try{data=await response.json();}catch(_){}if(response.status===403){setAiEmployeeState(null);return;}if(!response.ok){console.warn(`⚠️ AI çalışan durum kontrolü başarısız (${response.status}).`);return;}const agents=Array.isArray(data)?data:(Array.isArray(data?.agents)?data.agents:[]);setAiEmployeeState(agents[0]||null);}catch(error){console.warn('⚠️ AI çalışan durum kontrolü yapılamadı:',error);}}
    function setGmailConnected(button,connected){if(!button)return;button.dataset.connected=connected?'true':'false';button.textContent=connected?'Bağlı ✓':'Bağla';button.disabled=connected;button.setAttribute('aria-label',connected?'Gmail bağlı':'Gmail bağla');}
    async function checkGmailStatus(){const token=getToken(),button=getGmailButton();if(!token||!button)return;try{const response=await fetch(`${API_BASE}/gmail/status`,{method:'GET',headers:{Authorization:`Bearer ${token}`}});if(!response.ok){console.warn(`⚠️ Gmail durum kontrolü başarısız (${response.status}).`);return;}const data=await response.json();setGmailConnected(button,data.connected===true);}catch(error){console.warn('⚠️ Gmail durum kontrolü yapılamadı:',error);}}
    async function connectGmail(button){const token=getToken();if(!token){if(window.Swal)await Swal.fire({icon:'warning',title:'Giriş gerekli',text:'Gmail hesabını bağlamak için önce ChatChip hesabına giriş yap.'});else alert('Gmail hesabını bağlamak için önce giriş yap.');return;}if(button.dataset.connected==='true')return;const originalText=button.textContent;button.disabled=true;button.textContent='Bağlanıyor...';try{const response=await fetch(`${API_BASE}/gmail/connect`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`}});let data={};try{data=await response.json();}catch(_){}if(!response.ok)throw new Error(data.error||`Gmail bağlantısı başlatılamadı (${response.status}).`);if(data.connected===true){setGmailConnected(button,true);return;}if(!data.redirectUrl)throw new Error('Gmail yetkilendirme adresi alınamadı.');window.location.assign(data.redirectUrl);}catch(error){console.error('❌ Gmail bağlantı hatası:',error);if(window.Swal)await Swal.fire({icon:'error',title:'Gmail bağlanamadı',text:error.message||'Bağlantı başlatılırken bir hata oluştu.'});else alert(error.message||'Gmail bağlantısı başlatılırken bir hata oluştu.');button.disabled=false;button.textContent=originalText;}}
    function openAiEmployee(){const token=getToken();if(!token){if(window.Swal)Swal.fire({icon:'warning',title:'Giriş gerekli',text:'AI çalışanını kullanmak için önce ChatChip hesabına giriş yap.'});else alert('AI çalışanını kullanmak için önce giriş yap.');return;}if(aiEmployee?.id!=null){window.location.assign('/ai-employees.html');return;}window.location.assign('/ai-employee.html');}
    document.addEventListener('click',event=>{const button=event.target.closest('.integration-connect');if(!button)return;const integration=(button.dataset.integration||'').toLowerCase();if(integration==='gmail'){event.preventDefault();event.stopPropagation();connectGmail(button);return;}if(integration==='aiemployee'){event.preventDefault();event.stopPropagation();openAiEmployee();}},true);
    function initializeHomeActions(){simplifyQuickActions();checkGmailStatus();checkAiEmployeeStatus();}
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initializeHomeActions,{once:true});else initializeHomeActions();
})();

// ============================================================
// 🎨 AKTİF GÖRSEL + ANA INPUT = GÖRSEL DÜZENLEME
// Puzzle davranışına dokunmaz: input boşsa hiçbir şeyi yakalamaz.
// ============================================================
(function initMainInputImageEditBridge() {
    let editing = false;

    async function handleImageEdit(event) {
        const messageInput = document.getElementById('messageInput');
        const text = messageInput?.value.trim() || '';
        const imageUrl = localStorage.getItem('chatchip_current_image_url');

        // Kritik: input boşsa mevcut akış tamamen devam eder (Puzzle dahil).
        if (!text || !imageUrl || editing) return false;

        event?.preventDefault?.();
        event?.stopPropagation?.();
        event?.stopImmediatePropagation?.();

        const token = window.DataManager?.getToken?.() || localStorage.getItem('chatchip_token');
        if (!token) {
            if (typeof showToast === 'function') showToast('❌ Lütfen önce giriş yapın!', 'error');
            return true;
        }

        editing = true;
        try {
            if (typeof addMessage === 'function') addMessage(text, 'user');
            messageInput.value = '';
            messageInput.style.height = 'auto';
            if (typeof removeImagePreviewUI === 'function') removeImagePreviewUI();

            await ImageService.edit(text, imageUrl, {
                addMessage: typeof addMessage === 'function' ? addMessage : undefined,
                setLoading: typeof setImageLoadingAnimation === 'function' ? setImageLoadingAnimation : undefined,
                updateMessage: typeof updateMessageMarkdown === 'function' ? updateMessageMarkdown : undefined,
                showToast: typeof showToast === 'function' ? showToast : undefined
            });

            const chatArea = document.getElementById('chatArea');
            if (chatArea) chatArea.scrollTop = chatArea.scrollHeight;
        } catch (error) {
            console.error('❌ Ana input görsel düzenleme hatası:', error);
            if (typeof showToast === 'function') showToast('❌ Görsel düzenlenemedi', 'error');
        } finally {
            editing = false;
        }
        return true;
    }

    // Ana Gönder butonu / swipe-send click'i: capture aşamasında normal chat'ten önce yakala.
    document.addEventListener('click', function(event) {
        if (event.target.closest('#sendBtn')) handleImageEdit(event);
    }, true);

    // Enter da ana Gönder ile aynı davranışı kullansın.
    document.addEventListener('keydown', function(event) {
        if (event.key !== 'Enter' || event.shiftKey) return;
        if (event.target?.id !== 'messageInput') return;
        handleImageEdit(event);
    }, true);
})();
