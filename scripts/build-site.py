"""Build the public, static portfolio for GitHub Pages."""

from html.parser import HTMLParser
from pathlib import Path
from shutil import copy2, copytree, rmtree
from urllib.parse import unquote, urlsplit
import re


ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
PAGES = (
    "index.html",
    "about.html",
    "onboarding-prototype.html",
    "projects/codem-concise.html",
    "projects/linkol-concise.html",
    "projects/gabriel-concise.html",
    "projects/gabriel-tutorial.html",
)
EXCLUDED_ASSETS = {
    "linkol-laptop/screen.mp4",
    "linkol-laptop/screen-poster.jpg",
    "linkol-laptop/preview-composite.png",
}
PUBLIC_SOURCE_FILES = (
    "codem-cli-motion-hq.mp4",
    "codem-cli-motion-poster.jpg",
    "image/final_homepage.png",
)


class References(HTMLParser):
    def __init__(self):
        super().__init__()
        self.paths = []

    def handle_starttag(self, tag, attrs):
        for name, value in attrs:
            if name in {"href", "src", "poster"} and value:
                self.paths.append(value)


def check_reference(source: Path, reference: str):
    parsed = urlsplit(reference)
    if parsed.scheme or parsed.netloc or reference.startswith(("#", "data:", "mailto:", "tel:")):
        return
    if reference.startswith("/"):
        raise ValueError(f"Root-relative path is not safe on GitHub Pages: {source}: {reference}")
    target = (source.parent / unquote(parsed.path)).resolve()
    if not target.is_relative_to(DIST) or not target.exists():
        raise FileNotFoundError(f"Missing public resource: {source.relative_to(DIST)} -> {reference}")
    if parsed.fragment and target.suffix == ".html":
        markup = target.read_text(encoding="utf-8")
        if f'id="{parsed.fragment}"' not in markup:
            raise ValueError(f"Missing anchor: {source.relative_to(DIST)} -> {reference}")


def main():
    if DIST.exists():
        rmtree(DIST)
    DIST.mkdir()
    for page in PAGES:
        target = DIST / page
        target.parent.mkdir(parents=True, exist_ok=True)
        copy2(ROOT / page, target)
    for folder in ("styles", "scripts", "vendor"):
        copytree(ROOT / folder, DIST / folder)
    copytree(ROOT / "assets", DIST / "assets", ignore=lambda directory, names: {
        name for name in names
        if (Path(directory).relative_to(ROOT / "assets") / name).as_posix() in EXCLUDED_ASSETS
        or name == ".DS_Store"
    })
    for relative in PUBLIC_SOURCE_FILES:
        target = DIST / "Source" / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        copy2(ROOT / "Source" / relative, target)
    (DIST / ".nojekyll").touch()

    for page in DIST.rglob("*.html"):
        refs = References()
        refs.feed(page.read_text(encoding="utf-8"))
        for ref in refs.paths:
            check_reference(page, ref)
    for css in DIST.rglob("*.css"):
        for ref in re.findall(r"url\(\s*['\"]?([^)'\"]+)", css.read_text(encoding="utf-8")):
            check_reference(css, ref)
    count = sum(1 for path in DIST.rglob("*") if path.is_file())
    size = sum(path.stat().st_size for path in DIST.rglob("*") if path.is_file())
    print(f"Validated {len(PAGES)} pages and {count} files ({size / 1024 / 1024:.1f} MiB) in {DIST}")


if __name__ == "__main__":
    main()
