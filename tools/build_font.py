"""
Notaste Display: a custom headline face built from the logo's letterforms.
Cap height 100 units (screen coords, y down), built as unions of simple pieces.
Output: TrueType/WOFF with overlapping contours (OVERLAP_SIMPLE set).
"""
import sys
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.reverseContourPen import ReverseContourPen
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.svgLib.path import parse_path

S = 20   # stem
B = 17   # bar
R = 12   # outer corner radius


def rr(x0, y0, x1, y1, tl=0, tr=0, br=0, bl=0):
    """Clockwise (screen) rectangle with optional rounded corners."""
    p = [f"M{x0 + tl} {y0}", f"H{x1 - tr}"]
    if tr: p.append(f"A{tr} {tr} 0 0 1 {x1} {y0 + tr}")
    p.append(f"V{y1 - br}")
    if br: p.append(f"A{br} {br} 0 0 1 {x1 - br} {y1}")
    p.append(f"H{x0 + bl}")
    if bl: p.append(f"A{bl} {bl} 0 0 1 {x0} {y1 - bl}")
    p.append(f"V{y0 + tl}")
    if tl: p.append(f"A{tl} {tl} 0 0 1 {x0 + tl} {y0}")
    p.append("Z")
    return "".join(p)


def rr_hole(x0, y0, x1, y1, r):
    """Counter-clockwise rounded rect, punches a counter."""
    return (f"M{x0 + r} {y0}A{r} {r} 0 0 0 {x0} {y0 + r}V{y1 - r}A{r} {r} 0 0 0 {x0 + r} {y1}"
            f"H{x1 - r}A{r} {r} 0 0 0 {x1} {y1 - r}V{y0 + r}A{r} {r} 0 0 0 {x1 - r} {y0}Z")


def poly(*pts):
    return "M" + "L".join(f"{x} {y}" for x, y in pts) + "Z"


def poly_hole(*pts):
    return poly(*reversed(pts))


def s_glyph(w=48, Rr=12, r=4, mid0=42, mid1=58, term_top=30, term_bot=70):
    s, b = S, B
    return (f"M{Rr} 0H{w-Rr}A{Rr} {Rr} 0 0 1 {w} {Rr}V{term_top}H{w-s}V{b}H{s+r}"
            f"A{r} {r} 0 0 0 {s} {b+r}V{mid0}H{w-Rr}A{Rr} {Rr} 0 0 1 {w} {mid0+Rr}"
            f"V{100-Rr}A{Rr} {Rr} 0 0 1 {w-Rr} 100H{Rr}A{Rr} {Rr} 0 0 1 0 {100-Rr}"
            f"V{term_bot}H{s}V{100-b}H{w-s-r}A{r} {r} 0 0 0 {w-s} {100-b-r}"
            f"V{mid1}H{Rr}A{Rr} {Rr} 0 0 1 0 {mid1-Rr}V{Rr}A{Rr} {Rr} 0 0 1 {Rr} 0Z")


def tick(x=1):
    return poly((x, 0), (x + 20, 0), (x + 17, 36), (x + 3, 36))


G = {}  # char -> (width, [paths])

G["A"] = (60, [poly((14, 0), (46, 0), (60, 100), (39, 100), (37, 80), (23, 80), (21, 100), (0, 100)),
               poly_hole((27.5, 23), (32.5, 23), (35, 62), (25, 62))])
G["B"] = (54, [rr(0, 0, S, 100), rr(10, 0, 32, B), rr(30, 0, 50, 58, tr=R, br=R),
               rr(10, 42, 36, 58), rr(34, 42, 54, 100, tr=R, br=R), rr(10, 83, 38, 100)])
G["C"] = (50, [rr(0, 0, S, 100, tl=R, bl=R), rr(10, 0, 38, B), rr(30, 0, 50, 34, tr=R),
               rr(10, 83, 38, 100), rr(30, 66, 50, 100, br=R)])
G["D"] = (52, [rr(0, 0, S, 100), rr(10, 0, 36, B), rr(32, 0, 52, 100, tr=R + 4, br=R + 4), rr(10, 83, 36, 100)])
G["E"] = (44, [rr(0, 0, S, 100), rr(0, 0, 44, B), rr(0, 42, 40, 58), rr(0, 100 - B, 44, 100)])
G["F"] = (44, [rr(0, 0, S, 100), rr(0, 0, 44, B), rr(0, 42, 40, 58)])
G["G"] = (50, [rr(0, 0, S, 100, tl=R, bl=R), rr(10, 0, 38, B), rr(30, 0, 50, 32, tr=R),
               rr(10, 83, 38, 100), rr(30, 44, 50, 100, br=R), rr(25, 44, 50, 60)])
G["H"] = (50, [rr(0, 0, S, 100), rr(30, 0, 50, 100), rr(10, 42, 40, 58)])
G["I"] = (22, [rr(1, 0, 21, 100)])
G["J"] = (44, [rr(24, 0, 44, 100, br=R), rr(10, 83, 34, 100), rr(0, 62, 20, 100, bl=R)])
G["K"] = (54, [rr(0, 0, S, 100), poly((32, 0), (54, 0), (34, 60), (12, 60)), poly((14, 42), (36, 42), (54, 100), (32, 100))])
G["L"] = (42, [rr(0, 0, S, 100), rr(0, 100 - B, 42, 100)])
G["M"] = (68, [rr(0, 0, S, 100), rr(48, 0, 68, 100),
               poly((0, 0), (21, 0), (34, 56), (47, 0), (68, 0), (44, 80), (24, 80))])
G["N"] = (58, [rr(0, 0, S, 100), rr(58 - S, 0, 58, 100), poly((0, 0), (S + 3, 0), (58, 100), (58 - S - 3, 100))])
G["O"] = (52, [rr(0, 0, 52, 100, 14, 14, 14, 14), rr_hole(S, B + 3, 52 - S, 100 - B - 3, 6)])
G["P"] = (52, [rr(0, 0, S, 100), rr(10, 0, 34, B), rr(32, 0, 52, 62, tr=R, br=R), rr(10, 45, 34, 62)])
G["Q"] = (54, [rr(0, 0, 52, 100, 14, 14, 14, 14), rr_hole(S, B + 3, 52 - S, 100 - B - 3, 6),
               poly((26, 66), (44, 62), (56, 100), (38, 104))])
G["R"] = (54, [rr(0, 0, S, 100), rr(10, 0, 34, B), rr(32, 0, 52, 60, tr=R, br=R), rr(10, 44, 34, 60),
               poly((26, 52), (46, 52), (54, 100), (33, 100))])
G["S"] = (48, [s_glyph()])
G["T"] = (50, [rr(0, 0, 50, B + 1), rr(15, 0, 35, 100)])
G["U"] = (50, [rr(0, 0, S, 100, bl=R), rr(30, 0, 50, 100, br=R), rr(10, 83, 40, 100)])
G["V"] = (56, [poly((0, 0), (20, 0), (28, 62), (36, 0), (56, 0), (39, 100), (17, 100))])
G["W"] = (76, [poly((0, 0), (18, 0), (23, 58), (29, 0), (47, 0), (53, 58), (58, 0), (76, 0), (66, 100),
                    (47, 100), (38, 46), (29, 100), (10, 100))])
G["X"] = (56, [poly((0, 0), (21, 0), (56, 100), (35, 100)), poly((35, 0), (56, 0), (21, 100), (0, 100))])
G["Y"] = (56, [poly((0, 0), (21, 0), (28, 36), (35, 0), (56, 0), (38, 62), (18, 62)), rr(18, 50, 38, 100)])
G["Z"] = (46, [rr(0, 0, 46, B), rr(0, 100 - B, 46, 100), poly((25, 12), (46, 12), (21, 88), (0, 88))])

G["0"] = (50, [rr(0, 0, 50, 100, 14, 14, 14, 14), rr_hole(S, B + 3, 50 - S, 100 - B - 3, 5)])
G["1"] = (36, [rr(16, 0, 36, 100), poly((0, 14), (22, 0), (36, 0), (36, 20), (0, 32))])
G["2"] = (48, [rr(0, 0, 38, B, tl=R), rr(0, 0, S, 30, tl=R), rr(28, 0, 48, 50, tr=R, br=R),
               poly((30, 36), (48, 44), (21, 88), (0, 86)), rr(0, 83, 48, 100)])
G["3"] = (48, [rr(0, 0, 38, B), rr(28, 0, 48, 56, tr=R, br=R), rr(28, 44, 48, 100, tr=R, br=R),
               rr(12, 42, 38, 58), rr(0, 83, 38, 100)])
G["4"] = (52, [rr(0, 0, S, 72), rr(30, 0, 50, 100), rr(0, 56, 52, 72)])
G["5"] = (48, [rr(0, 0, 48, B), rr(0, 0, S, 56), rr(0, 40, 36, 56), rr(28, 40, 48, 100, tr=R, br=R),
               rr(10, 83, 36, 100), rr(0, 70, S, 100, bl=R)])
G["6"] = (48, [rr(0, 0, S, 100, tl=R, bl=R), rr(10, 0, 38, B), rr(28, 0, 48, 28, tr=R),
               rr(10, 42, 38, 58), rr(28, 42, 48, 100, tr=R, br=R), rr(10, 83, 38, 100)])
G["7"] = (46, [rr(0, 0, 46, B), poly((26, 8), (46, 8), (27, 100), (6, 100))])
G["8"] = (50, [rr(0, 0, S, 58, tl=R, bl=R), rr(30, 0, 50, 58, tr=R, br=R), rr(0, 42, S, 100, tl=R, bl=R),
               rr(30, 42, 50, 100, tr=R, br=R), rr(10, 0, 40, B), rr(10, 42, 40, 58), rr(10, 83, 40, 100)])
G["9"] = (48, [rr(28, 0, 48, 100, tr=R, br=R), rr(10, 0, 38, B), rr(0, 0, S, 58, tl=R, bl=R),
               rr(10, 42, 38, 58), rr(10, 83, 38, 100), rr(0, 72, S, 100, bl=R)])

G["."] = (22, [rr(1, 80, 21, 100)])
G[","] = (22, [rr(1, 80, 21, 100), poly((8, 99), (21, 99), (12, 120), (2, 120))])
G[":"] = (22, [rr(1, 28, 21, 48), rr(1, 80, 21, 100)])
G[";"] = (22, [rr(1, 28, 21, 48), rr(1, 80, 21, 100), poly((8, 99), (21, 99), (12, 120), (2, 120))])
G["'"] = (22, [tick()])
G["’"] = G["'"]
G["‘"] = (22, [poly((4, 0), (18, 0), (21, 36), (1, 36))])
G['"'] = (44, [tick(), tick(23)])
G["“"] = (44, [poly((4, 0), (18, 0), (21, 36), (1, 36)), poly((27, 0), (41, 0), (44, 36), (24, 36))])
G["”"] = G['"']
G["!"] = (22, [poly((1, 0), (21, 0), (18, 70), (4, 70)), rr(1, 80, 21, 100)])
G["?"] = (46, [rr(0, 0, 36, B, tl=R), rr(0, 0, S, 26, tl=R), rr(26, 0, 46, 52, tr=R, br=R),
               rr(13, 36, 36, 52), rr(13, 40, 33, 68), rr(13, 80, 33, 100)])
G["-"] = (34, [rr(2, 42, 32, 58)])
G["–"] = (52, [rr(2, 42, 50, 58)])
G["/"] = (40, [poly((24, 0), (40, 0), (16, 100), (0, 100))])
G["("] = (28, [rr(4, -4, 24, 104, tl=R, bl=R), rr(14, -4, 28, 12), rr(14, 88, 28, 104)])
G[")"] = (28, [rr(4, -4, 24, 104, tr=R, br=R), rr(0, -4, 14, 12), rr(0, 88, 14, 104)])
G["+"] = (48, [rr(14, 26, 34, 74), rr(2, 42, 46, 58)])
G["#"] = (56, [poly((14, 6), (30, 6), (24, 94), (8, 94)), poly((32, 6), (48, 6), (42, 94), (26, 94)),
               rr(2, 26, 56, 40), rr(0, 60, 54, 74)])
G["%"] = (62, [rr(0, 0, 24, 44, 8, 8, 8, 8), rr_hole(9, 12, 15, 32, 3), rr(38, 56, 62, 100, 8, 8, 8, 8),
               rr_hole(47, 68, 53, 88, 3), poly((42, 0), (58, 0), (20, 100), (4, 100))])
G["&"] = (60, [rr(4, 0, 22, 46, tl=R, bl=R), rr(30, 0, 46, 36, tr=R, br=R), rr(14, 0, 38, B),
               poly((12, 30), (32, 30), (60, 100), (38, 100)), rr(0, 48, 20, 100, tl=R, bl=R),
               rr(10, 83, 38, 100), rr(34, 52, 54, 74)])
G["*"] = (44, [rr(14, 0, 30, 40), poly((0, 10), (8, 0), (44, 28), (36, 38)), poly((36, 0), (44, 10), (8, 38), (0, 28))])
G["@"] = (66, [rr(0, 0, 66, 100, 16, 16, 16, 16), rr_hole(12, 12, 54, 88, 10), rr(20, 30, 46, 72, 6, 6, 6, 6),
               rr_hole(30, 42, 36, 60, 2), rr(42, 30, 54, 80), rr(40, 68, 66, 80)])
G["£"] = (48, [rr(8, 0, S + 8, 100, tl=R), rr(14, 0, 46, B, tr=6), rr(0, 42, 38, 58), rr(0, 83, 48, 100)])
G["…"] = (64, [rr(1, 80, 21, 100), rr(22, 80, 42, 100), rr(43, 80, 63, 100)])

SIDE = 4          # side bearing in design units
SCALE = 7         # 100 design units -> 700 font units cap height
UPM = 1000


def build(out_base):
    order = [".notdef", "space"]
    cmap = {32: "space", 160: "space"}
    advances = {".notdef": (300, 0), "space": (260, 0)}   # a wide enough space that small words do not run together
    glyphs = {}

    def draw(paths):
        tt = TTGlyphPen(None)
        # screen coords (y down) -> font coords (y up, baseline 0, cap 700)
        t = TransformPen(ReverseContourPen(Cu2QuPen(tt, max_err=0.6, reverse_direction=False)),
                         (SCALE, 0, 0, -SCALE, SIDE * SCALE, 100 * SCALE))
        for d in paths:
            parse_path(d, t)
        g = tt.glyph()
        if g.numberOfContours > 0:
            g.flags[0] |= 0x40  # OVERLAP_SIMPLE
        return g

    empty = TTGlyphPen(None).glyph()
    glyphs[".notdef"] = draw([rr(0, 0, 36, 100), rr_hole(8, 8, 28, 92, 0)])
    advances[".notdef"] = ((36 + 2 * SIDE) * SCALE, SIDE * SCALE)
    glyphs["space"] = empty

    seen = {}
    for ch, (w, paths) in G.items():
        key = id(G[ch])
        name = seen.get(key)
        if name is None:
            name = f"uni{ord(ch):04X}"
            seen[key] = name
            order.append(name)
            glyphs[name] = draw(paths)
            advances[name] = ((w + 2 * SIDE) * SCALE, SIDE * SCALE)
        cmap[ord(ch)] = name
        if ch.isalpha() and ch.isupper():
            cmap[ord(ch.lower())] = name

    fb = FontBuilder(UPM, isTTF=True)
    fb.setupGlyphOrder(order)
    fb.setupCharacterMap(cmap)
    fb.setupGlyf(glyphs)
    metrics = {}
    for n in order:
        adv, _ = advances[n]
        g = glyphs[n]
        g.recalcBounds(fb.font["glyf"])
        lsb = getattr(g, "xMin", 0) if g.numberOfContours else 0
        metrics[n] = (adv, lsb)
    fb.setupHorizontalMetrics(metrics)
    fb.setupHorizontalHeader(ascent=800, descent=-200)
    fb.setupNameTable({"familyName": "Notaste Display", "styleName": "Regular",
                       "uniqueFontIdentifier": "Notaste Display Regular 1.0",
                       "fullName": "Notaste Display", "psName": "NotasteDisplay-Regular",
                       "version": "Version 1.000",
                       "copyright": "Copyright 2026 Notaste Games"})
    fb.setupOS2(sTypoAscender=800, sTypoDescender=-200, sTypoLineGap=0,
                usWinAscent=880, usWinDescent=220, sCapHeight=700, sxHeight=700,
                fsSelection=0x40, version=4, usWeightClass=400, achVendID="NTST")
    fb.setupPost()
    fb.font.save(out_base + ".ttf")
    fb.font.flavor = "woff"
    fb.font.save(out_base + ".woff")
    print("glyphs", len(order))


if __name__ == "__main__":
    build(sys.argv[1])
