// public/student.js - moved from inline script to satisfy CSP
(function () {
    const params = new URLSearchParams(location.search);
    const preCode = params.get('code');
    const joinArea = document.getElementById('joinArea');
    const sessionArea = document.getElementById('sessionArea');
    const codeInput = document.getElementById('codeInput');
    const joinBtn = document.getElementById('joinBtn');
    const confusedBtn = document.getElementById('confusedBtn');
    const sessionCodeEl = document.getElementById('sessionCode');
    const countEl = document.getElementById('count');

    if (!joinArea || !sessionArea) return;

    if (preCode) {
        codeInput.value = preCode;
        join();
    }

    joinBtn.addEventListener('click', join);
    confusedBtn.addEventListener('click', press);

    function join() {
        const code = (codeInput.value || '').toUpperCase().trim();
        if (!code) return alert('Please enter a session code');
        fetch(`/api/session/${code}`).then(r => {
            if (!r.ok) throw new Error('Not found');
            return r.json();
        }).then(data => {
            sessionCodeEl.textContent = code;
            joinArea.style.display = 'none';
            sessionArea.style.display = 'block';
            countEl.textContent = data.count || 0;
        }).catch(() => { alert('Session not found') });
    }

    function press() {
        const code = sessionCodeEl.textContent;
        if (!code) return;
        confusedBtn.disabled = true;
        fetch('/api/press', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code }) })
            .then(r => r.json())
            .then(j => {
                if (j && j.count != null) countEl.textContent = j.count;
            }).finally(() => { setTimeout(() => confusedBtn.disabled = false, 800) });
    }
})();
