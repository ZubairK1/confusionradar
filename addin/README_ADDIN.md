Sideloading the PowerPoint Add-in (developer/test)

This add-in is a simple Task Pane that displays your hosted widget inside an iframe and provides Set/Reset controls.

1) Update manifest.xml
   - Open `addin/manifest.xml` and replace `https://your-domain.example` with your deployed app URL.
   - Ensure `SourceLocation` points to `https://<your-host>/addin/taskpane.html` (we included files under `/addin`).

2) Ensure the add-in pages are publicly accessible on your app host
   - `https://<your-host>/addin/taskpane.html`
   - `https://<your-host>/widget.html`
   If you used the project layout, these are served by Express at `/addin/*` and `/widget.html`.

3) Sideload into PowerPoint (Desktop Windows)
   - Place the manifest somewhere accessible, e.g. `C:\temp\confusion-manifest.xml`.
   - Open PowerPoint (desktop) -> Insert -> My Add-ins -> Shared Folder (or Manage My Add-ins) -> "Add from file" and select the manifest.
   - The add-in will appear under My Add-ins. Click it to open the taskpane.

4) Using the Add-in
   - Enter a `Session code` created from `https://<your-host>/host` and click `Set`.
   - The iframe will load the widget and the widget will join the session.
   - Click `Reset` to post a reset message to the widget (which triggers `/api/reset`).

Notes about auto-reset on slide change
- PowerPoint does not expose a simple slide-change event to taskpane add-ins in older API sets. If you need fully automatic reset on slide navigation inside PowerPoint, we can
  - Build a full Office Add-in that uses the newer PowerPoint JavaScript API (if available in your environment), or
  - Use per-slide iframe URLs with `?reset=1` so the widget resets on load (works if the add-in reloads the iframe when the slide activates), or
  - Add a small script to the presenter machine that calls the add-in's reset button when advancing slides (advanced).

Security
- For production, restrict CORS and frame-ancestors to the domains you control.
- Do not expose sensitive session codes publicly; consider adding an optional passphrase for each session.

If you want, I can:
- Patch `server.js` to serve the add-in files under `/addin/` (already configured via static), ensure CSP allows Office frames, and restart the server.
- Produce a packaged manifest with your actual deployed domain if you tell me the URL.
