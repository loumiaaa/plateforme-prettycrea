#!/usr/bin/env python3
"""Construit la web app PrettyCrea dans dist/ :
- index.html : l'application complète (CSS, JS, citations et configuration intégrés) ;
- manifest.webmanifest, sw.js et icons/ : ce qu'il faut pour l'installer
  sur iPad, iPhone et ordinateur et l'utiliser hors connexion.
"""
import hashlib
import json
import pathlib
import shutil

root = pathlib.Path(__file__).parent
src = root / 'src'
public = root / 'public'
dist = root / 'dist'

quotes = json.loads((src / 'quotes.json').read_text())
quotes_js = 'window.PC_QUOTES = ' + json.dumps(
    [{k: q.get(k) for k in ('text', 'fr', 'book', 'series', 'author')} for q in quotes],
    ensure_ascii=False, indent=0) + ';'
css = (src / 'styles.css').read_text()
app = (src / 'app.js').read_text()
config = (src / 'config.js').read_text()

FONTS = ('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=UnifrakturMaguntia'
         '&family=Special+Elite&family=Instrument+Serif:ital@0;1&family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400'
         '&family=Atkinson+Hyperlegible+Next:wght@400;600;700&display=swap')

html = f'''<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>PrettyCrea</title>
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#0e0c0a">
<meta name="color-scheme" content="dark light">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" sizes="192x192" href="icons/icon-192.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="PrettyCrea">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{FONTS}">
<style>
{css}
</style>
</head>
<body>
<div id="root"></div>
<dialog id="sheet" class="sheet"></dialog>
<div id="toast" class="toast" role="status" aria-live="polite" hidden></div>
<script>
{config}
{quotes_js}
</script>
<script>
{app}
</script>
</body>
</html>
'''

if dist.exists():
    shutil.rmtree(dist)
dist.mkdir()
(dist / 'index.html').write_text(html)
shutil.copytree(public, dist, dirs_exist_ok=True)

# Le service worker change de version à chaque construction : les appareils récupèrent la mise à jour.
version = hashlib.sha256(html.encode()).hexdigest()[:12]
sw = (dist / 'sw.js').read_text().replace('__VERSION__', version)
(dist / 'sw.js').write_text(sw)

print(f'dist/ prêt · version {version} · {len(quotes)} citations')
