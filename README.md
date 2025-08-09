# julianhilgemann.com (Link Hub)

Static link-hub site for GitHub Pages.

## Quick setup
1) Replace all `YOURHANDLE`, `YOURCHANNEL`, `YOURSUBSTACK` in `index.html`.
2) Replace `G-XXXXXXX` (2x) with your GA4 Measurement ID in `index.html`.
3) Optional: drop official brand SVGs into `/assets/icons/` with the same filenames to replace placeholders.
4) Push to a public repo named `julianhilgemann.com`. Keep `CNAME` file with your domain.
5) Enable GitHub Pages (branch: `main`, folder: `/`), and Enforce HTTPS.
6) Test cookie banner and GA loading only after consent.

## Notes
- Consent via Klaro! (CDN). You can self-host later if desired.
- GA4 events: custom `click_outbound` is sent on tile clicks if GA is loaded.
- Responsive: mobile-first, two-column grid on large screens.
