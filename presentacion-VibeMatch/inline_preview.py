# -*- coding: utf-8 -*-
"""Crea una versión de un solo archivo (imágenes embebidas) para presentar sin servidor."""
from __future__ import annotations

import base64
import os
import re

BASE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(BASE, "preview.html")
OUT = os.path.join(BASE, "VibeMatch-Presentacion.html")

MIME = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif"}


def inline() -> None:
    with open(SRC, encoding="utf-8") as fh:
        doc = fh.read()

    count = 0

    def repl(match: re.Match) -> str:
        nonlocal count
        rel = match.group(1)
        path = os.path.join(BASE, rel.replace("/", os.sep))
        if not os.path.isfile(path):
            return match.group(0)
        ext = os.path.splitext(path)[1].lower()
        mime = MIME.get(ext, "application/octet-stream")
        with open(path, "rb") as fh:
            data = base64.b64encode(fh.read()).decode("ascii")
        count += 1
        return f'src="data:{mime};base64,{data}"'

    doc = re.sub(r'src="(preview_assets/[^"]+)"', repl, doc)
    doc = doc.replace("<title>VibeMatch · Vista previa de la presentación</title>", "<title>VibeMatch · Presentación</title>")

    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write(doc)
    print(f"OK: {OUT} | imágenes embebidas: {count} | {os.path.getsize(OUT)/1048576:.2f} MB")


if __name__ == "__main__":
    inline()
