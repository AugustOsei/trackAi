"""
Generates the engraved footer artwork (src/components/footer/art.ts).

The footer is drawn like a hand-tinted engraving: ink outlines plus fine
hatching for shade. That's thousands of short strokes, so they're generated
here rather than written by hand — hatching clipped to each shape, and smoke
billows built from overlapping circles with only their outer edges inked.

Everything is seeded, so re-running produces the same file. Run:
    python3 scripts/generate-footer-art.py
"""

import math
import random
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "src/components/footer/art.ts"


def f(v):
    s = f"{v:.1f}"
    return s[:-2] if s.endswith(".0") else s


def poly(pts, close=True):
    d = "M" + " L".join(f"{f(x)} {f(y)}" for x, y in pts)
    return d + ("Z" if close else "")


def seg(x1, y1, x2, y2):
    return f"M{f(x1)} {f(y1)}L{f(x2)} {f(y2)}"


def circle(cx, cy, r):
    return f"M{f(cx - r)} {f(cy)}a{f(r)} {f(r)} 0 1 0 {f(2 * r)} 0a{f(r)} {f(r)} 0 1 0 {f(-2 * r)} 0Z"


def rect(x, y, w, h):
    return poly([(x, y), (x + w, y), (x + w, y + h), (x, y + h)])


def quad_pts(p0, p1, p2, n=16):
    out = []
    for i in range(n + 1):
        t = i / n
        x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0]
        y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]
        out.append((x, y))
    return out


def hatch(polygon, angle=45, spacing=3.0, seed=0, shorten=0.6, jitter=0.25):
    """Parallel strokes at `angle` degrees, clipped to a (possibly concave) polygon."""
    rnd = random.Random(seed)
    a = math.radians(angle)
    ca, sa = math.cos(a), math.sin(a)
    # rotate the polygon so hatch lines become horizontal
    rot = [(x * ca + y * sa, -x * sa + y * ca) for x, y in polygon]
    ys = [p[1] for p in rot]
    out = []
    y = min(ys) + spacing / 2
    while y < max(ys):
        xs = []
        n = len(rot)
        for i in range(n):
            (x1, y1), (x2, y2) = rot[i], rot[(i + 1) % n]
            if (y1 <= y < y2) or (y2 <= y < y1):
                xs.append(x1 + (y - y1) * (x2 - x1) / (y2 - y1))
        xs.sort()
        for i in range(0, len(xs) - 1, 2):
            xa = xs[i] + rnd.uniform(0, shorten)
            xb = xs[i + 1] - rnd.uniform(0, shorten)
            if xb - xa < 1:
                continue
            yy = y + rnd.uniform(-jitter, jitter)
            # rotate back
            p1 = (xa * ca - yy * sa, xa * sa + yy * ca)
            p2 = (xb * ca - yy * sa, xb * sa + yy * ca)
            out.append(seg(*p1, *p2))
        y += spacing
    return "".join(out)


def shade_columns(x0, x1, top, bottom, seed=0, dense_right=True, min_gap=1.3, max_gap=6.0):
    """Vertical strokes, packed tighter toward one side: the shading on a
    cylinder lit from the left (funnel, lighthouse). `top(x)`/`bottom(x)` give
    the extent at each x."""
    rnd = random.Random(seed)
    out = []
    x = x0 + 1
    while x < x1 - 0.5:
        t = (x - x0) / (x1 - x0)
        if not dense_right:
            t = 1 - t
        gap = max_gap - (max_gap - min_gap) * t ** 1.4
        if t > 0.35:
            y0, y1 = top(x) + rnd.uniform(0.3, 1.2), bottom(x) - rnd.uniform(0.3, 1.2)
            if y1 > y0:
                out.append(seg(x, y0, x, y1))
        x += gap
    return "".join(out)


# ----------------------------------------------------------------------------
# Smoke billows
# ----------------------------------------------------------------------------

def billow(seed, w=90, h=64):
    """A cumulus puff: many overlapping lobes, inked only where an edge is on
    the outside, then shaded like an engraving — concentric curls in the
    lower-right of each lobe and fine hatching along the underside."""
    rnd = random.Random(seed)
    cx, cy = w / 2, h / 2 + 6
    circles = [(cx, cy, h * 0.3)]
    # an irregular ring of lobes, heavier on top so it reads as rising
    for k in range(11):
        ang = math.pi + (k / 10) * math.pi * 1.05 + rnd.uniform(-0.12, 0.12)
        dist = rnd.uniform(h * 0.22, h * 0.34)
        r = rnd.uniform(h * 0.13, h * 0.22)
        circles.append((cx + math.cos(ang) * dist * 1.45, cy + math.sin(ang) * dist, r))
    for _ in range(5):  # underside lumps
        circles.append((cx + rnd.uniform(-w * 0.34, w * 0.34), cy + rnd.uniform(h * 0.04, h * 0.2), rnd.uniform(h * 0.1, h * 0.16)))

    fill = "".join(circle(x, y, r) for x, y, r in circles)

    def covered(px, py, skip, margin=0.5):
        for j, (x, y, r) in enumerate(circles):
            if j != skip and (px - x) ** 2 + (py - y) ** 2 < (r - margin) ** 2:
                return True
        return False

    def arcs(x, y, r, a0, a1, skip, steps=None):
        steps = steps or max(10, int(r * 2.2))
        runs, run = [], []
        for k in range(steps + 1):
            t = a0 + (a1 - a0) * k / steps
            px, py = x + r * math.cos(t), y + r * math.sin(t)
            if covered(px, py, skip):
                if len(run) > 1:
                    runs.append(poly(run, close=False))
                run = []
            else:
                run.append((px, py))
        if len(run) > 1:
            runs.append(poly(run, close=False))
        return runs

    outline, shade = [], []
    for i, (x, y, r) in enumerate(circles):
        outline += arcs(x, y, r, 0, 2 * math.pi, i, max(28, int(r * 4)))
        # curls: two or three nested arcs hugging the lower right
        for m, frac in enumerate((0.82, 0.64, 0.46)):
            if m == 2 and r < h * 0.17:
                continue
            a0 = rnd.uniform(-0.1, 0.25) * math.pi
            a1 = a0 + rnd.uniform(0.45, 0.75) * math.pi
            shade += arcs(x + r * 0.07, y + r * 0.07, r * frac, a0, a1, i)
    # underside hatching: short diagonal strokes, only where no lobe overlaps
    for k in range(60):
        px = cx + rnd.uniform(-w * 0.42, w * 0.42)
        py = cy + rnd.uniform(h * 0.05, h * 0.32)
        inside_any = [j for j, (x, y, r) in enumerate(circles) if (px - x) ** 2 + (py - y) ** 2 < (r * 0.92) ** 2]
        if not inside_any:
            continue
        top_j = max(inside_any)
        x, y, r = circles[top_j]
        if py < y:  # only the lower half of the lobe it sits in
            continue
        l = rnd.uniform(2.5, 4.5)
        shade.append(seg(px, py, px + l * 0.8, py - l * 0.6))
    return {"w": w, "h": h, "fill": fill, "line": "".join(outline), "shade": "".join(shade)}


# ----------------------------------------------------------------------------
# Tug (local coords: 270 x 130, bow to the right, waterline y = 104)
# ----------------------------------------------------------------------------

def sheer(x):
    # deck edge: low at the stern (x 10, y 80), sweeping up to a high bow (x 212, y 56)
    t = (x - 10) / 202
    return 80 - 24 * t ** 1.7


def clip_band(pts, y0, y1):
    """Polygon ∩ horizontal band y0..y1 (Sutherland–Hodgman on two edges)."""
    def clip(p_list, keep, inter):
        out = []
        for i in range(len(p_list)):
            p, q = p_list[i - 1], p_list[i]
            if keep(q):
                if not keep(p):
                    out.append(inter(p, q))
                out.append(q)
            elif keep(p):
                out.append(inter(p, q))
        return out

    def at_y(yc):
        return lambda p, q: (p[0] + (yc - p[1]) * (q[0] - p[0]) / (q[1] - p[1]), yc)

    out = clip(pts, lambda p: p[1] >= y0, at_y(y0))
    return clip(out, lambda p: p[1] <= y1, at_y(y1))


def tug():
    """A harbour tug in profile, bow to the right: short and tall, high bow,
    towing arch aft, fat raked funnel, big wheelhouse forward. Waterline y 104."""
    hull = (
        [(10, 80), (6, 88), (9, 100), (16, 112), (34, 119), (150, 121)]
        + quad_pts((150, 121), (196, 118), (210, 92), 10)[1:]
        + [(216, 54)]
        + [(x, sheer(x)) for x in range(206, 9, -8)]
    )
    upper, boot, below = clip_band(hull, -50, 99), clip_band(hull, 99, 106), clip_band(hull, 106, 140)
    ink, fine, heavy, washes = [], [], [], {}
    ink.append(poly(hull))
    washes["hull"] = poly(upper)
    washes["boot"] = poly(boot)
    washes["bottom"] = poly(below)
    # planking following the sheer
    for k in range(1, 5):
        pts = [(x, sheer(x) + 5.2 * k) for x in range(12, 211, 5)]
        pts = [(x, y) for x, y in pts if y < 98.5]
        if len(pts) > 2:
            fine.append(poly(pts, close=False))
    heavy.append(poly([(x, sheer(x) + 3) for x in range(8, 214, 5)], close=False))  # rubbing strake
    fine.append(hatch(clip_band(hull, 86, 99), angle=62, spacing=3.2, seed=11))
    fine.append(hatch(boot, angle=-35, spacing=2.0, seed=12))
    fine.append(hatch(below, angle=35, spacing=1.5, seed=13))
    # bulwark: rail above the deck edge, with stanchions
    ink.append(poly([(x, sheer(x) - 7) for x in range(14, 211, 5)], close=False))
    for x in range(18, 210, 8):
        fine.append(seg(x, sheer(x) - 7, x, sheer(x)))
    # bow: a rope fender draped over the stem, and the anchor at the hawse
    bow = [(208, 62), (218, 58), (220, 72), (212, 80)]
    heavy.append(poly(quad_pts((212, 56), (224, 64), (214, 82), 10), close=False))
    for k in range(5):
        fine.append(seg(212 + k * 1.4, 60 + k * 4, 219 - k * 0.6, 62 + k * 4))
    ax, ay = 196, 74
    ink.append(circle(ax, ay - 7, 1.7))
    ink.append(seg(ax, ay - 5, ax, ay + 7))
    ink.append(poly(quad_pts((ax - 6, ay + 2), (ax - 5, ay + 9), (ax, ay + 8)), close=False))
    ink.append(poly(quad_pts((ax + 6, ay + 2), (ax + 5, ay + 9), (ax, ay + 8)), close=False))
    ink.append(seg(ax - 4, ay - 2, ax + 4, ay - 2))
    # portholes along the hull
    for x in (60, 84, 108, 132, 170):
        y = sheer(x) + 12
        ink.append(circle(x, y, 3.2))
        fine.append(circle(x, y, 1.7))
    # a few tyre fenders, not a wall of them
    fenders = []
    for x in (36, 98, 150, 186):
        y = sheer(x) + 6
        fenders.append(circle(x, y, 4.6))
        fine.append(circle(x, y, 2.0))
        fine.append(seg(x, sheer(x) - 7, x, y - 4.6))
    # towing arch over the aft deck, and the hook
    ink.append(poly(quad_pts((14, sheer(14) - 7), (27, 46), (42, sheer(42) - 7), 14), close=False))
    fine.append(poly(quad_pts((16.5, sheer(16) - 7), (27, 49), (39.5, sheer(40) - 7), 14), close=False))
    ink.append(rect(22, 66, 7, 8))

    # deckhouse
    ink.append(rect(46, 40, 106, 32))
    washes["house"] = rect(46, 40, 106, 32)
    ink.append(rect(42, 36, 114, 5))
    fine.append(hatch([(42, 37), (156, 37), (156, 40.5), (42, 40.5)], angle=0, spacing=1.1, seed=21, jitter=0.05))
    for x in (56, 70, 126, 140):
        ink.append(circle(x, 54, 4.2))
        fine.append(circle(x, 54, 2.6))
    ink.append(rect(84, 46, 12, 26))
    fine.append(rect(86.5, 49, 7, 8))
    fine.append(circle(93.5, 61, 0.9))
    washes["buoy"] = circle(111, 56, 7.4)
    ink.append(circle(111, 56, 7.4))
    ink.append(circle(111, 56, 4.0))
    fine.append(shade_columns(46, 152, lambda x: 41.5, lambda x: 71.5, seed=22, min_gap=2.0, max_gap=10))

    # wheelhouse, forward and raised
    ink.append(rect(112, 12, 50, 26))
    washes["wheelhouse"] = rect(112, 12, 50, 26)
    ink.append(rect(106, 8, 62, 5))
    fine.append(hatch([(106, 9), (168, 9), (168, 12.5), (106, 12.5)], angle=0, spacing=1.1, seed=31, jitter=0.05))
    for x in (116, 127, 138, 149):
        ink.append(rect(x, 16, 9, 13))
        fine.append(hatch([(x, 16), (x + 9, 16), (x + 9, 29), (x, 29)], angle=28, spacing=2.1, seed=x + 3))
    fine.append(shade_columns(112, 162, lambda x: 30, lambda x: 37.5, seed=32, min_gap=1.6, max_gap=6))
    # searchlight and nav light on the roof
    ink.append(poly(quad_pts((150, 8), (154, 0), (158, 8)), close=False))
    ink.append(rect(116, 4, 4, 4))
    # mast with short stays, yard and pennant
    ink.append(seg(138, 8, 138, -22))
    ink.append(seg(131, -12, 145, -12))
    fine.append(seg(138, -22, 124, 8))
    fine.append(seg(138, -22, 152, 8))
    washes["pennant"] = poly([(138, -22), (116, -18), (138, -15)])
    ink.append(poly([(138, -22), (116, -18), (138, -15)]))

    # funnel: fat, raked aft, gold with a black top and a white band
    rake = 5
    fl = lambda y: 62 - (40 - y) / 46 * rake   # left edge x at height y
    funnel = [(62, 40), (94, 40), (94 - rake, -6), (62 - rake, -6)]
    ink.append(poly(funnel))
    washes["funnel"] = poly(funnel)
    top_band = [(62 - rake, -6), (94 - rake, -6), (94 - rake * 0.78, 4), (62 - rake * 0.78, 4)]
    washes["funnelTop"] = poly(top_band)
    fine.append(hatch(top_band, angle=0, spacing=0.9, seed=41, jitter=0.05))
    white_band = [(fl(14), 14), (fl(14) + 32, 14), (fl(22) + 32, 22), (fl(22), 22)]
    washes["funnelBand"] = poly(white_band)
    ink.append(seg(fl(4), 4, fl(4) + 32, 4))
    ink.append(seg(fl(14), 14, fl(14) + 32, 14))
    ink.append(seg(fl(22), 22, fl(22) + 32, 22))
    heavy.append(poly([(fl(-6) - 2, -6), (fl(-6) + 34, -6)], close=False))  # lip
    for y in (8, 28, 35):
        for k in range(7):
            fine.append(circle(fl(y) + 3 + k * 4.4, y, 0.5))
    fine.append(shade_columns(58, 94, lambda x: 4.5, lambda x: 39.5, seed=42, min_gap=1.2, max_gap=5.5))
    ink.append(rect(95, 10, 3, 9))  # whistle

    return {
        "ink": "".join(ink),
        "fine": "".join(fine),
        "heavy": "".join(heavy),
        "fenders": "".join(fenders),
        "washes": washes,
        "smoke": {"x": 78 - rake, "y": -6},
        "towHook": {"x": 12, "y": 76},
    }


# ----------------------------------------------------------------------------
# Barge (local coords: 340 x 90, waterline y = 74)
# ----------------------------------------------------------------------------

def barge():
    ink, fine, washes = [], [], {}
    hull = [(4, 56), (336, 56), (330, 70)] + quad_pts((330, 70), (326, 84), (314, 86), 6)[1:] + [(20, 86)] + quad_pts((20, 86), (8, 84), (6, 70), 6)[1:]
    ink.append(poly(hull))
    washes["hull"] = poly(hull)
    ink.append(seg(4, 60, 336, 60))
    for k in (65, 70):
        fine.append(seg(8, k, 331, k))
    fine.append(hatch([(6, 72), (330, 72), (326, 86), (14, 86)], angle=40, spacing=2.0, seed=51))
    for x in (12, 328):
        ink.append(rect(x - 3, 50, 6, 6))
    containers = []
    for i, x0 in enumerate((16, 124, 232)):
        x1, y0, y1 = x0 + 100, 12, 56
        ink.append(rect(x0, y0, 100, 44))
        ink.append(rect(x0, y0, 100, 4))
        ink.append(rect(x0, y1 - 4, 100, 4))
        for x in range(x0 + 4, x1 - 14, 5):
            fine.append(seg(x, y0 + 5, x, y1 - 5))
        # door end with lock bars
        ink.append(seg(x1 - 13, y0 + 4, x1 - 13, y1 - 4))
        for bx in (x1 - 9, x1 - 4):
            fine.append(seg(bx, y0 + 5, bx, y1 - 5))
            fine.append(rect(bx - 1.2, 30, 2.4, 5))
        fine.append(hatch([(x1 - 13, y0 + 4), (x1, y0 + 4), (x1, y1 - 4), (x1 - 13, y1 - 4)], angle=70, spacing=2.4, seed=60 + i))
        containers.append({"x": x0, "y": y0, "w": 100, "h": 44})
    return {"ink": "".join(ink), "fine": "".join(fine), "washes": washes, "containers": containers}


# ----------------------------------------------------------------------------
# Lighthouse on its rock (local coords: 260 x 210, waterline y = 190)
# ----------------------------------------------------------------------------

def lighthouse():
    ink, fine, washes = [], [], {}
    rnd = random.Random(70)
    # rocky islet
    rock = [(0, 196), (14, 176), (34, 168), (52, 150), (84, 142), (120, 138), (150, 140), (178, 148), (204, 150), (226, 164), (246, 178), (260, 196)]
    ink.append(poly(rock, close=False))
    washes["rock"] = poly(rock + [(260, 210), (0, 210)])
    # boulder contours and cross-hatching
    for (cx, cy, r) in ((40, 178, 20), (92, 160, 26), (160, 158, 24), (214, 176, 22), (130, 184, 18)):
        pts = quad_pts((cx - r, cy + 4), (cx - r * 0.2, cy - r), (cx + r, cy + 2), 10)
        ink.append(poly(pts, close=False))
    fine.append(hatch(rock + [(260, 210), (0, 210)], angle=35, spacing=2.6, seed=71))
    fine.append(hatch([(120, 150), (200, 150), (250, 196), (140, 196)], angle=-40, spacing=2.4, seed=72))
    # keeper's cottage
    ink.append(rect(150, 116, 46, 28))
    washes["cottage"] = rect(150, 116, 46, 28)
    roof = [(144, 118), (173, 98), (202, 118)]
    ink.append(poly(roof))
    washes["roof"] = poly(roof)
    fine.append(hatch(roof, angle=-20, spacing=1.8, seed=73))
    ink.append(rect(160, 124, 9, 10))
    ink.append(rect(178, 126, 8, 18))
    ink.append(rect(186, 100, 5, 10))  # chimney
    fine.append(shade_columns(150, 196, lambda x: 117, lambda x: 143, seed=74, min_gap=1.8, max_gap=7))
    # tower: tapered, x from 78..118 at base (y 142) to 86..110 at top (y 36)
    def left(y):
        return 78 + (142 - y) * (8 / 106)

    def right(y):
        return 118 - (142 - y) * (8 / 106)

    tower = [(78, 142), (118, 142), (110, 36), (86, 36)]
    ink.append(poly(tower))
    washes["tower"] = poly(tower)
    bands = []
    for (ya, yb) in ((118, 104), (84, 70), (50, 38)):
        bands.append(poly([(left(ya), ya), (right(ya), ya), (right(yb), yb), (left(yb), yb)]))
        ink.append(seg(left(ya), ya, right(ya), ya))
        ink.append(seg(left(yb), yb, right(yb), yb))
    washes["bands"] = "".join(bands)
    # shading on the right of the tower (x-dependent top/bottom not needed: tower is near-vertical)
    out = []
    x = 90
    while x < 117:
        t = (x - 86) / 32
        gap = 6 - 4.6 * t ** 1.3
        # extent: from where the right edge allows
        y_top = 36 + max(0, (x - 110)) * (106 / 8)
        out.append(seg(x, y_top + 1.5, x, 141))
        x += max(gap, 1.3)
    fine.append("".join(out))
    # door and windows
    ink.append(poly([(93, 142), (93, 130), (103, 130), (103, 142)], close=False))
    ink.append(poly(quad_pts((93, 130), (98, 124), (103, 130)), close=False))
    for y in (96, 62):
        ink.append(rect(95, y, 6, 8))
    # gallery and railing
    ink.append(rect(80, 32, 36, 4))
    ink.append(seg(78, 24, 118, 24))
    for x in range(80, 118, 4):
        fine.append(seg(x, 24, x, 32))
    # lantern room
    ink.append(rect(88, 8, 20, 16))
    for x in (93, 98, 103):
        fine.append(seg(x, 8, x, 24))
    fine.append(seg(88, 16, 108, 16))
    washes["lamp"] = rect(88.5, 8.5, 19, 15)
    # dome and vane
    dome = quad_pts((85, 8), (98, -8), (111, 8), 12)
    ink.append(poly(dome, close=False))
    ink.append(seg(85, 8, 111, 8))
    fine.append(hatch(dome + [(111, 8)], angle=-30, spacing=1.6, seed=75))
    ink.append(seg(98, 0, 98, -10))
    ink.append(poly([(98, -10), (106, -8), (98, -6)]))
    # surf around the rock
    surf = []
    for i in range(18):
        x = rnd.uniform(0, 260)
        y = rnd.uniform(186, 200)
        l = rnd.uniform(6, 16)
        surf.append(poly(quad_pts((x, y), (x + l / 2, y - 2.5), (x + l, y)), close=False))
    return {"ink": "".join(ink), "fine": "".join(fine), "surf": "".join(surf), "washes": washes}


# ----------------------------------------------------------------------------
# Sea tiles
# ----------------------------------------------------------------------------

TILE = 600


def wave_strokes(seed, y0, y1, rows, min_len, max_len, density, weight_grow=True):
    """Engraved sea: short curved strokes in rows, wrapping at the tile edge."""
    rnd = random.Random(seed)
    out = []
    for r in range(rows):
        y = y0 + (y1 - y0) * (r / max(1, rows - 1)) ** 1.2
        x = rnd.uniform(0, 30)
        while x < TILE:
            l = rnd.uniform(min_len, max_len) * (1 + r / rows * 0.6)
            dip = rnd.uniform(0.8, 2.2)
            for shift in (0, -TILE) if x + l > TILE else (0,):
                xa = x + shift
                out.append(poly(quad_pts((xa, y), (xa + l / 2, y - dip), (xa + l, y), 6), close=False))
            x += l + rnd.uniform(4, 22) / density
    return "".join(out)


def sea():
    back = wave_strokes(81, 4, 30, 6, 6, 18, 0.8)
    # distant headland across the back of the tile
    coast_pts = [(0, 0)]
    rnd = random.Random(82)
    x = 0
    while x < TILE:
        x += rnd.uniform(30, 70)
        coast_pts.append((min(x, TILE), -rnd.uniform(4, 16)))
    coast_pts[-1] = (TILE, 0)
    coast = poly(coast_pts, close=False)
    coast_hatch = hatch(coast_pts + [(TILE, 0)], angle=0, spacing=2.4, seed=83)
    # front water: crest line on top, strokes getting heavier toward the viewer
    crest = []
    for i in range(0, TILE, 50):
        crest += quad_pts((i, 8), (i + 25, 2), (i + 50, 8), 8)[(0 if i == 0 else 1):]
    crest_d = poly(crest, close=False)
    body = poly(crest + [(TILE, 90), (0, 90)])
    front = wave_strokes(84, 16, 84, 11, 10, 34, 1.1)
    return {"back": back, "coast": coast, "coastHatch": coast_hatch, "crest": crest_d, "body": body, "front": front}


def main():
    data = {
        "SMOKE": [billow(s) for s in (3, 7, 11, 19, 23)],
        "TUG": tug(),
        "BARGE": barge(),
        "LIGHTHOUSE": lighthouse(),
        "SEA": sea(),
    }
    lines = [
        "// Generated by scripts/generate-footer-art.py — do not edit by hand.",
        "// Engraving-style path data for the footer: re-run the script to change it.",
        "",
    ]
    import json

    for name, value in data.items():
        lines.append(f"export const {name} = {json.dumps(value)};")
        lines.append("")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join(lines))
    size = OUT.stat().st_size
    print(f"wrote {OUT.relative_to(OUT.parent.parent.parent)} ({size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
