#!/usr/bin/env python3
"""Square icon master on navy canvas; emit Expo/Android PNGs. Optional pngquant if installed."""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

from PIL import Image

NAVY = (12, 18, 36)


def square_on_navy(im: Image.Image) -> Image.Image:
    w, h = im.size
    side = max(w, h)
    out = Image.new("RGBA", (side, side), NAVY + (255,))
    ox = (side - w) // 2
    oy = (side - h) // 2
    src = im.convert("RGBA")
    out.paste(src, (ox, oy), src)
    return out


def resize(im: Image.Image, size: int) -> Image.Image:
    return im.resize((size, size), Image.Resampling.LANCZOS)


def solid_rgb(size: int, rgb: tuple[int, int, int]) -> Image.Image:
    return Image.new("RGB", (size, size), rgb)


def monochrome_white_teal(icon: Image.Image) -> Image.Image:
    """Android monochrome layer: only white and transparent (shape from non-navy content)."""
    im = icon.convert("RGBA")
    px = im.load()
    w, h = im.size
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    po = out.load()
    nr, ng, nb = NAVY
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 28:
                continue
            if abs(r - nr) < 22 and abs(g - ng) < 22 and abs(b - nb) < 28:
                continue
            po[x, y] = (255, 255, 255, min(255, a))
    return out


def try_pngquant(paths: list[Path]) -> None:
    for p in paths:
        if not p.exists():
            continue
        try:
            subprocess.run(
                ["pngquant", "--force", "--strip", "--output", str(p), "256", str(p)],
                check=True,
                capture_output=True,
            )
        except (FileNotFoundError, subprocess.CalledProcessError):
            pass


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("master", type=Path)
    ap.add_argument("out_dir", type=Path)
    args = ap.parse_args()
    out = args.out_dir
    out.mkdir(parents=True, exist_ok=True)

    master = Image.open(args.master).convert("RGBA")
    icon1024 = resize(square_on_navy(master), 1024)

    paths: list[Path] = []
    p_icon = out / "icon.png"
    icon1024.save(p_icon, "PNG", optimize=True)
    paths.append(p_icon)

    p_splash = out / "splash-icon.png"
    resize(icon1024, 512).save(p_splash, "PNG", optimize=True)
    paths.append(p_splash)

    p_fg = out / "android-icon-foreground.png"
    icon1024.save(p_fg, "PNG", optimize=True)
    paths.append(p_fg)

    p_bg = out / "android-icon-background.png"
    solid_rgb(1024, NAVY).save(p_bg, "PNG", optimize=True)
    paths.append(p_bg)

    p_mono = out / "android-icon-monochrome.png"
    monochrome_white_teal(icon1024).save(p_mono, "PNG", optimize=True)
    paths.append(p_mono)

    p_fav = out / "favicon.png"
    resize(icon1024, 48).convert("RGB").save(p_fav, "PNG", optimize=True)
    paths.append(p_fav)

    try_pngquant(paths)
    print("OK:", *[p.name for p in paths])
    return 0


if __name__ == "__main__":
    sys.exit(main())
