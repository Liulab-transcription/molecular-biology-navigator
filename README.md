# Molecular Biology Research Navigator

A curated, searchable index of molecular biology databases and online tools, with emphasis on transcription, epigenetics, proteins, genome editing and commonly used molecular resources.

## Features

- 118 resources organized into 10 categories
- Relevance-ranked full-text search and live suggestions
- Expandable descriptions and method tags
- External links open in a new tab
- Responsive desktop and mobile layout
- Browser-local click counts keyed to stable resource IDs

## Repository structure

- `index.html` — site entry point
- `assets/resources.js` — resource records and stable IDs
- `assets/app.js` — search, filtering, expansion and click-count behavior
- `assets/styles.css` — visual design and responsive layout
- `.github/workflows/deploy-pages.yml` — automatic GitHub Pages deployment

## GitHub Pages

Open **Settings → Pages** in this repository and select **GitHub Actions** as the publishing source. The included workflow publishes the site after every push to `main`.

Expected project URL:

`https://liulab-transcription.github.io/molecular-biology-navigator/`

## Hostinger deployment

This is a dependency-free static site. Deploy the repository root as the document root of the target domain or subdomain. `index.html` is the entry file and all asset paths are relative.

## Updating resources

Edit `assets/resources.js`. Preserve an existing resource's `id` when changing its name, URL or description so its click history stays associated with the same item. Give every new resource a unique ID.

Click counts are stored in each visitor's browser. They persist across updates on the same browser and domain, but they are not shared between users, browsers or domains.
