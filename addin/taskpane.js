// Simple taskpane script that posts messages to the widget iframe
(function () {
    const codeInput = document.getElementById('code');
    const setBtn = document.getElementById('set');
    const resetBtn = document.getElementById('reset');
    const iframe = document.getElementById('widgetFrame');

    function post(msg) {
        try { iframe.contentWindow.postMessage(msg, '*'); } catch (e) { console.error(e) }
    }

    setBtn.addEventListener('click', () => {
        const code = (codeInput.value || '').trim().toUpperCase();
        if (!code) return alert('Enter a session code');
        // update iframe URL so it auto-joins on load
        const base = iframe.getAttribute('src').split('?')[0];
        iframe.src = base + '?code=' + encodeURIComponent(code);
        // also send a message in case already loaded
        post({ type: 'setCode', code });
    });

    resetBtn.addEventListener('click', () => {
        const code = (codeInput.value || '').trim().toUpperCase();
        post({ type: 'reset', code });
    });

    // Listen to messages from widget (optional)
    window.addEventListener('message', (ev) => {
        // forward or handle messages if needed
        // console.log('Add-in received', ev.data);
    });
})();
