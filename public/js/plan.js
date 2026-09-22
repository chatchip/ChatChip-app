// ChatChip plan module
// Current plan API/UI logic is intentionally isolated here so the plan system can be replaced later.

const PLAN_VERSION_MAP = {
    'free': 'ChatChip 1.0',
    'Lite': 'ChatChip 1.0',
    'Plus': 'ChatChip 2.0',
    'Pro': 'ChatChip 2.1'
};

function updateVersionDisplayFromPlan(plan) {
    const versionDisplay = document.getElementById('versionDisplay');
    if (!versionDisplay) return;

    const planType = plan?.type || 'free';
    const version = PLAN_VERSION_MAP[planType] || 'ChatChip 1.0';
    versionDisplay.textContent = version;
    console.log('📋 Versiyon güncellendi:', planType, '→', version);
}

// ============================================================
// PLAN KONTROLÜ
// ============================================================
async function checkPlan() {
    try {
        const dm = window.DataManager;
        const result = await dm.getPlanStatus();
        
        if (result.success && result.plan) {
            currentPlan = result.plan;
            updateVersionDisplayFromPlan(currentPlan);
            
            const planName = document.getElementById('planName');
            const planTime = document.getElementById('planTime');
            const planExpires = document.getElementById('planExpires');
            const planBadge = document.getElementById('planBadge');
            const planWarning = document.getElementById('planWarning');
            
            if (currentPlan.isExpired) {
                if (planBadge) {
                    planBadge.textContent = '⛔ Sona Erdi';
                    planBadge.style.background = '#FEE2E2';
                    planBadge.style.color = '#DC2626';
                }
                if (planName) {
                    planName.textContent = '⛔ Sona Erdi';
                    planName.style.color = '#DC2626';
                }
                if (planTime) {
                    planTime.textContent = '🗓️ ' + currentPlan.expiresFormatted + ' (Süre doldu)';
                    planTime.style.color = '#DC2626';
                }
                if (planExpires) {
                    planExpires.textContent = '⚠️ ' + currentPlan.expiresFormatted + ' - SÜRE DOLDU!';
                    planExpires.style.color = '#DC2626';
                    planExpires.style.fontWeight = 'bold';
                }
                if (planWarning) planWarning.style.display = 'block';
            } else {
                const label = currentPlan.type === 'free' ? '🆓 Ücretsiz' : '⭐ ' + currentPlan.type;
                if (planBadge) {
                    planBadge.textContent = '✅ ' + label;
                    planBadge.style.background = currentPlan.type === 'free' ? '#D1FAE5' : '#DBEAFE';
                    planBadge.style.color = currentPlan.type === 'free' ? '#065F46' : '#1E40AF';
                }
                if (planName) {
                    planName.textContent = label;
                    planName.style.color = currentPlan.type === 'free' ? '#065F46' : '#1E40AF';
                }
                if (planTime) {
                    let timeText = '';
                    if (currentPlan.remainingHours > 0) {
                        timeText = `⏳ ${currentPlan.remainingHours} saat ${currentPlan.remainingMinutes} dakika kaldı`;
                    } else if (currentPlan.remainingMinutes > 0) {
                        timeText = `⏳ ${currentPlan.remainingMinutes} dakika kaldı`;
                    } else {
                        timeText = `⏳ 1 saatten az kaldı`;
                    }
                    planTime.textContent = timeText;
                    planTime.style.color = '#6B7280';
                }
                if (planExpires) {
                    planExpires.textContent = currentPlan.expiresFormatted;
                    planExpires.style.color = '#6B7280';
                    planExpires.style.fontWeight = 'normal';
                }
                if (planWarning) planWarning.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('❌ Plan kontrol hatası:', error);
    }
}

function startPlanWatcher() {
    setInterval(async () => {
        if (currentUser) {
            await checkPlan();
        }
    }, 60000);
}

async function updateVersionDisplay() {
    if (currentPlan) {
        updateVersionDisplayFromPlan(currentPlan);
        return;
    }
    await checkPlan();
}

window.ChatChipPlan = {
    refresh: checkPlan,
    startWatcher: startPlanWatcher,
    getCurrent: () => currentPlan,
    updateVersionDisplay
};

window.checkPlan = checkPlan;
window.startPlanWatcher = startPlanWatcher;
window.updateVersionDisplay = updateVersionDisplay;
