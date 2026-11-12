"""Re-trace the official iTOP Pavers logo (old site file ITOPPAVERS-LOGO-DARK-BG.png) into SVG paths.

Writes assets/logo/o.txt (orange: house mark + "Pavers"), d.txt ("iTOP" wordmark) and vb.txt (viewBox).
Tracing uses the anti-aliased colour intensity (not a hard mask), upscaled 8x, so edges are smooth.
The geometric parts (house mark, "iTOP") are simplified more strongly so diagonals come out as clean
straight lines; the "Pavers" lettering keeps a finer tolerance for its curves.
The official artwork colour is #FB5D00 (used for the logo only).

    python assets/logo/trace_logo_v2.py assets/logo/source/itoppavers-logo-dark-bg.png
"""
import sys, pathlib
import numpy as np, cv2
from PIL import Image

src = sys.argv[1]
OUT = pathlib.Path(__file__).resolve().parent
S = 8
im = np.array(Image.open(src).convert('RGBA')).astype(np.float32)
r, g, b, a = (im[..., i] for i in range(4))
al = a / 255.0
orange = np.clip((r - b - 120) / 130.0, 0, 1) * al * (g < 200)          # orange ink coverage
white = np.clip((np.minimum(np.minimum(r, g), b) - 90) / 160.0, 0, 1) * al  # white ink coverage

ys, xs = np.where((orange > .5) | (white > .5))
x0, y0, x1, y1 = xs.min() - 2, ys.min() - 2, xs.max() + 3, ys.max() + 3
orange, white = orange[y0:y1, x0:x1], white[y0:y1, x0:x1]
W, H = x1 - x0, y1 - y0

def contours(cov):
    m = cv2.resize(cov, None, fx=S, fy=S, interpolation=cv2.INTER_CUBIC)
    m = cv2.GaussianBlur(m, (0, 0), S * .35)
    m = (m > .5).astype(np.uint8) * 255
    cs, _ = cv2.findContours(m, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    return [c for c in cs if cv2.contourArea(c) > 4 * S * S]

def snap(p, tol=1.4):
    """Make near-horizontal / near-vertical edges exact (the logo is built on 0/90/45 degree lines)."""
    p = p.astype(float)
    for _ in range(3):
        n = len(p)
        for i in range(n):
            j = (i + 1) % n
            dx, dy = p[j, 0] - p[i, 0], p[j, 1] - p[i, 1]
            if abs(dy) < tol and abs(dx) > abs(dy) * 3: m = (p[i, 1] + p[j, 1]) / 2; p[i, 1] = p[j, 1] = m
            elif abs(dx) < tol and abs(dy) > abs(dx) * 3: m = (p[i, 0] + p[j, 0]) / 2; p[i, 0] = p[j, 0] = m
    return p

def path(cs, eps, do_snap=True):
    out = []
    for c in cs:
        p = cv2.approxPolyDP(c, eps * S, True).reshape(-1, 2) / S
        if do_snap: p = snap(p)
        out.append('M' + 'L'.join(f'{x:.2f} {y:.2f}' for x, y in p) + 'Z')
    return ''.join(out)

# split orange into the house mark (left) and "Pavers" (lettering under the wordmark)
wx = np.where(white.max(axis=0) > .5)[0].min()          # left edge of the "iTOP" wordmark
oc = contours(orange)
mark = [c for c in oc if c[:, 0, 0].max() / S < wx - 4]
text = [c for c in oc if c[:, 0, 0].max() / S >= wx - 4]
o = path(mark, .9) + path(text, .32, do_snap=False)
d = path(contours(white), .75)
m = path(mark, .9)
mx = np.concatenate([c.reshape(-1, 2) for c in mark]) / S
bx0, by0 = mx.min(0) - 1; bx1, by1 = mx.max(0) + 1
(OUT / 'm.txt').write_text(m); (OUT / 'mvb.txt').write_text(f'{bx0:.1f} {by0:.1f} {bx1 - bx0:.1f} {by1 - by0:.1f}')
(OUT / 'o.txt').write_text(o); (OUT / 'd.txt').write_text(d); (OUT / 'vb.txt').write_text(f'0 0 {W} {H}')
print('viewBox', W, H, '| mark parts', len(mark), '| Pavers parts', len(text), '| path chars', len(o), len(d))
