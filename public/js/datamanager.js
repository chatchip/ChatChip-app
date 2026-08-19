const API_BASE = 'https://chatchip-production.up.railway.app/api';

class DataManager {
    constructor() {
        this.apiBase = API_BASE;
        this.token = localStorage.getItem('chatchip_token') || null;
        this.currentUser = null;
        this.availableModels = [];
        this._loadUser();
        console.log('✅ DataManager başlatıldı, API:', this.apiBase);
    }

    _loadUser() {
        try {
            const saved = localStorage.getItem('chatchip_user');
            if (saved) {
                this.currentUser = JSON.parse(saved);
                console.log('👤 Kullanıcı yüklendi:', this.currentUser.name);
            }
        } catch (e) {
            console.error('User load error:', e);
        }
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('chatchip_token', token);
        } else {
            localStorage.removeItem('chatchip_token');
        }
    }

    getToken() {
        return this.token || localStorage.getItem('chatchip_token');
    }

    getHeaders() {
        const token = this.getToken();
        const headers = { 'Content-Type': 'application/json' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }

    // ============ AUTH ============
    async login(email, password) {
        try {
            console.log('📨 Login isteği:', { email });
            const res = await fetch(`${this.apiBase}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            console.log('📨 Login yanıtı:', data);
            if (data.success) {
                this.setToken(data.token);
                this.currentUser = data.user;
                localStorage.setItem('chatchip_user', JSON.stringify(data.user));
            }
            return data;
        } catch (e) {
            console.error('Login error:', e);
            return { success: false, error: e.message };
        }
    }

    async register(name, email, phone, password, sponsorId, position) {
        console.log('📤 Register gönderiliyor:', { name, email, sponsorId, position });
        try {
            const res = await fetch(`${this.apiBase}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name, 
                    email, 
                    phone, 
                    password, 
                    sponsor_id: sponsorId,
                    position 
                })
            });
            const data = await res.json();
            console.log('📥 Register yanıtı:', data);
            if (data.success) {
                this.setToken(data.token);
                this.currentUser = data.user;
                localStorage.setItem('chatchip_user', JSON.stringify(data.user));
            }
            return data;
        } catch (e) {
            console.error('Register error:', e);
            return { success: false, error: e.message };
        }
    }

    logout() {
        this.setToken(null);
        this.currentUser = null;
        localStorage.removeItem('chatchip_user');
        console.log('👋 Çıkış yapıldı');
    }

    // ============ ŞİFRE SIFIRLAMA ============
    async forgotPassword(email) {
        const res = await fetch(`${this.apiBase}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        return res.json();
    }

    async resetPassword(token, newPassword) {
        const res = await fetch(`${this.apiBase}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, newPassword })
        });
        return res.json();
    }

    // ============ CHAT SESSIONS ============
    async getSessions() {
        const res = await fetch(`${this.apiBase}/chat/sessions`, {
            headers: this.getHeaders()
        });
        return res.json();
    }

    async getSession(id) {
        const res = await fetch(`${this.apiBase}/chat/sessions/${id}`, {
            headers: this.getHeaders()
        });
        return res.json();
    }

    async createSession(title) {
        const res = await fetch(`${this.apiBase}/chat/sessions`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ title })
        });
        return res.json();
    }

    async updateSession(id, title) {
        const res = await fetch(`${this.apiBase}/chat/sessions/${id}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify({ title })
        });
        return res.json();
    }

    async pinSession(id, isPinned) {
        const res = await fetch(`${this.apiBase}/chat/sessions/${id}/pin`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ is_pinned: isPinned })
        });
        return res.json();
    }

    async deleteSession(id) {
        const res = await fetch(`${this.apiBase}/chat/sessions/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
        return res.json();
    }

    // ============ 🔥 CHAT - SIGNAL EKLENDİ ============
    async sendMessage(message, coachType = 'standard', systemPrompt = '', sessionId = null, signal = null) {
        const version = localStorage.getItem('chatchip_selected_model') || '1.0';
        
        const options = {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ 
                message, 
                version: version,
                coachType: coachType,
                systemPrompt: systemPrompt,
                sessionId: sessionId
            })
        };
        
        if (signal) {
            options.signal = signal;
            console.log('🔴 Abort signal eklendi');
        }
        
        const res = await fetch(`${this.apiBase}/chat/stream`, options);
        return res;
    }

    // ============ MODELS ============
    async getAvailableModels() {
        try {
            const res = await fetch(`${this.apiBase}/chat/models`, {
                headers: this.getHeaders()
            });
            const data = await res.json();
            if (data.success) {
                this.availableModels = data.models || [];
                return data;
            }
            return { success: false, models: [] };
        } catch (error) {
            console.error('Models yükleme hatası:', error);
            return { success: false, models: [] };
        }
    }

    // ============ CHAT HISTORY ============
    async getChatHistory(limit = 20) {
        const res = await fetch(`${this.apiBase}/chat/history?limit=${limit}`, {
            headers: this.getHeaders()
        });
        return res.json();
    }

    // ============ TEAM ============
    async getTree() {
        const res = await fetch(`${this.apiBase}/team/tree`, {
            headers: this.getHeaders()
        });
        return res.json();
    }

    async getTeamStats() {
        const res = await fetch(`${this.apiBase}/team/stats`, {
            headers: this.getHeaders()
        });
        return res.json();
    }

    // ============ MLM ============
    async getMLMStatus() {
        const res = await fetch(`${this.apiBase}/mlm/status`, {
            headers: this.getHeaders()
        });
        return res.json();
    }

    async runMatch() {
        const res = await fetch(`${this.apiBase}/mlm/match`, {
            method: 'POST',
            headers: this.getHeaders()
        });
        return res.json();
    }

    async calculateCareer() {
        const res = await fetch(`${this.apiBase}/mlm/career`, {
            method: 'POST',
            headers: this.getHeaders()
        });
        return res.json();
    }

    // ============ PRICING ============
    async getPlans() {
        const res = await fetch(`${this.apiBase}/pricing`);
        return res.json();
    }

    // ============ ADMIN ============
    async getAdminDashboard() {
        const res = await fetch(`${this.apiBase}/admin/dashboard`, {
            headers: this.getHeaders()
        });
        return res.json();
    }

    // ============ IBAN ============
    async getBankInfo() {
        const res = await fetch(`${this.apiBase}/auth/get-bank`, {
            headers: this.getHeaders()
        });
        return res.json();
    }

    async updateBankInfo(data) {
        const res = await fetch(`${this.apiBase}/auth/update-bank`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(data)
        });
        return res.json();
    }

    // ============ SPONSOR ============
    async getSponsor(id) {
        console.log('🔍 Sponsor sorgulanıyor:', id);
        const res = await fetch(`${this.apiBase}/auth/sponsor/${id}`, {
            headers: this.getHeaders()
        });
        return res.json();
    }

    // ============ PLAN ============
    async getPlanStatus() {
        const res = await fetch(`${this.apiBase}/plan/status`, {
            headers: this.getHeaders()
        });
        return res.json();
    }

    async renewPlan(planType, duration) {
        const res = await fetch(`${this.apiBase}/plan/renew`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ planType, duration })
        });
        return res.json();
    }
}

window.DataManager = new DataManager();
console.log('✅ DataManager yüklendi! API Base:', API_BASE);
