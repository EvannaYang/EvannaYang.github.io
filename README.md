# Evanna Yang portfolio

Static HTML, CSS and JavaScript portfolio. The public site contains the home page, About page, three case studies and two embedded Gabriel AI animation pages.

## Preview

Run `python3 -m http.server 8766` from this directory and open `http://localhost:8766/`.

## Build

Run `python3 scripts/build-site.py`. The script creates `dist/` and checks local page, image, script, stylesheet and anchor references. It includes the three CodeM source media files used by the current page and excludes other working materials and unused Linkol video exports.

## GitHub Pages

The workflow in `.github/workflows/pages.yml` builds and publishes `dist/` whenever `main` is updated. In the repository's **Settings → Pages**, choose **GitHub Actions** as the build and deployment source.
