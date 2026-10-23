# -*- coding: utf-8 -*-
"""Genera los assets gráficos de la presentación VibeMatch (glow, grilla y tarjeta)."""
from __future__ import annotations

import math
import os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

BASE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(BASE, "assets")
os.makedirs(ASSETS, exist_ok=True)

BRAND = (109, 126, 211)
BRAND_DARK = (47, 54, 102)
BRAND_LIGHT = (159, 179, 232)


def radial_glow(size: int, color: tuple[int, int, int], max_alpha: int, power: float = 2.2) -> Image.Image:
    small = 640
    img = Image.new("RGBA", (small, small), (0, 0, 0, 0))
    px = img.load()
    c = (small - 1) / 2
    for y in range(small):
        for x in range(small):
            d = math.hypot(x - c, y - c) / c
            if d >= 1:
                continue
            a = int(max_alpha * (1 - d) ** power)
            if a:
                px[x, y] = (color[0], color[1], color[2], a)
    return img.resize((size, size), Image.LANCZOS)


def grid_overlay(w: int = 1600, h: int = 900, step: int = 80, alpha: int = 8) -> Image.Image:
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for x in range(0, w, step):
        d.line([(x, 0), (x, h)], fill=(255, 255, 255, alpha), width=1)
    for y in range(0, h, step):
        d.line([(0, y), (w, y)], fill=(255, 255, 255, alpha), width=1)
    return img


def rounded_mask(size: tuple[int, int], radius: int) -> Image.Image:
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, size[0] - 1, size[1] - 1], radius=radius, fill=255)
    return mask


def vertical_gradient(w: int, h: int, top: tuple[int, int, int], bottom: tuple[int, int, int]) -> Image.Image:
    img = Image.new("RGBA", (w, h))
    d = ImageDraw.Draw(img)
    for y in range(h):
        t = y / max(1, h - 1)
        # curva suave para que el cambio no sea lineal plano
        t = t ** 0.82
        c = tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3))
        d.line([(0, y), (w, y)], fill=c + (255,))
    return img


def make_card() -> None:
    W, H = 1800, 1200
    cw, ch = 1480, 920
    x0, y0 = (W - cw) // 2, (H - ch) // 2 - 20
    radius = 72

    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))

    # sombra difusa
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle(
        [x0 + 10, y0 + 40, x0 + cw + 10, y0 + ch + 40], radius=radius, fill=(0, 0, 0, 150)
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(38))
    canvas.alpha_composite(shadow)

    # tarjeta con gradiente
    card = vertical_gradient(cw, ch, (143, 167, 248), (43, 49, 96))
    # brillo diagonal
    sheen = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    sd = ImageDraw.Draw(sheen)
    for i in range(-ch, cw, 8):
        sd.line([(i, ch), (i + ch, 0)], fill=(255, 255, 255, 7), width=6)
    card.alpha_composite(sheen)
    # halo superior
    halo = radial_glow(1500, (255, 255, 255), 55, 2.6)
    halo = halo.crop((0, 0, 1500, 1500)).resize((cw, cw), Image.LANCZOS)
    card.alpha_composite(halo, (0, -int(cw * 0.55)))

    # textura diagonal sutil
    texture = Image.new("RGBA", (cw, ch), (0, 0, 0, 0))
    td = ImageDraw.Draw(texture)
    for i in range(0, cw + ch, 46):
        td.line([(i, ch), (i - ch, 0)], fill=(255, 255, 255, 10), width=2)
    card.alpha_composite(texture)

    mask = rounded_mask((cw, ch), radius)
    card.putalpha(mask)
    canvas.alpha_composite(card, (x0, y0))

    draw = ImageDraw.Draw(canvas)

    # borde
    draw.rounded_rectangle(
        [x0, y0, x0 + cw, y0 + ch], radius=radius, outline=(255, 255, 255, 110), width=4
    )

    # chip
    chip_x, chip_y, chip_w, chip_h = x0 + 110, y0 + 495, 150, 112
    chip = Image.new("RGBA", (chip_w, chip_h), (0, 0, 0, 0))
    cd = ImageDraw.Draw(chip)
    cd.rounded_rectangle([0, 0, chip_w - 1, chip_h - 1], radius=16, fill=(226, 199, 133, 255))
    cd.rounded_rectangle([0, 0, chip_w - 1, chip_h - 1], radius=16, outline=(255, 240, 200, 180), width=2)
    for i in range(1, 4):
        cd.line([(chip_w * i / 4, 8), (chip_w * i / 4, chip_h - 8)], fill=(140, 110, 55, 220), width=3)
    cd.line([(10, chip_h / 2), (chip_w - 10, chip_h / 2)], fill=(140, 110, 55, 220), width=3)
    canvas.alpha_composite(chip, (chip_x, chip_y))

    # ondas NFC
    for r in (58, 96, 134):
        draw.arc(
            [chip_x + chip_w + 38 - r, chip_y + chip_h // 2 - r,
             chip_x + chip_w + 38 + r, chip_y + chip_h // 2 + r],
            start=-58, end=58, fill=(255, 255, 255, 150), width=7,
        )

    # logo blanco
    logo_path = os.path.join(ASSETS, "logotipo-white.png")
    iso_path = os.path.join(ASSETS, "isotipo-white.png")
    if os.path.exists(logo_path):
        logo = Image.open(logo_path).convert("RGBA")
        lw = 600
        logo = logo.resize((lw, int(logo.height * lw / logo.width)), Image.LANCZOS)
        canvas.alpha_composite(logo, (x0 + 110, y0 + 105))

    if os.path.exists(iso_path):
        iso = Image.open(iso_path).convert("RGBA")
        ih = 250
        iso = iso.resize((int(iso.width * ih / iso.height), ih), Image.LANCZOS)
        canvas.alpha_composite(iso, (x0 + cw - iso.width - 105, y0 + ch - iso.height - 105))

    # textos
    try:
        semibold = ImageFont.truetype(r"C:\Windows\Fonts\seguisb.ttf", 30)
        mono = ImageFont.truetype(r"C:\Windows\Fonts\consola.ttf", 27)
    except OSError:
        semibold = mono = ImageFont.load_default()

    draw.text((x0 + 112, y0 + 300), "TARJETA ESCOLAR", font=semibold, fill=(255, 255, 255, 205))
    draw.text((x0 + 112, y0 + 722), "VM · 2026", font=mono, fill=(255, 255, 255, 200))
    draw.text((x0 + 112, y0 + 768), "NFC + QR", font=mono, fill=(255, 255, 255, 150))

    out = os.path.join(ASSETS, "tarjeta-hero.png")
    canvas.save(out)
    print("tarjeta:", out, canvas.size)


if __name__ == "__main__":
    radial_glow(1400, BRAND, 95, 2.2).save(os.path.join(ASSETS, "glow-brand.png"))
    radial_glow(1400, (94, 234, 212), 55, 2.4).save(os.path.join(ASSETS, "glow-teal.png"))
    grid_overlay().save(os.path.join(ASSETS, "grid.png"))
    make_card()
    print("assets listos")
