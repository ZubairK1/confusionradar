Render deployment guide

1) Create a GitHub repo for this project (if you don't have one):
   - git init
   - git add .
   - git commit -m "initial"
   - Create a GitHub repo and push: git remote add origin <URL>; git push -u origin main

2) Create a Render account at https://render.com and connect your GitHub account.

3) In Render dashboard: New → Web Service
   - Connect repository: select the repo you pushed.
   - Branch: `main` (or your branch)
   - Name: `confusion-radar` (or choose another)
   - Environment: `Node` (the `render.yaml` will also be detected)
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: Free (if available)

4) Environment variables / secrets (set in the Render dashboard after creating service):
   - `NODE_ENV` = `production`
   - `ALLOWED_ORIGIN` = `https://yourdomain.example` (optional)
   - `TRUST_PROXY` = `true`
   - `SESSION_TTL_MS` = `43200000` (optional)

5) Deploy
   - After creating the service, Render will build and deploy automatically.
   - The service URL will be provided by Render and uses HTTPS.

Notes
- WebSockets are supported on Render's web services (no additional config required). The server uses `process.env.PORT` so Render will bind correctly.
- If you need persistent session state across restarts or multiple instances, use a Redis instance (Upstash has a free tier).
- Monitor usage and scale plan if necessary.

Optional CLI deploy
- Install the Render CLI: `curl -sL https://cdn.render.com/cli/install.sh | bash` (or follow Render docs for Windows)
- Login: `render login`
- Create service from local repo: `render services create --name confusion-radar --type web --env node --branch main --build-command "npm install" --start-command "npm start"`

*** End File