// public/widget.js — embeddable widget for slides / iframes
(function () {
    const params = new URLSearchParams(location.search);
    let code = (params.get('code') || '').toUpperCase();
    const autoReset = params.get('reset') === '1';
    const wCode = document.getElementById('wCode');
    const wCount = document.getElementById('wCount');
    const wConfused = document.getElementById('wConfused');
    const wReset = document.getElementById('wReset');
    const wStatus = document.getElementById('wStatus');

    const socket = io();

    function setStatus(s) { wStatus.textContent = s; }

    async function joinRoom() {
        if (!code) {
            // try to auto-join current session from server
            try {
                const r = await fetch('/api/session/current');
                if (r.ok) {
                    const j = await r.json();
                    code = (j.code || '').toUpperCase();
                }
            } catch (e) {/* ignore */ }
        }
        if (!code) return setStatus('no code');
        socket.emit('join', code);
        wCode.textContent = code;
        setStatus('connected');
        // if widget loaded with reset param, request server to reset current session
        const params = new URLSearchParams(location.search);
        if (params.get('reset') === '1') {
            try { await fetch('/api/session/current/reset', { method: 'POST' }); wCount.textContent = 0; } catch (e) { }
        }
    }

    socket.on('connect', () => { setStatus('connected'); if (code) joinRoom(); });
    socket.on('disconnect', () => setStatus('disconnected'));
    socket.on('update', (data) => { wCount.textContent = data.count || 0; parent.postMessage({ type: 'update', count: data.count || 0, code }, '*'); });

    wConfused.addEventListener('click', () => {
        if (!code) return;
        wConfused.disabled = true;
        fetch('/api/press', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code }) })
            .then(r => r.json()).then(j => { if (j && j.count != null) wCount.textContent = j.count; })
            .finally(() => { setTimeout(() => wConfused.disabled = false, 800); });
    });

    wReset.addEventListener('click', () => {
        if (!code) return;
        fetch('/api/reset', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code }) })
            .then(() => { wCount.textContent = 0; parent.postMessage({ type: 'reset', code }, '*'); });
    });

    // Accept postMessage commands: {type:'reset'} or {type:'setCode', code:'ABC123'}
    window.addEventListener('message', (ev) => {
        try {
            const msg = ev.data || {};
            if (msg.type === 'reset') {
                if (msg.code && msg.code.toUpperCase() !== code) return; // optional code match
                fetch('/api/reset', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code }) })
                    .then(() => { wCount.textContent = 0; });
            } else if (msg.type === 'setCode' && msg.code) {
                code = (msg.code || '').toUpperCase();
                joinRoom();
            }
        } catch (e) {/* ignore */ }
    });

    // Auto-join if code present
    if (code) joinRoom();

    // If reset=1 in URL, reset on load
    if (autoReset && code) {
        fetch('/api/reset', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code }) })
            .then(() => { wCount.textContent = 0; });
    }
})();
