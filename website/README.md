# Open Ham Prep - Marketing Site

This directory contains the static marketing website for Open Ham Prep, deployed to GitHub Pages at `openhamprep.com`.

## Structure

```
marketing/
├── index.html          # Landing page
├── about.html          # About page
├── faq.html            # FAQ page
├── features.html       # Features page
├── CNAME               # Custom domain configuration
├── css/
│   └── styles.css      # Custom CSS styles
└── js/
    └── theme.js        # Theme toggle functionality
```

## Deployment

The marketing site is automatically deployed to GitHub Pages when changes are pushed to the `marketing/` directory on the main branch.

- **URL:** https://openhamprep.com
- **Deployment:** GitHub Pages (free)
- **Workflow:** `.github/workflows/deploy-marketing.yml`

## Development

The site uses:
- Tailwind CSS (via CDN)
- Lucide Icons (via CDN)
- Vanilla JavaScript for interactivity
- Google Fonts (Space Grotesk & JetBrains Mono)

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
