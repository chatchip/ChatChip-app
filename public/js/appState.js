// ChatChip shared application state
// Central state boundary for Vanilla JS today and a future React store adapter.

(function initAppState() {
    const state = {
        currentUser: null,
        currentPlan: null,
        currentSessionId: null,
        sessions: [],
        isFirstMessage: true,
        isProcessing: false,
        abortController: null,
        currentCryptoKey: null
    };

    const listeners = new Set();

    function notify(key, value, previousValue) {
        listeners.forEach(listener => {
            try {
                listener({ key, value, previousValue, snapshot: getSnapshot() });
            } catch (error) {
                console.error('AppState listener error:', error);
            }
        });
    }

    function set(key, value) {
        if (!(key in state)) {
            throw new Error(`Unknown AppState key: ${key}`);
        }

        const previousValue = state[key];
        state[key] = value;

        if (previousValue !== value) {
            notify(key, value, previousValue);
        }

        return value;
    }

    function get(key) {
        if (!(key in state)) {
            throw new Error(`Unknown AppState key: ${key}`);
        }
        return state[key];
    }

    function getSnapshot() {
        return {
            ...state,
            sessions: [...state.sessions]
        };
    }

    function subscribe(listener) {
        if (typeof listener !== 'function') {
            return () => {};
        }

        listeners.add(listener);
        return () => listeners.delete(listener);
    }

    function resetSessionState() {
        set('currentSessionId', null);
        set('sessions', []);
        set('isFirstMessage', true);
    }

    function resetAuthState() {
        set('currentUser', null);
        set('currentPlan', null);
        set('currentCryptoKey', null);
        set('isProcessing', false);
        set('abortController', null);
        resetSessionState();
    }

    window.ChatChipAppState = {
        get,
        set,
        getSnapshot,
        subscribe,

        getUser: () => get('currentUser'),
        setUser: value => set('currentUser', value),

        getPlan: () => get('currentPlan'),
        setPlan: value => set('currentPlan', value),

        getSessionId: () => get('currentSessionId'),
        setSessionId: value => set('currentSessionId', value),

        getSessions: () => get('sessions'),
        setSessions: value => set('sessions', Array.isArray(value) ? value : []),

        getFirstMessage: () => get('isFirstMessage'),
        setFirstMessage: value => set('isFirstMessage', Boolean(value)),

        getProcessing: () => get('isProcessing'),
        setProcessing: value => set('isProcessing', Boolean(value)),

        getAbortController: () => get('abortController'),
        setAbortController: value => set('abortController', value),

        getCryptoKey: () => get('currentCryptoKey'),
        setCryptoKey: value => set('currentCryptoKey', value),

        resetSessionState,
        resetAuthState
    };

    console.log('🧠 App state yüklendi');
})();
