# World AI Business Survey (WAIBS) — website

The public website for the **World AI Business Survey (WAIBS)**, a global survey
measuring how businesses adopt and are affected by artificial intelligence.

This is a plain static site (HTML + CSS), served directly by GitHub Pages with
no build step.

## Structure

```
WAIBSweb/
├── index.html            # Landing page
├── 404.html              # Custom not-found page
├── .nojekyll             # Tell GitHub Pages to serve files as-is (skip Jekyll)
├── assets/
│   └── css/
│       └── style.css     # Site styles
└── README.md
```

## Preview locally

Just open `index.html` in a browser, or run a tiny local server:

```bash
# Python 3
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploy on GitHub Pages

1. Create a GitHub repository (e.g. `WAIBSweb`) and push this folder to it:

   ```bash
   git init
   git add .
   git commit -m "Initial WAIBS website"
   git branch -M main
   git remote add origin git@github.com:<your-org>/WAIBSweb.git
   git push -u origin main
   ```

2. On GitHub: **Settings → Pages → Build and deployment**
   - **Source:** Deploy from a branch
   - **Branch:** `main` / `/ (root)`
   - Save.

3. After a minute the site is live at
   `https://<your-org>.github.io/WAIBSweb/`
   (or at your custom domain if you configure one).

### Custom domain (optional)

Add a `CNAME` file containing your domain (e.g. `waibs.org`) and configure the
DNS records as described in GitHub's Pages documentation.

## Editing content

All page text lives in `index.html`; styling is in `assets/css/style.css`.
Replace the placeholder contact email and team details as the project develops.
