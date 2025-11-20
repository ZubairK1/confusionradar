// Simple taskpane script that posts messages to the widget iframe
(function () {
    const codeInput = document.getElementById('code');
    const setBtn = document.getElementById('set');
    const createBtn = document.getElementById('create');
    const resetBtn = document.getElementById('reset');
    const iframe = document.getElementById('widgetFrame');
    const qrImg = document.getElementById('qrImg');

    function post(msg) {
        try { iframe.contentWindow.postMessage(msg, '*'); } catch (e) { console.error(e) }
    }

    setBtn.addEventListener('click', () => {
        const code = (codeInput.value || '').trim().toUpperCase();
        if (!code) return alert('Enter a session code');
        const base = iframe.getAttribute('src').split('?')[0];
        iframe.src = base + '?code=' + encodeURIComponent(code);
        post({ type: 'setCode', code });
    });

    // Create a new session (lecturer) and show QR
    createBtn.addEventListener('click', async () => {
        createBtn.disabled = true;
        try {
            const r = await fetch('/api/session', { method: 'POST' });
            const j = await r.json();
            if (j.code) {
                codeInput.value = j.code;
                const base = iframe.getAttribute('src').split('?')[0];
                iframe.src = base + '?code=' + encodeURIComponent(j.code) + '&reset=1';
                post({ type: 'setCode', code: j.code });
                // show QR
                if (j.qrDataUrl) { qrImg.src = j.qrDataUrl; qrImg.style.display = 'inline-block'; }
            }
        } catch (e) { alert('Failed to create session'); }
        createBtn.disabled = false;
    });

    resetBtn.addEventListener('click', () => {
        const code = (codeInput.value || '').trim().toUpperCase();
        post({ type: 'reset', code });
    });

    window.addEventListener('message', (ev) => { });
})();
