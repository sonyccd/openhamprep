# Open Ham Prep - Marketing Site

This directory contains the static marketing website for Open Ham Prep, deployed to GitHub Pages at `openhamprep.com`.

## Structure

```
website/
├── index.html          # The site — a single landing page
├── about.html          # Redirect stub → /
├── faq.html            # Redirect stub → /#faq
├── features.html       # Redirect stub → /#method
├── CNAME               # Custom domain configuration
├── css/
│   └── signal.css      # "Signal" design system + page styles
├── img/                # Brand assets
└── js/
    ├── config.js       # Analytics config (injected at deploy)
    └── analytics.js    # Amplitude loader
```

The marketing site is **one page**. Its nav links (`Method` / `Licenses` / `FAQ`)
are in-page anchors. The three `.html` files beside `index.html` exist only so
old inbound links and search results redirect instead of 404ing — they hold no
content. Their previous long-form content is in git history if it is ever wanted
back as additional sections.

## Deployment

The marketing site is automatically deployed to GitHub Pages when changes are pushed to the `website/` directory on the main branch.

- **URL:** https://openhamprep.com
- **Deployment:** GitHub Pages (free)
- **Workflow:** `.github/workflows/deploy-website.yml`

## Development

The site uses:
- The "Signal" design system (`css/signal.css`) — 2px grid, zero radius,
  amber as the only interactive colour. Source of truth is the Claude Design
  project `ui_kits/marketing/`.
- IBM Plex Sans / Sans Condensed / Mono via Google Fonts
- Inline SVG icons (no icon library)

No build step is required - all files are static HTML/CSS/JS.

## Local Testing

Simply open any HTML file in a browser, or use a local server:

```bash
cd marketing
python3 -m http.server 8000
# Visit http://localhost:8000
```

## Domain Configuration

The `CNAME` file configures the custom domain `openhamprep.com` to point to this GitHub Pages site.
