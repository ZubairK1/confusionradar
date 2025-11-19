# Confusion Radar

Minimal Confusion Radar web app — lecturer creates a session and students press an "I'm confused" button. Data is stored in-memory (no DB). Real-time updates are via Socket.IO.

Quick start (Windows PowerShell):

```powershell
cd c:\Users\zubai\Desktop\confusionradar
npm install
npm start
# open http://localhost:3000/host in your browser
```

Usage:
- Lecturer: open `/host`, click "Create Session". A 6-character code and QR code will be shown.
- Students: open `/join?code=ABC123` or go to `/student` and enter the code, then press "I'm confused".
- Embed in slides (if hosting the app publicly): include the script and data-code attribute in your slide HTML:

```html
<script src="https://your-host/embed.js" data-code="ABC123"></script>
```

Notes and production considerations:
- This stores data in memory — restart clears sessions.
- Consider deploying behind a process manager (PM2) and adding persistent storage for long-term analytics.
- TLS (HTTPS) is recommended for public deployment.
