// public/host.js - moved from inline script to satisfy CSP
(function () {
    const createBtn = document.getElementById('createBtn');
    const resetBtn = document.getElementById('resetBtn');
    const sessionInfo = document.getElementById('sessionInfo');
    const codeEl = document.getElementById('code');
    const qrEl = document.getElementById('qr');
    const countEl = document.getElementById('count');
    const socket = io();

    if (!createBtn) return;

    let currentCode = null;

    createBtn.addEventListener('click', () => {
        fetch('/api/session', { method: 'POST' }).then(r => r.json()).then(j => {
            currentCode = j.code;
            codeEl.textContent = j.code;
            qrEl.src = j.qrDataUrl;
            sessionInfo.style.display = 'block';
            socket.emit('join', j.code);
        }).catch(e => alert('Failed to create session'));
    });

    resetBtn.addEventListener('click', () => {
        if (!currentCode) return alert('No session');
        if (!confirm('Reset count?')) return;
        fetch('/api/reset', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code: currentCode }) });
    });

    socket.on('update', (data) => {
        countEl.textContent = data.count || 0;
    });
})();
