/* Simple embed widget. Include with: <script src="/embed.js" data-code="ABC123"></script> */
(function () {
    function ready(cb) { if (document.readyState != 'loading') cb(); else document.addEventListener('DOMContentLoaded', cb); }
    ready(() => {
        const script = document.currentScript || document.querySelector('script[src$="/embed.js"]');
        if (!script) return;
        const code = (script.getAttribute('data-code') || '').toUpperCase();
        if (!code) return console.warn('embed: no data-code set');

        const container = document.createElement('div');
        container.className = 'floating-embed';
        container.innerHTML = '<button class="embed-btn">😕 Confused?</button>';
        document.body.appendChild(container);

        const btn = container.querySelector('button');
        btn.addEventListener('click', () => {
            btn.disabled = true;
            fetch('/api/press', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code }) })
                .then(r => r.json()).then(j => {
                    btn.textContent = 'Thanks!';
                    setTimeout(() => { btn.textContent = '😕 Confused?'; }, 1000);
                }).catch(() => { btn.textContent = 'Error'; setTimeout(() => btn.textContent = '😕 Confused?', 1200) })
                .finally(() => btn.disabled = false);
        });
    });
})();
