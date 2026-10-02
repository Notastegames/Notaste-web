#!/usr/bin/env python3
"""Package a game page as a playable preview for a Claude artifact.

    python3 tools/preview_artifact.py heavy-traffic /path/to/folder

Writes the game's page to <folder>/index.html, with the files it needs beside
it (styles, the kit, the game's scripts, fonts, logos, covers), and prints the
list of supporting files as JSON. Publish <folder>/index.html as the artifact
page with those files alongside, get it approved, then merge the change.

An artifact page isn't served from notastegames.com, so the packaging:
- makes every path to a file relative ("/games/kit/kit.js" -> "games/kit/kit.js"),
- points links to other pages at the live site ("/#games" -> "https://notastegames.com/#games"),
- drops the page's own <html>, <head> and <body> tags (the artifact supplies
  them) and sets the body's class and attributes from a tiny script instead,
- embeds the headline font in the stylesheet (artifact pages may only load
  fonts from themselves), and drops the font preload,
- leaves out share images and other files the page doesn't load.
"""

import base64
import json
import os
import re
import shutil
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC = os.path.join(ROOT, "public")
SITE = "https://notastegames.com"

# what every playable game page loads, besides its own folder
SHARED = [
    "styles.css",
    "favicon.svg",
    "games/game.css",
    "games/game.js",
    "games/kit/kit.css",
    "games/kit/kit.js",
    "brand/logo-on-dark.svg",
    "brand/mark-on-dark.svg",
    "brand/mark-stamped.svg",
]


def is_file(path):
    return os.path.isfile(os.path.join(PUBLIC, path.lstrip("/")))


def is_page(path):
    """A link to a page on the site rather than a file the page loads."""
    bare = path.split("#")[0].split("?")[0]
    return bare == "/" or path.startswith("/#") or (bare.startswith("/games/") and not is_file(bare))


def rewrite(path, from_dir=""):
    """A root path as seen from a file in from_dir of the preview."""
    if is_page(path):
        return SITE + path
    rel = path.lstrip("/")
    return os.path.relpath(rel, from_dir) if from_dir else rel


def rewrite_html(text):
    return re.sub(r'(href|src)="(/[^"]*)"', lambda m: '%s="%s"' % (m.group(1), rewrite(m.group(2))), text)


def rewrite_css(text, from_dir):
    def one(m):
        path = m.group(1)
        if path.endswith((".woff", ".woff2")):
            data = base64.b64encode(open(os.path.join(PUBLIC, path.lstrip("/")), "rb").read()).decode()
            kind = "woff2" if path.endswith("woff2") else "woff"
            return 'url("data:font/%s;base64,%s")' % (kind, data)
        return 'url("%s")' % rewrite(path, from_dir)
    return re.sub(r'url\("(/[^"]+)"\)', one, text)


def rewrite_js(text):
    # string literals that start with "/": files and folders of files become
    # relative to the page; page links go to the live site
    def one(m):
        q, path = m.group(1), m.group(2)
        bare = path.split("#")[0]
        if path == "/":
            return m.group(0)   # usually the end of a built-up link, like "/games/" + slug + "/"
        if is_page(path):
            return q + SITE + path + q
        if is_file(bare) or os.path.isdir(os.path.join(PUBLIC, bare.strip("/"))):
            return q + path.lstrip("/") + q
        return m.group(0)
    return re.sub(r'(["\'])(/[A-Za-z0-9#_./-]*)\1', one, text)


def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    slug, out = sys.argv[1], os.path.abspath(sys.argv[2])
    game_dir = os.path.join("games", slug)
    page = os.path.join(PUBLIC, game_dir, "index.html")
    if not os.path.isfile(page):
        sys.exit("No game page at " + page)

    html = open(page, encoding="utf-8").read()
    head = re.search(r"<head>(.*?)</head>", html, re.S).group(1)
    body_tag = re.search(r"<body([^>]*)>", html).group(1)
    body = re.search(r"<body[^>]*>(.*)</body>", html, re.S).group(1)

    title = re.search(r"<title>(.*?)</title>", head).group(1)
    links = re.findall(r'<link rel="stylesheet"[^>]*>', head)
    attrs = dict(re.findall(r'([\w-]+)="([^"]*)"', body_tag))

    files = list(SHARED)
    for name in sorted(os.listdir(os.path.join(PUBLIC, game_dir))):
        if name != "index.html":
            files.append(game_dir + "/" + name)
    # covers for the page and for "More games"
    for name in sorted(os.listdir(os.path.join(PUBLIC, "art"))):
        if name.endswith(".svg"):
            files.append("art/" + name)

    if os.path.isdir(out):
        shutil.rmtree(out)
    for rel in files:
        src = os.path.join(PUBLIC, rel)
        dst = os.path.join(out, rel)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        if rel.endswith(".css"):
            open(dst, "w", encoding="utf-8").write(rewrite_css(open(src, encoding="utf-8").read(), os.path.dirname(rel)))
        elif rel.endswith(".js"):
            open(dst, "w", encoding="utf-8").write(rewrite_js(open(src, encoding="utf-8").read()))
        else:
            shutil.copyfile(src, dst)

    set_body = "".join(
        'document.body.setAttribute(%s, %s);' % (json.dumps(k), json.dumps(v)) for k, v in attrs.items()
    )
    fragment = "\n".join([
        "<title>%s</title>" % title.split(":")[0].strip(),
        "<style>:root { color-scheme: dark; }</style>",
        rewrite_html("\n".join(links)),
        "<script>%s</script>" % set_body,
        rewrite_html(body.strip()),
        "",
    ])
    open(os.path.join(out, "index.html"), "w", encoding="utf-8").write(fragment)
    print(json.dumps({rel: rel for rel in files}, indent=1))


if __name__ == "__main__":
    main()
