# -*- coding: utf-8 -*-
"""
Genera la presentación VibeMatch (16:9) con python-pptx.
Ejecutar:  py build_deck.py
Salida:    VibeMatch-Presentacion.pptx
"""
from __future__ import annotations

import os
import re
import sys
from typing import Iterable, Optional, Sequence

from lxml import etree
from PIL import Image
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_CONNECTOR, MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, MSO_AUTO_SIZE, PP_ALIGN
from pptx.oxml.ns import qn
from pptx.util import Inches, Pt

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

BASE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(BASE, "assets")

# ---------------------------------------------------------------- paleta
INK = RGBColor(0x07, 0x07, 0x0D)
SURFACE = RGBColor(0x10, 0x10, 0x1C)
SURFACE_2 = RGBColor(0x16, 0x16, 0x26)
TEXT = RGBColor(0xF4, 0xF4, 0xF8)
MUTED = RGBColor(0xA8, 0xAD, 0xC2)
DIM = RGBColor(0x7C, 0x81, 0x98)
BRAND = RGBColor(0x6D, 0x7E, 0xD3)
BRAND_SOFT = RGBColor(0x9F, 0xB3, 0xE8)
BRAND_STRONG = RGBColor(0x8F, 0xA7, 0xF8)
BRAND_DARK = RGBColor(0x36, 0x3D, 0x73)
TEAL = RGBColor(0x5E, 0xEA, 0xD4)
GREEN = RGBColor(0x6E, 0xE7, 0xB7)
CORAL = RGBColor(0xFB, 0x71, 0x85)
AMBER = RGBColor(0xFB, 0xBF, 0x24)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)

HEAD = "Segoe UI Semibold"
BODY = "Segoe UI"
MONO = "Consolas"

SW, SH = 13.333, 7.5
ML = 0.72
CW = SW - 2 * ML

TOTAL = 17


# ---------------------------------------------------------------- utilidades XML
def _solid_color_element(shape) -> Optional[etree._Element]:
    spPr = shape._element.spPr
    solid = spPr.find(qn("a:solidFill"))
    if solid is None:
        return None
    return solid.find(qn("a:srgbClr"))


def fill_alpha(shape, alpha_pct: float) -> None:
    """alpha_pct: 0 transparente, 100 opaco."""
    clr = _solid_color_element(shape)
    if clr is None:
        return
    for old in clr.findall(qn("a:alpha")):
        clr.remove(old)
    a = etree.SubElement(clr, qn("a:alpha"))
    a.set("val", str(int(alpha_pct * 1000)))


def line_alpha(shape, alpha_pct: float) -> None:
    ln = shape.line._get_or_add_ln()
    solid = ln.find(qn("a:solidFill"))
    if solid is None:
        return
    clr = solid.find(qn("a:srgbClr"))
    if clr is None:
        return
    for old in clr.findall(qn("a:alpha")):
        clr.remove(old)
    a = etree.SubElement(clr, qn("a:alpha"))
    a.set("val", str(int(alpha_pct * 1000)))


def set_tracking(run, points: float) -> None:
    rPr = run._r.get_or_add_rPr()
    rPr.set("spc", str(int(points * 100)))


# ---------------------------------------------------------------- primitivas
def bg(slide) -> None:
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = INK


def rect(
    slide,
    x,
    y,
    w,
    h,
    fill: Optional[RGBColor] = SURFACE,
    line: Optional[RGBColor] = None,
    line_w: float = 1.0,
    radius: float = 0.06,
    alpha: float = 100,
    line_alpha_pct: float = 100,
    shape_type=None,
):
    st = shape_type or (MSO_SHAPE.ROUNDED_RECTANGLE if radius else MSO_SHAPE.RECTANGLE)
    shp = slide.shapes.add_shape(st, Inches(x), Inches(y), Inches(w), Inches(h))
    shp.shadow.inherit = False
    if radius and st == MSO_SHAPE.ROUNDED_RECTANGLE:
        try:
            shp.adjustments[0] = radius
        except Exception:
            pass
    if fill is None:
        shp.fill.background()
    else:
        shp.fill.solid()
        shp.fill.fore_color.rgb = fill
        if alpha < 100:
            fill_alpha(shp, alpha)
    if line is None:
        shp.line.fill.background()
    else:
        shp.line.color.rgb = line
        shp.line.width = Pt(line_w)
        if line_alpha_pct < 100:
            line_alpha(shp, line_alpha_pct)
    shp.text_frame.text = ""
    return shp


def grad_rect(
    slide,
    x,
    y,
    w,
    h,
    c1: RGBColor,
    c2: RGBColor,
    angle: float = 45,
    line: Optional[RGBColor] = None,
    line_alpha_pct: float = 100,
    radius: float = 0.06,
):
    shp = rect(slide, x, y, w, h, fill=None, line=line, line_alpha_pct=line_alpha_pct, radius=radius)
    shp.fill.gradient()
    shp.fill.gradient_angle = angle
    stops = shp.fill.gradient_stops
    stops[0].color.rgb = c1
    stops[0].position = 0.0
    stops[1].color.rgb = c2
    stops[1].position = 1.0
    return shp


def line(slide, x1, y1, x2, y2, color=BRAND, width=1.0, alpha=100):
    cn = slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(x1), Inches(y1), Inches(x2), Inches(y2))
    cn.line.color.rgb = color
    cn.line.width = Pt(width)
    if alpha < 100:
        line_alpha(cn, alpha)
    return cn


TOKEN = re.compile(r"(\[\[.*?\]\]|\*\*.*?\*\*)")


def add_runs(p, text, size, color, bold, font, accent=BRAND_STRONG, italic=False, tracking=0.0):
    for part in TOKEN.split(text):
        if not part:
            continue
        run_color = color
        run_bold = bold
        if part.startswith("[[") and part.endswith("]]"):
            part = part[2:-2]
            run_color = accent
            run_bold = True
        elif part.startswith("**") and part.endswith("**"):
            part = part[2:-2]
            run_bold = True
        r = p.add_run()
        r.text = part
        f = r.font
        f.name = font
        f.size = Pt(size)
        f.bold = run_bold
        f.italic = italic
        f.color.rgb = run_color
        if tracking:
            set_tracking(r, tracking)


def txt(
    slide,
    x,
    y,
    w,
    h,
    text,
    size=14,
    color=TEXT,
    bold=False,
    font=BODY,
    align=PP_ALIGN.LEFT,
    anchor=MSO_ANCHOR.TOP,
    line_spacing=1.18,
    space_after=0,
    accent=BRAND_STRONG,
    tracking=0.0,
    margins=(0, 0, 0, 0),
    italic=False,
):
    box = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = box.text_frame
    tf.word_wrap = True
    tf.auto_size = MSO_AUTO_SIZE.NONE
    tf.vertical_anchor = anchor
    tf.margin_left, tf.margin_right, tf.margin_top, tf.margin_bottom = [Inches(v) for v in margins]
    paragraphs = str(text).split("\n")
    for i, chunk in enumerate(paragraphs):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        p.line_spacing = line_spacing
        p.space_before = Pt(0)
        p.space_after = Pt(space_after if i < len(paragraphs) - 1 else 0)
        add_runs(p, chunk, size, color, bold, font, accent=accent, italic=italic, tracking=tracking)
    return box


def pill(
    slide,
    x,
    y,
    w,
    h,
    text,
    fg=BRAND_SOFT,
    fill=BRAND,
    fill_alpha_pct=16,
    border=BRAND,
    border_alpha=32,
    size=9.5,
    bold=True,
    font=BODY,
    tracking=0.6,
):
    shp = rect(
        slide, x, y, w, h, fill=fill, line=border, line_w=0.9, radius=0.5,
        alpha=fill_alpha_pct, line_alpha_pct=border_alpha,
    )
    tf = shp.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = Inches(0.04)
    tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    p.line_spacing = 0.95
    add_runs(p, text, size, fg, bold, font, tracking=tracking)
    return shp


def bullets(
    slide,
    x,
    y,
    w,
    items: Sequence[str],
    size=12.5,
    color=MUTED,
    gap=0.42,
    dot_color=BRAND_SOFT,
    text_h=0.34,
    marker="dot",
    bold_lead=False,
):
    cy = y
    for item in items:
        if marker == "dot":
            rect(slide, x, cy + 0.09, 0.075, 0.075, fill=dot_color, line=None, radius=0.5)
            tx = x + 0.22
            tw = w - 0.22
        elif marker == "check":
            rect(slide, x, cy + 0.015, 0.23, 0.23, fill=GREEN, line=None, radius=0.5, alpha=14)
            txt(slide, x, cy + 0.005, 0.23, 0.24, "✓", size=8.5, color=GREEN, bold=True,
                align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
            tx = x + 0.36
            tw = w - 0.36
        else:
            rect(slide, x, cy + 0.015, 0.23, 0.23, fill=dot_color, line=None, radius=0.5, alpha=14)
            txt(slide, x, cy, 0.23, 0.26, marker, size=10, color=dot_color, bold=True,
                align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
            tx = x + 0.36
            tw = w - 0.36
        txt(slide, tx, cy, tw, text_h, item, size=size, color=color, bold=bold_lead, line_spacing=1.2)
        cy += gap


def picture(slide, name, x, y, w=None, h=None):
    path = os.path.join(ASSETS, name)
    if not os.path.exists(path):
        return None
    if w is not None and h is None:
        im = Image.open(path)
        h = w * im.height / im.width
    elif h is not None and w is None:
        im = Image.open(path)
        w = h * im.width / im.height
    return slide.shapes.add_picture(path, Inches(x), Inches(y), Inches(w), Inches(h))


def glow(slide, name, x, y, w, h):
    picture(slide, name, x, y, w, h)


def header(slide, eyebrow, title, subtitle=None, title_size=33, subtitle_w=10.4):
    txt(slide, ML, 0.5, 8.0, 0.25, eyebrow.upper(), size=9.5, color=BRAND_SOFT, bold=True,
        font=MONO, tracking=2.2)
    txt(slide, ML, 0.78, 10.4, 0.78, title, size=title_size, color=TEXT, bold=True, font=HEAD,
        line_spacing=1.0)
    if subtitle:
        txt(slide, ML, 1.58, subtitle_w, 0.55, subtitle, size=14.5, color=MUTED, line_spacing=1.3)
    picture(slide, "imagotipo-white.png", 11.55, 0.5, w=1.05)


def footer(slide, idx):
    line(slide, ML, 6.98, SW - ML, 6.98, color=WHITE, width=0.5, alpha=9)
    txt(slide, ML, 7.06, 7.5, 0.2, "VibeMatch · Colegio Superior del Maipo", size=8, color=DIM,
        font=MONO)
    txt(slide, SW - ML - 1.4, 7.06, 1.4, 0.2, f"{idx:02d} / {TOTAL}", size=8, color=DIM,
        font=MONO, align=PP_ALIGN.RIGHT)


def notes(slide, text: str):
    slide.notes_slide.notes_text_frame.text = text.strip()


def new_slide(prs, with_footer=True, idx=1):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    bg(slide)
    if with_footer:
        footer(slide, idx)
    return slide


# ---------------------------------------------------------------- diapositivas
def slide_cover(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    bg(s)
    picture(s, "grid.png", 0, 0, w=SW, h=SH)
    glow(s, "glow-brand.png", 7.4, -1.6, 8.2, 8.2)

    pill(s, ML, 0.72, 2.55, 0.34, "PROYECTO ESCOLAR · 2026", fg=BRAND_SOFT, size=8.6, tracking=1.4)
    picture(s, "logotipo-white.png", ML - 0.03, 1.32, w=5.9)

    txt(s, ML, 3.03, 6.0, 1.45, "Una tarjeta.\nTodo el colegio conectado.", size=34, color=TEXT,
        bold=True, font=HEAD, line_spacing=1.02)
    txt(s, ML, 4.62, 5.55, 1.05,
        "Identidad estudiantil, convivencia y gestión de aula en una sola plataforma phygital. "
        "Sin celular personal. Sin filas. Sin papeleo.",
        size=14, color=MUTED, line_spacing=1.35)
    for i, (label, w) in enumerate([("NFC", 0.78), ("WEB APP", 1.22), ("PWA", 0.86)]):
        pass
    x = ML
    for label, w in [("NFC", 0.8), ("WEB APP", 1.18), ("PWA", 0.82)]:
        pill(s, x, 5.86, w, 0.34, label, fg=TEXT, fill=WHITE, fill_alpha_pct=7, border=WHITE,
             border_alpha=16, size=8.4, tracking=1.2)
        x += w + 0.12

    txt(s, ML, 6.62, 6.2, 0.3, "Maximo Orellana  ·  Colegio Superior del Maipo  ·  Octubre 2026",
        size=9.5, color=DIM, font=MONO)

    # tarjeta
    glow(s, "glow-brand.png", 6.2, 2.4, 7.0, 7.0)
    picture(s, "tarjeta-hero.png", 6.25, 1.52, w=6.7)
    txt(s, 9.42, 6.42, 3.2, 0.55, "Prototipo físico + plataforma web", size=8.6, color=DIM,
        font=MONO, align=PP_ALIGN.RIGHT)

    notes(s, """
Abrir con energía: “VibeMatch nació como una app para conectar estudiantes por sus intereses.
Hoy quiero mostrarles una segunda capa: la misma tarjeta puede ordenar la asistencia, los permisos
y las anotaciones del colegio”. No leer la diapositiva; dejar que la imagen de la tarjeta haga el
trabajo. Aclarar que la tarjeta de la foto es un prototipo y que la app web ya funciona.
""")
    return s


def slide_problem(prs, idx):
    s = new_slide(prs, idx=idx)
    glow(s, "glow-brand.png", 9.0, 4.4, 6.0, 6.0)
    header(s, "El día escolar, hoy", "Tres tareas simples que consumen el día.",
           "La información está, pero repartida entre papeles, planillas y la memoria de cada persona.")

    cards = [
        ("01", "La lista interrumpe", "Se toma a mano, clase por clase. Son minutos que se restan a la enseñanza y datos que quedan dispersos.", AMBER),
        ("02", "El baño sin trazabilidad", "¿Quién salió? ¿A qué hora? ¿Volvió? Inspectoría depende de la memoria y de un cuaderno que se pierde.", CORAL),
        ("03", "Anotaciones que se pierden", "Lo positivo y lo negativo vive en lugares distintos. El apoderado se entera tarde y el historial no está claro.", BRAND_SOFT),
    ]
    x = ML
    for n, t, b, accent in cards:
        grad_rect(s, x, 2.28, 3.82, 3.18, SURFACE_2, SURFACE, angle=135, line=WHITE, line_alpha_pct=10)
        txt(s, x + 0.32, 2.52, 1.0, 0.55, n, size=30, color=accent, bold=True, font=MONO,
            line_spacing=0.95)
        txt(s, x + 0.32, 3.16, 3.18, 0.65, t, size=17.5, color=TEXT, bold=True, font=HEAD, line_spacing=1.08)
        txt(s, x + 0.32, 3.9, 3.18, 1.2, b, size=12.2, color=MUTED, line_spacing=1.32)
        rect(s, x + 0.32, 5.08, 0.52, 0.035, fill=accent, line=None, radius=0)
        x += 4.05

    band = rect(s, ML, 5.82, CW, 0.92, fill=AMBER, line=AMBER, line_w=0.8, radius=0.08, alpha=8,
                line_alpha_pct=18)
    rect(s, ML + 0.26, 6.12, 0.36, 0.32, fill=AMBER, line=None, radius=0.25, alpha=18)
    txt(s, ML + 0.26, 6.11, 0.36, 0.32, "!", size=13, color=AMBER, bold=True, align=PP_ALIGN.CENTER,
        anchor=MSO_ANCHOR.MIDDLE)
    txt(s, ML + 0.8, 5.99, 10.6, 0.58,
        "Y la solución no puede ser el celular: la **Ley 21.801** prohíbe los dispositivos personales "
        "durante la jornada escolar. La tarjeta queda fuera de esa prohibición.",
        size=12.2, color=TEXT, line_spacing=1.25)

    notes(s, """
Tres dolores cotidianos, no tres problemas abstractos. La lista corta la clase; el permiso del baño
se anota en cualquier parte; las anotaciones viven en cuadernos distintos. Cerrar con el marco legal:
la Ley 21.801, vigente desde el año escolar 2026, prohíbe el celular personal durante la jornada.
Eso descarta la típica solución “haz una app para el alumno” y abre la puerta a la tarjeta.
""")
    return s


def slide_statement(prs, idx):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    bg(s)
    picture(s, "grid.png", 0, 0, w=SW, h=SH)
    glow(s, "glow-brand.png", 7.2, -1.8, 9.0, 9.0)

    txt(s, ML, 0.78, 4.0, 0.3, "LA IDEA", size=9.5, color=BRAND_SOFT, bold=True, font=MONO, tracking=2.4)
    txt(s, ML, 1.45, 8.35, 2.9,
        "La tarjeta que ya identifica al estudiante puede [[ordenar todo su día.]]",
        size=38, color=TEXT, bold=True, font=HEAD, line_spacing=1.04)
    txt(s, ML, 4.2, 7.7, 0.95,
        "VibeMatch convierte una tarjeta NFC en la llave física de dos mundos: la vida social del "
        "estudiante y la gestión diaria del colegio.",
        size=15, color=MUTED, line_spacing=1.35)

    steps = [("Identidad", "La tarjeta abre tu registro"), ("Acción", "Lista, permiso o anotación"),
             ("Dato", "Hora, lugar y responsable")]
    x = ML
    for i, (t, b) in enumerate(steps):
        rect(s, x, 5.55, 0.16, 0.16, fill=BRAND_STRONG, line=None, radius=0.5)
        txt(s, x + 0.28, 5.46, 2.1, 0.3, t, size=11.5, color=TEXT, bold=True, font=HEAD)
        txt(s, x + 0.28, 5.77, 2.25, 0.45, b, size=9.8, color=DIM, line_spacing=1.2)
        if i < 2:
            line(s, x + 0.2, 5.63, x + 2.55, 5.63, color=BRAND, width=0.8, alpha=35)
        x += 2.62

    # sello
    for r, a in [(1.45, 22), (1.85, 16), (2.25, 11)]:
        ring = s.shapes.add_shape(MSO_SHAPE.OVAL, Inches(10.9 - r), Inches(3.72 - r), Inches(2 * r), Inches(2 * r))
        ring.fill.background()
        ring.line.color.rgb = BRAND
        ring.line.width = Pt(1)
        line_alpha(ring, a)
    picture(s, "isologotipo.png", 9.86, 2.45, w=2.05)
    txt(s, 9.65, 5.85, 2.5, 0.4, "Un gesto.\nCero pantallas personales.", size=9.2, color=DIM,
        font=MONO, align=PP_ALIGN.CENTER, line_spacing=1.35)

    notes(s, """
Esta es la frase que quiero que se lleven: la tarjeta no compite con la app social, la potencia.
El mismo gesto que abre un perfil puede abrir la lista del curso, un permiso al baño o una anotación.
Identidad → acción → dato. Esa es toda la arquitectura.
""")
    return s


def slide_how(prs, idx):
    s = new_slide(prs, idx=idx)
    header(s, "Cómo funciona", "Un gesto. Cuatro pasos.",
           "La tarjeta no necesita batería, pantalla ni una app instalada en el teléfono del estudiante.")
    line(s, ML + 0.28, 2.78, SW - ML - 0.35, 2.78, color=BRAND, width=1.2, alpha=28)
    steps = [
        ("01", "Acerca", "La tarjeta se aproxima al Punto Vibe o al lector USB del computador."),
        ("02", "Valida", "El sistema verifica el token único. La tarjeta no guarda nombre, RUT ni curso."),
        ("03", "Muestra", "Se abre el contexto correcto: perfil, curso, permiso o ficha del estudiante."),
        ("04", "Registra", "Hora, lugar y responsable quedan en el panel del colegio al instante."),
    ]
    x = ML
    for i, (n, t, b) in enumerate(steps):
        circ = rect(s, x, 2.46, 0.64, 0.64, fill=INK, line=BRAND, line_w=1.4, radius=0.5,
                    line_alpha_pct=55)
        txt(s, x, 2.46, 0.64, 0.64, n, size=12, color=BRAND_STRONG, bold=True, font=MONO,
            align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
        txt(s, x, 3.32, 2.6, 0.4, t, size=19, color=TEXT, bold=True, font=HEAD)
        txt(s, x, 3.78, 2.55, 1.25, b, size=12.2, color=MUTED, line_spacing=1.34)
        x += 3.0

    ch = rect(s, ML, 5.45, CW, 1.06, fill=WHITE, line=WHITE, line_w=0.8, radius=0.08, alpha=4,
              line_alpha_pct=10)
    txt(s, ML + 0.32, 5.62, 1.8, 0.24, "CANALES DE ACCESO", size=8.6, color=BRAND_SOFT, bold=True,
        font=MONO, tracking=1.6)
    txt(s, ML + 0.32, 5.9, 11.1, 0.4,
        "Punto Vibe (kiosco)     ·     PC con lector NFC     ·     PWA / tablet institucional     ·     QR de respaldo",
        size=11.5, color=TEXT, line_spacing=1.1)
    txt(s, SW - ML - 2.15, 5.62, 1.9, 0.25, "SIN CELULAR PERSONAL", size=8.2, color=GREEN, bold=True,
        font=MONO, align=PP_ALIGN.RIGHT, tracking=1.2)

    notes(s, """
Recorrer los cuatro pasos en menos de treinta segundos. Insistir en el paso 2: la tarjeta es una
llave, no un archivador. El token no lleva datos personales. Y en el paso 4: el valor está en que
el registro ocurre solo, sin que el docente tenga que abrir una planilla. Los canales importan:
kiosco, PC con lector, PWA o QR. El colegio no tiene que comprar un dispositivo por alumno.
""")
    return s


def slide_modules(prs, idx):
    s = new_slide(prs, idx=idx)
    glow(s, "glow-brand.png", 8.5, 3.8, 6.2, 6.2)
    header(s, "Una plataforma, dos capas", "Una tarjeta, dos experiencias.",
           "El estudiante ve su vida social. El colegio ve la operación diaria. La tarjeta es la misma; los permisos, no.")

    # panel social
    grad_rect(s, ML, 2.22, 5.84, 4.35, RGBColor(0x1B, 0x20, 0x3D), SURFACE, angle=135,
              line=BRAND, line_alpha_pct=30)
    pill(s, ML + 0.32, 2.46, 1.95, 0.3, "VIBEMATCH SOCIAL", fg=BRAND_SOFT, size=8.2, tracking=1.0)
    txt(s, ML + 0.32, 2.87, 4.9, 0.42, "Para el estudiante", size=20, color=TEXT, bold=True, font=HEAD)
    txt(s, ML + 0.32, 3.34, 5.05, 0.6, "Conecta por lo que te mueve, sin métricas vacías.",
        size=12.2, color=MUTED, line_spacing=1.3)
    bullets(s, ML + 0.32, 4.0, 5.15, [
        "Perfil con nombre preferido, pronombres y curso.",
        "Vibe Check del día: estudio, conversar, buscar equipo.",
        "Cuatro zonas: deportes, arte, videojuegos y estudio.",
        "Chat moderado por la comunidad escolar.",
    ], size=11.4, gap=0.42, text_h=0.36)
    pill(s, ML + 0.32, 5.86, 2.05, 0.3, "YA DISPONIBLE EN LA WEB", fg=GREEN, fill=GREEN,
         border=GREEN, size=7.8, tracking=0.8)

    # panel colegio
    grad_rect(s, 6.77, 2.22, 5.84, 4.35, RGBColor(0x10, 0x2B, 0x2B), SURFACE, angle=135,
              line=TEAL, line_alpha_pct=26)
    pill(s, 7.09, 2.46, 2.1, 0.3, "VIBEMATCH COLEGIO", fg=TEAL, fill=TEAL, border=TEAL,
         size=8.2, tracking=1.0)
    txt(s, 7.09, 2.87, 4.9, 0.42, "Para el establecimiento", size=20, color=TEXT, bold=True, font=HEAD)
    txt(s, 7.09, 3.34, 5.05, 0.6, "Menos planillas. Más tiempo para enseñar y acompañar.",
        size=12.2, color=MUTED, line_spacing=1.3)
    bullets(s, 7.09, 4.0, 5.15, [
        "Asistencia por curso, en vivo y sin interrumpir.",
        "Permisos al baño con hora, cupo y regreso.",
        "Anotaciones positivas y negativas con contexto.",
        "Panel por roles, alertas y reportes exportables.",
    ], size=11.4, gap=0.42, text_h=0.36, dot_color=TEAL)
    pill(s, 7.09, 5.86, 2.3, 0.3, "EXTENSIÓN · EN DESARROLLO", fg=AMBER, fill=AMBER,
         border=AMBER, size=7.8, tracking=0.8)

    txt(s, ML, 6.72, CW, 0.25,
        "Los mismos datos. Distintos permisos. Cada rol ve solo lo que necesita.",
        size=9.6, color=DIM, font=MONO, align=PP_ALIGN.CENTER)
    footer(s, idx)

    notes(s, """
Separar claramente las dos capas. La capa social ya existe: acceso por tarjeta, onboarding, perfil,
vibe check, zonas y PWA. La capa colegio es la extensión que estamos proponiendo: asistencia,
permisos, anotaciones y panel. La frase de cierre es clave para privacidad: el estudiante no ve
las anotaciones de otro, ni el panel de dirección. Todos usan la misma tarjeta, pero cada rol tiene
su propio nivel de acceso.
""")
    return s


# ---------------------------------------------------------------- mockups
def mock_window(s, x, y, w, h, title, right_pill=None, right_color=GREEN):
    rect(s, x + 0.08, y + 0.10, w, h, fill=RGBColor(0x00, 0x00, 0x00), line=None, radius=0.04, alpha=28)
    rect(s, x, y, w, h, fill=RGBColor(0x0B, 0x0B, 0x14), line=WHITE, line_w=1.0, radius=0.04,
         line_alpha_pct=13)
    rect(s, x, y, w, 0.46, fill=WHITE, line=None, radius=0.04, alpha=4)
    for i, col in enumerate([CORAL, AMBER, GREEN]):
        rect(s, x + 0.18 + i * 0.15, y + 0.17, 0.09, 0.09, fill=col, line=None, radius=0.5, alpha=70)
    txt(s, x + 0.66, y + 0.12, w - 1.9, 0.22, title, size=8.2, color=DIM, font=MONO, tracking=0.4)
    if right_pill:
        pill(s, x + w - 1.22, y + 0.09, 1.02, 0.26, right_pill, fg=right_color, fill=right_color,
             border=right_color, size=7.4, tracking=0.6)
    line(s, x, y + 0.46, x + w, y + 0.46, color=WHITE, width=0.6, alpha=10)
    return y + 0.46


def slide_attendance(prs, idx):
    s = new_slide(prs, idx=idx)
    header(s, "Módulo aula · concepto", "La lista se toma [[mientras entran]].",
           "Cada estudiante acerca su tarjeta al entrar. El curso se marca solo y el docente cierra la lista en segundos.")

    txt(s, ML, 2.3, 4.35, 1.5,
        "La asistencia deja de ser una interrupción al inicio de la clase y pasa a ser un registro "
        "continuo, visible para el profesor y para inspectoría.",
        size=13.2, color=MUTED, line_spacing=1.38)
    bullets(s, ML, 3.75, 4.3, [
        "Presente, atrasado o ausente sin escribir nombres.",
        "Funciona con profesor titular, reemplazo o inspectoría.",
        "Cierre en vivo y resumen exportable por curso.",
        "El estudiante no necesita sacar su celular.",
    ], size=11.5, gap=0.45, text_h=0.4, marker="check")
    pill(s, ML, 6.02, 2.85, 0.3, "CONCEPTO DE INTERFAZ · EN DESARROLLO", fg=AMBER, fill=AMBER,
         border=AMBER, size=7.4, tracking=0.7)

    x, y, w, h = 5.38, 2.08, 7.22, 4.62
    cy = mock_window(s, x, y, w, h, "PANEL VIBEMATCH  /  ASISTENCIA", "EN VIVO", GREEN)

    txt(s, x + 0.3, cy + 0.16, 3.6, 0.36, "1° Medio B  ·  Lenguaje", size=15.5, color=TEXT,
        bold=True, font=HEAD)
    txt(s, x + 0.3, cy + 0.52, 3.3, 0.22, "Martes 22 de octubre  ·  08:05", size=8.2, color=DIM, font=MONO)
    txt(s, x + w - 1.48, cy + 0.12, 1.18, 0.45, "28/30", size=21, color=BRAND_STRONG, bold=True,
        font=MONO, align=PP_ALIGN.RIGHT)
    txt(s, x + w - 1.48, cy + 0.56, 1.18, 0.2, "presentes", size=7.6, color=DIM, font=MONO,
        align=PP_ALIGN.RIGHT)
    line(s, x + 0.3, cy + 0.82, x + w - 0.3, cy + 0.82, color=WHITE, width=0.6, alpha=9)

    names = [
        ("CR", "Camila R.", "presente"), ("MS", "Matías S.", "presente"), ("JP", "Josefa P.", "presente"),
        ("BT", "Benjamín T.", "presente"), ("AL", "Antonia L.", "atrasado"), ("VM", "Vicente M.", "presente"),
        ("EC", "Emilia C.", "presente"), ("TV", "Tomás V.", "presente"), ("IF", "Isidora F.", "presente"),
        ("AH", "Agustín H.", "atrasado"), ("FD", "Florencia D.", "presente"), ("MA", "Martín A.", "ausente"),
    ]
    colmap = {"presente": (GREEN, "Presente"), "atrasado": (AMBER, "Atrasado"), "ausente": (CORAL, "Ausente")}
    gw = (w - 0.6 - 0.36) / 4
    for i, (ini, name, state) in enumerate(names):
        col, lab = colmap[state]
        cx = x + 0.3 + (i % 4) * (gw + 0.12)
        cyy = cy + 0.98 + (i // 4) * 0.92
        rect(s, cx, cyy, gw, 0.78, fill=WHITE, line=WHITE, line_w=0.7, radius=0.12, alpha=4,
             line_alpha_pct=8)
        rect(s, cx + 0.11, cyy + 0.19, 0.34, 0.34, fill=BRAND, line=None, radius=0.5, alpha=26)
        txt(s, cx + 0.11, cyy + 0.19, 0.34, 0.34, ini, size=7.4, color=BRAND_SOFT, bold=True,
            align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
        txt(s, cx + 0.52, cyy + 0.13, gw - 0.58, 0.22, name, size=8.2, color=TEXT, bold=True)
        rect(s, cx + 0.52, cyy + 0.44, 0.07, 0.07, fill=col, line=None, radius=0.5)
        txt(s, cx + 0.64, cyy + 0.39, gw - 0.7, 0.2, lab, size=7.1, color=col, font=MONO)

    by = y + h - 0.52
    rect(s, x + 0.3, by, 4.35, 0.08, fill=WHITE, line=None, radius=0.5, alpha=10)
    rect(s, x + 0.3, by, 4.35 * 0.93, 0.08, fill=GREEN, line=None, radius=0.5)
    txt(s, x + 0.3, by + 0.13, 4.4, 0.2, "28 presentes · 2 atrasados · 1 ausente", size=7.4, color=DIM,
        font=MONO)
    pill(s, x + w - 1.65, by - 0.02, 1.32, 0.3, "Cerrar lista  →", fg=INK, fill=GREEN,
         border=GREEN, size=7.6, tracking=0.4)
    txt(s, x + w - 2.4, by - 0.32, 1.9, 0.2, "vista parcial · 12 de 30", size=6.8, color=DIM,
        font=MONO, align=PP_ALIGN.RIGHT)

    notes(s, """
Explicar el flujo con un ejemplo: el curso entra, cada tarjeta marca presencia, el profesor ve
28 de 30 y puede cerrar la lista sin preguntar “¿quién falta?”. Aclarar que la pantalla es un
concepto: hoy está implementado el acceso por tarjeta y el perfil; la asistencia es la siguiente
capa. No prometer integración automática con SIGE todavía: se puede exportar y luego integrar.
""")
    return s


def slide_bathroom(prs, idx):
    s = new_slide(prs, idx=idx)
    header(s, "Módulo convivencia · concepto", "Permisos al baño con [[hora, cupo y regreso]].",
           "Salida y entrada con la misma tarjeta. Inspectoría ve quién está fuera, desde cuándo y si volvió.")

    x, y, w, h = ML, 2.08, 7.3, 4.6
    cy = mock_window(s, x, y, w, h, "PANEL VIBEMATCH  /  PERMISOS", "3 ACTIVOS", AMBER)
    txt(s, x + 0.3, cy + 0.16, 3.9, 0.35, "Baño · Patio central", size=15, color=TEXT, bold=True, font=HEAD)
    txt(s, x + 0.3, cy + 0.52, 3.3, 0.22, "Turno 10:30 – 11:00  ·  cupo 3", size=8.2, color=DIM, font=MONO)

    # gauge
    txt(s, x + w - 1.55, cy + 0.14, 1.25, 0.45, "2/3", size=21, color=AMBER, bold=True, font=MONO,
        align=PP_ALIGN.RIGHT)
    txt(s, x + w - 1.55, cy + 0.58, 1.25, 0.2, "cupos usados", size=7.4, color=DIM, font=MONO,
        align=PP_ALIGN.RIGHT)
    line(s, x + 0.3, cy + 0.84, x + w - 0.3, cy + 0.84, color=WHITE, width=0.6, alpha=9)

    rows = [
        ("JP", "Josefa P.", "1° Medio B", "Baño · Patio central", "10:42", "4:12", "En ruta", AMBER),
        ("MS", "Matías S.", "1° Medio A", "Baño · Biblioteca", "10:39", "7:05", "Excedido", CORAL),
        ("AL", "Antonia L.", "2° Medio C", "Enfermería", "10:45", "1:20", "Regresó", GREEN),
    ]
    for i, (ini, name, course, dest, out, elapsed, status, col) in enumerate(rows):
        ry = cy + 1.0 + i * 0.90
        rect(s, x + 0.3, ry, w - 0.6, 0.78, fill=WHITE, line=WHITE, line_w=0.7, radius=0.1,
             alpha=4, line_alpha_pct=8)
        rect(s, x + 0.43, ry + 0.21, 0.36, 0.36, fill=col, line=None, radius=0.5, alpha=18)
        txt(s, x + 0.43, ry + 0.21, 0.36, 0.36, ini, size=7.6, color=col, bold=True,
            align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
        txt(s, x + 0.9, ry + 0.12, 2.0, 0.22, name, size=8.8, color=TEXT, bold=True)
        txt(s, x + 0.9, ry + 0.38, 2.2, 0.2, f"{course}  ·  {dest}", size=7.2, color=DIM, font=MONO)
        txt(s, x + 3.55, ry + 0.15, 0.85, 0.22, out, size=10, color=TEXT, font=MONO)
        txt(s, x + 3.55, ry + 0.42, 1.2, 0.2, "salida", size=6.8, color=DIM, font=MONO)
        txt(s, x + 4.55, ry + 0.15, 0.85, 0.22, elapsed, size=10, color=col, font=MONO)
        txt(s, x + 4.55, ry + 0.42, 1.2, 0.2, "transcurrido", size=6.8, color=DIM, font=MONO)
        pill(s, x + w - 1.62, ry + 0.24, 1.18, 0.3, status, fg=col, fill=col, border=col, size=7.4)

    # timeline
    ty = y + h - 0.44
    line(s, x + 0.42, ty, x + w - 0.42, ty, color=WHITE, width=1.0, alpha=14)
    for i, hr in enumerate(["08:00", "10:00", "12:00"]):
        px = x + 0.42 + i * ((w - 0.84) / 2)
        rect(s, px - 0.035, ty - 0.035, 0.07, 0.07, fill=BRAND_SOFT, line=None, radius=0.5)
        txt(s, px - 0.3, ty + 0.12, 0.7, 0.2, hr, size=6.8, color=DIM, font=MONO,
            align=PP_ALIGN.CENTER)
    rect(s, x + 0.42 + 0.46 * (w - 0.84), ty - 0.045, 0.09, 0.09, fill=AMBER, line=None, radius=0.5)
    txt(s, x + 0.42 + 0.46 * (w - 0.84) + 0.14, ty - 0.085, 1.5, 0.2, "ahora · 6 min",
        size=6.6, color=AMBER, font=MONO)

    # texto derecha
    txt(s, 8.32, 2.28, 4.28, 1.35,
        "El permiso deja de ser una interrupción sin registro. La tarjeta marca la salida y el regreso, "
        "y el panel avisa cuando alguien se demora más de lo permitido.",
        size=13, color=MUTED, line_spacing=1.38)
    bullets(s, 8.32, 3.75, 4.25, [
        "Cupos por turno para evitar aglomeraciones.",
        "Alerta a inspectoría si se excede el tiempo.",
        "Historial por estudiante y por curso.",
        "El resto de los estudiantes no ve estos datos.",
    ], size=11.3, gap=0.45, text_h=0.4, dot_color=AMBER)
    pill(s, 8.32, 6.02, 2.85, 0.3, "CONCEPTO DE INTERFAZ · EN DESARROLLO", fg=AMBER, fill=AMBER,
         border=AMBER, size=7.4, tracking=0.7)

    notes(s, """
El caso del baño parece menor, pero es donde más se pierde trazabilidad y donde ocurren accidentes.
La tarjeta permite dos marcas: salida y regreso. Inspectoría ve el tiempo transcurrido y recibe una
alerta si alguien se pasa. Importante: el objetivo no es vigilar al estudiante, es saber dónde está
si hay una emergencia y ordenar los cupos. Los datos son solo para el personal autorizado.
""")
    return s


def slide_annotations(prs, idx):
    s = new_slide(prs, idx=idx)
    header(s, "Módulo convivencia · concepto", "La ficha del estudiante, [[por fin completa]].",
           "Una anotación toma segundos: tipo, categoría y contexto. Queda asociada al estudiante, al curso, a la hora y a quien la registró.")

    txt(s, ML, 2.3, 4.95, 0.85,
        "Lo positivo también se registra y se comunica. Dirección ve el patrón, no solo el hecho aislado.",
        size=12.8, color=MUTED, line_spacing=1.35)

    # tarjetas de categorías
    grad_rect(s, ML, 3.18, 4.95, 1.32, RGBColor(0x10, 0x2B, 0x22), SURFACE, angle=135,
              line=GREEN, line_alpha_pct=22)
    txt(s, ML + 0.24, 3.31, 0.34, 0.36, "+", size=16, color=GREEN, bold=True, font=MONO,
        line_spacing=1.0)
    txt(s, ML + 0.62, 3.3, 2.4, 0.28, "Positivas", size=13.2, color=GREEN, bold=True, font=HEAD)
    txt(s, ML + 0.62, 3.62, 3.95, 0.7, "Liderazgo, ayuda entre pares, esfuerzo, participación destacada.",
        size=10.4, color=MUTED, line_spacing=1.28)

    grad_rect(s, ML, 4.64, 4.95, 1.32, RGBColor(0x2B, 0x14, 0x1A), SURFACE, angle=135,
              line=CORAL, line_alpha_pct=22)
    txt(s, ML + 0.24, 4.77, 0.34, 0.36, "−", size=16, color=CORAL, bold=True, font=MONO,
        line_spacing=1.0)
    txt(s, ML + 0.62, 4.76, 2.4, 0.28, "Negativas", size=13.2, color=CORAL, bold=True, font=HEAD)
    txt(s, ML + 0.62, 5.08, 3.95, 0.7, "Convivencia, atrasos reiterados, incumplimientos del reglamento.",
        size=10.4, color=MUTED, line_spacing=1.28)

    txt(s, ML, 6.16, 4.95, 0.25, "REGISTRAR  →  NOTIFICAR  →  ACOMPAÑAR  →  REPORTAR", size=7.8,
        color=BRAND_SOFT, bold=True, font=MONO, tracking=0.7)

    # ficha mockup
    x, y, w, h = 5.95, 2.08, 6.66, 4.62
    cy = mock_window(s, x, y, w, h, "PANEL VIBEMATCH  /  FICHA DEL ESTUDIANTE", "1° MEDIO B", BRAND_SOFT)
    rect(s, x + 0.3, cy + 0.22, 0.62, 0.62, fill=BRAND, line=None, radius=0.28, alpha=28)
    txt(s, x + 0.3, cy + 0.22, 0.62, 0.62, "CR", size=11.5, color=BRAND_SOFT, bold=True,
        align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    txt(s, x + 1.08, cy + 0.22, 3.3, 0.3, "Camila Rojas", size=13.5, color=TEXT, bold=True, font=HEAD)
    txt(s, x + 1.08, cy + 0.53, 4.2, 0.22, "1° Medio B  ·  Tarjeta VM-G0042  ·  Perfil activo", size=7.6,
        color=DIM, font=MONO)
    pill(s, x + w - 1.55, cy + 0.3, 1.12, 0.28, "3 REGISTROS", fg=BRAND_SOFT, fill=BRAND,
         border=BRAND, size=7.2)
    line(s, x + 0.3, cy + 1.0, x + w - 0.3, cy + 1.0, color=WHITE, width=0.6, alpha=9)

    entries = [
        ("+", GREEN, "Ayudó a un compañero en el laboratorio", "Positiva · Colaboración",
         "10:18  ·  Prof. Rojas"),
        ("−", CORAL, "Llegó 12 minutos tarde a la primera hora", "Negativa · Atraso",
         "08:12  ·  Inspectoría"),
        ("+", GREEN, "Participación destacada en Lenguaje", "Positiva · Participación",
         "11:05  ·  Prof. Díaz"),
    ]
    for i, (sign, col, title, tag, meta) in enumerate(entries):
        ey = cy + 1.10 + i * 0.94
        rect(s, x + 0.3, ey, w - 0.6, 0.80, fill=col, line=col, line_w=0.7, radius=0.1,
             alpha=6, line_alpha_pct=14)
        txt(s, x + 0.42, ey + 0.16, 0.34, 0.34, sign, size=16, color=col, bold=True, font=MONO)
        txt(s, x + 0.84, ey + 0.12, 4.65, 0.25, title, size=9.6, color=TEXT, bold=True)
        txt(s, x + 0.84, ey + 0.42, 2.7, 0.2, tag, size=7.2, color=col, font=MONO)
        txt(s, x + w - 2.28, ey + 0.42, 1.82, 0.2, meta, size=7.0, color=DIM, font=MONO,
            align=PP_ALIGN.RIGHT)

    txt(s, x + 0.3, y + h - 0.32, w - 0.6, 0.2,
        "Vista de inspectoría y profesor jefe  ·  el estudiante ve su propio historial",
        size=6.9, color=DIM, font=MONO, align=PP_ALIGN.RIGHT)

    notes(s, """
Dos ideas: registrar rápido y comunicar a tiempo. El profesor elige si es positiva o negativa,
la categoría y agrega una frase. Se guarda quién y cuándo. El apoderado recibe el aviso el mismo
día, no semanas después. Y lo positivo tiene el mismo peso que lo negativo: no es solo un libro de
castigos. La ficha es un historial para acompañar, no una etiqueta permanente.
""")
    return s


def slide_dashboard(prs, idx):
    s = new_slide(prs, idx=idx)
    header(s, "Panel del colegio", "Todo el colegio en [[un solo tablero]].",
           "Dirección, inspectoría y profesores jefes trabajan sobre los mismos datos, con permisos por rol.")

    x, y, w, h = ML, 1.98, CW, 4.9
    rect(s, x + 0.08, y + 0.10, w, h, fill=RGBColor(0, 0, 0), line=None, radius=0.03, alpha=30)
    rect(s, x, y, w, h, fill=RGBColor(0x0B, 0x0B, 0x14), line=WHITE, line_w=1.0, radius=0.03,
         line_alpha_pct=13)
    # sidebar
    rect(s, x, y, 1.92, h, fill=WHITE, line=None, radius=0.03, alpha=4)
    picture(s, "isotipo-white.png", x + 0.22, y + 0.22, w=0.34)
    txt(s, x + 0.64, y + 0.28, 1.1, 0.22, "VIBEMATCH", size=7.8, color=TEXT, bold=True, font=MONO,
        tracking=0.8)
    nav = ["Resumen", "Asistencia", "Permisos", "Anotaciones", "Cursos", "Reportes"]
    for i, item in enumerate(nav):
        ny = y + 0.86 + i * 0.48
        if i == 0:
            rect(s, x + 0.16, ny - 0.06, 1.6, 0.36, fill=BRAND, line=None, radius=0.2, alpha=22)
        txt(s, x + 0.32, ny, 1.4, 0.22, item, size=8.3, color=TEXT if i == 0 else DIM,
            bold=(i == 0))
    txt(s, x + 0.22, y + h - 0.42, 1.5, 0.2, "●  Sistema activo", size=6.8, color=GREEN, font=MONO)

    # topbar
    mx = x + 2.12
    txt(s, mx, y + 0.24, 5.0, 0.3, "Resumen del día", size=14, color=TEXT, bold=True, font=HEAD)
    txt(s, mx, y + 0.56, 4.0, 0.2, "Martes 22 de octubre  ·  Colegio Superior del Maipo", size=7.6,
        color=DIM, font=MONO)
    pill(s, mx + 6.2, y + 0.3, 1.55, 0.3, "EXPORTAR REPORTE", fg=BRAND_SOFT, fill=BRAND,
         border=BRAND, size=6.8, tracking=0.5)

    # kpis
    kpis = [
        ("94%", "Asistencia general", GREEN, "+1,2 pts vs. ayer"),
        ("3", "Permisos activos", AMBER, "1 excedido"),
        ("7", "Anotaciones hoy", BRAND_SOFT, "5 positivas · 2 negativas"),
        ("2", "Alertas", CORAL, "Requieren revisión"),
    ]
    kw = (w - 2.12 - 0.6 - 0.36) / 4
    for i, (val, label, col, sub) in enumerate(kpis):
        kx = mx + i * (kw + 0.12)
        rect(s, kx, y + 0.96, kw, 1.05, fill=WHITE, line=WHITE, line_w=0.7, radius=0.08,
             alpha=4, line_alpha_pct=8)
        txt(s, kx + 0.16, y + 1.08, kw - 0.3, 0.42, val, size=22, color=col, bold=True, font=MONO)
        txt(s, kx + 0.16, y + 1.51, kw - 0.3, 0.2, label, size=7.6, color=TEXT, bold=True)
        txt(s, kx + 0.16, y + 1.74, kw - 0.3, 0.18, sub, size=6.5, color=DIM, font=MONO)

    # chart
    chx, chy, chw, chh = mx, y + 2.22, 6.55, 2.42
    rect(s, chx, chy, chw, chh, fill=WHITE, line=WHITE, line_w=0.7, radius=0.06, alpha=3,
         line_alpha_pct=7)
    txt(s, chx + 0.22, chy + 0.18, 3.6, 0.25, "Asistencia por curso", size=9.6, color=TEXT, bold=True)
    txt(s, chx + 0.22, chy + 0.44, 3.6, 0.2, "Promedio de la última semana", size=6.8, color=DIM,
        font=MONO)
    bars = [("7°A", 96), ("7°B", 91), ("8°A", 94), ("8°B", 88), ("1°A", 97), ("1°B", 93)]
    base = chy + chh - 0.48
    for i, (label, val) in enumerate(bars):
        bx = chx + 0.42 + i * ((chw - 0.7) / 6)
        bh = (val / 100) * 1.35
        rect(s, bx, base - bh, 0.44, bh, fill=BRAND, line=None, radius=0.12, alpha=65 if i != 4 else 100)
        txt(s, bx - 0.12, base + 0.1, 0.68, 0.2, label, size=6.8, color=DIM, font=MONO,
            align=PP_ALIGN.CENTER)
        txt(s, bx - 0.12, base - bh - 0.24, 0.68, 0.2, f"{val}%", size=6.8, color=TEXT, font=MONO,
            align=PP_ALIGN.CENTER)

    # alerts
    ax, ay, aw, ah = mx + 6.72, y + 2.22, w - 2.12 - 6.72 - 0.28, 2.42
    rect(s, ax, ay, aw, ah, fill=WHITE, line=WHITE, line_w=0.7, radius=0.06, alpha=3, line_alpha_pct=7)
    txt(s, ax + 0.2, ay + 0.18, 2.2, 0.25, "Alertas recientes", size=9.6, color=TEXT, bold=True,
        font=HEAD)
    alerts = [
        ("11:02", "Permiso excedido · 1° Medio B", "Matías S. lleva 7 min fuera.", CORAL),
        ("10:45", "3 atrasos en 2° Medio A", "Patrón repetido esta semana.", AMBER),
        ("09:58", "Anotación positiva · 8° A", "Trabajo colaborativo destacado.", GREEN),
    ]
    for i, (hr, title, body, col) in enumerate(alerts):
        ry = ay + 0.55 + i * 0.6
        rect(s, ax + 0.2, ry + 0.05, 0.06, 0.36, fill=col, line=None, radius=0.5)
        txt(s, ax + 0.38, ry, 0.5, 0.2, hr, size=6.4, color=DIM, font=MONO)
        txt(s, ax + 0.38, ry + 0.16, aw - 0.55, 0.2, title, size=7.4, color=TEXT, bold=True)
        txt(s, ax + 0.38, ry + 0.35, aw - 0.55, 0.2, body, size=6.5, color=DIM)

    txt(s, x, y + h + 0.12, w, 0.2,
        "Vista de dirección e inspectoría  ·  datos agregados  ·  los estudiantes no ven este panel",
        size=6.9, color=DIM, font=MONO, align=PP_ALIGN.RIGHT)

    notes(s, """
Este es el tablero que ve dirección o inspectoría. No es un panel para estudiantes. Muestra el pulso
del día: asistencia, permisos activos, anotaciones y alertas. La idea es pasar de “enterarse al final
del mes” a “resolver hoy”. Los reportes se exportan para el consejo de profesores o para la
superintendencia si hace falta. La vista por curso permite comparar sin exponer nombres.
""")
    return s


def slide_why_nfc(prs, idx):
    s = new_slide(prs, idx=idx)
    header(s, "Decisión de producto", "Por qué una tarjeta y no otra app.",
           "La Ley 21.801 cambia el punto de partida: durante la jornada, el celular personal no es una opción.")

    x, y, w = ML, 2.06, CW
    lw = 2.55
    colw = (w - lw) / 3
    heads = [("", SURFACE, TEXT), ("TARJETA NFC\nVIBEMATCH", BRAND, TEXT),
             ("APP EN EL CELULAR", SURFACE, MUTED), ("HUELLA / BIOMETRÍA", SURFACE, MUTED)]
    for i, (label, fill, fg) in enumerate(heads):
        cx = x if i == 0 else x + lw + (i - 1) * colw
        cwid = lw if i == 0 else colw
        if i == 1:
            grad_rect(s, cx + 0.03, y, cwid - 0.06, 0.74, BRAND, BRAND_DARK, angle=120)
            pill(s, cx + 0.03, y, cwid - 0.06, 0.74, label, fg=TEXT, fill=BRAND, border=BRAND,
                 size=8.6, tracking=0.8, fill_alpha_pct=100)
        else:
            rect(s, cx, y, cwid, 0.74, fill=WHITE, line=None, radius=0, alpha=3)
            txt(s, cx + 0.16, y, cwid - 0.3, 0.74, label, size=8.2, color=fg, bold=True, font=MONO,
                anchor=MSO_ANCHOR.MIDDLE, line_spacing=1.1, tracking=0.6)

    rows = [
        ("Ley 21.801", ("✓", GREEN, "Sin celular personal"), ("✕", CORAL, "Celular prohibido"),
         ("~", AMBER, "Requiere hardware fijo")),
        ("Velocidad", ("✓", GREEN, "Menos de 1 segundo"), ("~", AMBER, "Abrir y desbloquear"),
         ("~", AMBER, "2–5 segundos")),
        ("Batería y pantalla", ("✓", GREEN, "No necesita"), ("✕", CORAL, "Depende del equipo"),
         ("✓", GREEN, "No necesita")),
        ("Datos personales", ("✓", GREEN, "Token sin PII"), ("~", AMBER, "Cuenta y permisos"),
         ("✕", CORAL, "Huella biométrica")),
        ("Costo por estudiante", ("✓", GREEN, "Tarjeta reutilizada"), ("~", AMBER, "Equipo o plan"),
         ("✕", CORAL, "Lector dedicado")),
        ("Accesibilidad", ("✓", GREEN, "Un gesto"), ("~", AMBER, "Requiere alfabetización"),
         ("~", AMBER, "Requiere enrolamiento")),
    ]
    ry = y + 0.74
    rh = 0.56
    for i, (label, *vals) in enumerate(rows):
        if i % 2 == 0:
            rect(s, x, ry, w, rh, fill=WHITE, line=None, radius=0, alpha=2.5)
        txt(s, x + 0.16, ry, lw - 0.25, rh, label, size=9.4, color=TEXT, bold=True,
            anchor=MSO_ANCHOR.MIDDLE)
        for j, (mark, col, text) in enumerate(vals):
            cx = x + lw + j * colw
            if j == 0:
                rect(s, cx, ry, colw, rh, fill=BRAND, line=None, radius=0, alpha=6)
            txt(s, cx + 0.14, ry, 0.3, rh, mark, size=11, color=col, bold=True, font=MONO,
                anchor=MSO_ANCHOR.MIDDLE)
            txt(s, cx + 0.42, ry, colw - 0.52, rh, text, size=8.6, color=TEXT if j == 0 else MUTED,
                anchor=MSO_ANCHOR.MIDDLE, line_spacing=1.05)
        line(s, x, ry + rh, x + w, ry + rh, color=WHITE, width=0.5, alpha=7)
        ry += rh

    txt(s, ML, 6.38, CW, 0.4,
        "El **QR de respaldo** impreso en la tarjeta cubre lectores dañados o tarjetas sin NFC. "
        "La app en el celular sigue existiendo, pero solo como canal opcional fuera de la jornada.",
        size=9.6, color=MUTED, line_spacing=1.25)

    notes(s, """
No estamos en contra del celular: estamos leyendo la realidad legal y práctica del colegio. Una
tarjeta no se queda sin batería, no interrumpe con notificaciones y no obliga a pedir el teléfono
prestado. La comparación no es “NFC es mejor que una app” en abstracto; es mejor para este contexto
escolar. La huella también resuelve el acceso, pero es un dato biométrico sensible y requiere
enrolamiento. El QR queda como respaldo.
""")
    return s


def slide_privacy(prs, idx):
    s = new_slide(prs, idx=idx)
    glow(s, "glow-brand.png", 9.0, 3.8, 6.0, 6.0)
    header(s, "Privacidad y seguridad", "Datos mínimos. [[Control del colegio.]]",
           "La tarjeta es una llave, no un expediente. El colegio define qué se guarda, quién lo ve y por cuánto tiempo.")

    cards = [
        ("01", "Token, no identidad",
         "La tarjeta guarda un token de 256 bits. El servidor solo conserva su hash SHA-256, nunca el token en claro."),
        ("02", "Sesión con caducidad",
         "Cookie HttpOnly firmada con HMAC. Expira y se revoca al instante si la tarjeta se pierde o se reemplaza."),
        ("03", "Roles y trazabilidad",
         "Estudiante, docente, inspectoría y dirección ven solo lo que necesitan. Cada acción queda registrada."),
        ("04", "Marco legal",
         "Diseñado para la Ley 21.801 (sin celular personal) y la Ley 21.719 (protección de datos personales)."),
    ]
    for i, (n, t, b) in enumerate(cards):
        cx = ML + (i % 2) * 6.04
        cy = 2.12 + (i // 2) * 1.86
        rect(s, cx, cy, 5.85, 1.66, fill=WHITE, line=WHITE, line_w=0.8, radius=0.08, alpha=3.5,
             line_alpha_pct=9)
        txt(s, cx + 0.26, cy + 0.24, 0.5, 0.3, n, size=13, color=BRAND_STRONG, bold=True, font=MONO)
        txt(s, cx + 0.82, cy + 0.21, 4.7, 0.32, t, size=14.2, color=TEXT, bold=True, font=HEAD)
        txt(s, cx + 0.82, cy + 0.62, 4.65, 0.88, b, size=10.8, color=MUTED, line_spacing=1.32)

    band = rect(s, ML, 6.02, CW, 0.55, fill=BRAND, line=BRAND, line_w=0.8, radius=0.08, alpha=9,
                line_alpha_pct=18)
    txt(s, ML, 6.02, CW, 0.55, "“La tarjeta no dice quién eres: solo abre tu registro.”",
        size=13, color=BRAND_SOFT, bold=True, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
    txt(s, ML, 6.66, CW, 0.2, "Sin GPS, sin cámara y sin biometría.  ·  Retención y consentimiento se acuerdan con el colegio.",
        size=7.8, color=DIM, font=MONO, align=PP_ALIGN.CENTER)

    notes(s, """
Si alguien pregunta “¿esto no es vigilancia?”, esta diapositiva es la respuesta. No usamos GPS ni
cámara ni huella. La tarjeta solo prueba que la persona está frente al lector. Los datos personales
están en el servidor, no en la tarjeta, y cada rol ve una parte. El colegio es el responsable de los
datos; VibeMatch es el encargado del tratamiento. La retención y el consentimiento se definen con
el colegio y con los apoderados.
""")
    return s


def slide_impact(prs, idx):
    s = new_slide(prs, idx=idx)
    header(s, "Impacto esperado", "Menos interrupciones. [[Más clase.]]",
           "No se trata de agregar una herramienta más, sino de quitar tareas repetitivas del día escolar.")

    # antes
    grad_rect(s, ML, 2.18, 5.85, 2.28, RGBColor(0x1B, 0x16, 0x1B), SURFACE, angle=135,
              line=CORAL, line_alpha_pct=16)
    txt(s, ML + 0.3, 2.34, 3.0, 0.25, "HOY, SIN VIBEMATCH", size=8.4, color=CORAL, bold=True,
        font=MONO, tracking=1.2)
    bullets(s, ML + 0.3, 2.72, 5.2, [
        "Listas a mano que cortan el inicio de la clase.",
        "Permisos sin hora, sin cupo y sin responsable.",
        "Anotaciones repartidas en cuadernos y planillas.",
        "Apoderados que se enteran tarde o nunca.",
    ], size=10.8, gap=0.36, text_h=0.28, marker="—", dot_color=CORAL)

    # después
    grad_rect(s, 6.76, 2.18, 5.85, 2.28, RGBColor(0x0F, 0x2B, 0x24), SURFACE, angle=135,
              line=GREEN, line_alpha_pct=20)
    txt(s, 7.06, 2.34, 3.0, 0.25, "CON VIBEMATCH", size=8.4, color=GREEN, bold=True, font=MONO,
        tracking=1.2)
    bullets(s, 7.06, 2.72, 5.2, [
        "Lista en segundos, mientras los estudiantes entran.",
        "Cada permiso con hora de salida y de regreso.",
        "Un historial por estudiante, con contexto.",
        "Aviso al apoderado el mismo día.",
    ], size=10.8, gap=0.36, text_h=0.28, marker="✓", dot_color=GREEN)

    # métricas
    metrics = [
        ("~1,5 h", "por docente a la semana", "Tiempo que deja de gastarse en listas manuales."),
        ("100%", "de permisos con registro", "Quién, cuándo, cuánto y si regresó."),
        ("1", "historial por estudiante", "Lo positivo y lo negativo en un solo lugar."),
    ]
    mx = ML
    for i, (val, label, sub) in enumerate(metrics):
        rect(s, mx, 4.78, 3.82, 1.3, fill=WHITE, line=WHITE, line_w=0.8, radius=0.08, alpha=3.5,
             line_alpha_pct=9)
        txt(s, mx + 0.26, 4.94, 1.8, 0.5, val, size=25, color=BRAND_STRONG, bold=True, font=MONO,
            line_spacing=0.95)
        txt(s, mx + 0.26, 5.45, 3.25, 0.2, label, size=8.6, color=TEXT, bold=True, font=MONO)
        txt(s, mx + 0.26, 5.68, 3.25, 0.24, sub, size=7.6, color=DIM)
        mx += 4.03

    txt(s, ML, 6.32, CW, 0.32,
        "Estimación: 6 clases al día × 3 minutos por lista × 5 días. El piloto medirá el tiempo real y ajustará el cálculo.",
        size=8.2, color=DIM, font=MONO)

    notes(s, """
No inventar cifras: decir explícitamente que 1,5 horas es una estimación con supuestos y que el
piloto la va a medir. Lo que sí es seguro es el cambio cualitativo: la lista deja de cortar la clase,
el permiso deja de ser un papel suelto y el apoderado recibe información el mismo día. Ese es el
impacto que importa.
""")
    return s


def slide_pilot(prs, idx):
    s = new_slide(prs, idx=idx)
    header(s, "Plan de implementación", "Piloto en 6 semanas, [[con un solo curso.]]",
           "Empezar pequeño permite medir, corregir y convencer con evidencia antes de escalar al colegio completo.")

    line(s, ML + 0.5, 2.78, SW - ML - 1.6, 2.78, color=BRAND, width=1.0, alpha=25)
    phases = [
        ("SEMANA 1", "Diagnóstico", "Reunión con dirección e inspectoría, definición del curso y de las reglas de uso."),
        ("SEMANA 2", "Tarjetas + asistencia", "Entrega de tarjetas, Punto Vibe y activación de la lista en vivo."),
        ("SEMANA 3", "Baño + anotaciones", "Permisos con cupo y registro; anotaciones positivas y negativas."),
        ("SEMANAS 4–6", "Uso real y medición", "Operación diaria, ajustes de interfaz y reporte de resultados."),
    ]
    x = ML
    for i, (week, title, body) in enumerate(phases):
        dot = rect(s, x + 0.22, 2.62, 0.3, 0.3, fill=INK, line=BRAND_STRONG, line_w=1.6, radius=0.5)
        rect(s, x + 0.29, 2.69, 0.16, 0.16, fill=BRAND_STRONG, line=None, radius=0.5)
        txt(s, x, 3.06, 2.75, 0.22, week, size=8, color=BRAND_SOFT, bold=True, font=MONO, tracking=1.0)
        txt(s, x, 3.34, 2.7, 0.28, title, size=14.2, color=TEXT, bold=True, font=HEAD)
        txt(s, x, 3.68, 2.7, 0.9, body, size=9.8, color=MUTED, line_spacing=1.3)
        x += 3.0

    # aportes
    aportes = [
        ("EL COLEGIO APORTA", GREEN, [
            "Un curso y un docente coordinador.",
            "PC o tablet institucional + lector NFC.",
            "Validación con inspectoría y convivencia.",
        ]),
        ("VIBEMATCH APORTA", BRAND_SOFT, [
            "Tarjetas y configuración del curso.",
            "Punto Vibe, panel web y soporte.",
            "Capacitación y reporte del piloto.",
        ]),
    ]
    for i, (title, col, items) in enumerate(aportes):
        bx = ML + i * 6.04
        rect(s, bx, 4.88, 5.85, 1.6, fill=WHITE, line=WHITE, line_w=0.8, radius=0.08, alpha=3.5,
             line_alpha_pct=9)
        txt(s, bx + 0.28, 5.02, 4.8, 0.22, title, size=8.2, color=col, bold=True, font=MONO, tracking=1.2)
        bullets(s, bx + 0.28, 5.34, 5.3, items, size=9.4, gap=0.32, text_h=0.26, marker="·",
                dot_color=col)

    txt(s, ML, 6.62, CW, 0.22,
        "Métricas: tiempo de lista, permisos registrados, anotaciones, adopción docente, incidencias y satisfacción.",
        size=8.4, color=DIM, font=MONO)

    notes(s, """
El piloto no es “probemos todo el colegio”. Es un curso, seis semanas y métricas claras. La primera
semana no se instala nada: se conversa con dirección, inspectoría y el profesor. La segunda se prueba
la asistencia; la tercera, baño y anotaciones. Las últimas tres semanas son uso real. Al final se
entrega un reporte con tiempos, uso y satisfacción. Si funciona, se escala; si no, se corrige.
""")
    return s


def slide_kit(prs, idx):
    s = new_slide(prs, idx=idx)
    header(s, "Qué recibe el colegio", "Un kit listo para [[usar mañana.]]",
           "No es solo software: incluye tarjetas, punto de acceso, capacitación y acompañamiento.")

    items = [
        ("01", "Tarjetas NFC", "Reutilizadas, sanitizadas y programadas para cada estudiante."),
        ("02", "Punto Vibe", "Lector + software en un PC o tablet institucional, en modo kiosco."),
        ("03", "Panel del colegio", "Asistencia, permisos, anotaciones y reportes por rol."),
        ("04", "Capacitación", "Una sesión para docentes, inspectoría y dirección."),
        ("05", "Soporte", "Reposición de tarjetas y acompañamiento durante el piloto."),
    ]
    y = 2.18
    for i, (n, t, b) in enumerate(items):
        rect(s, ML, y, 6.15, 0.78, fill=WHITE, line=WHITE, line_w=0.7, radius=0.1, alpha=3.5,
             line_alpha_pct=8)
        txt(s, ML + 0.22, y + 0.2, 0.45, 0.3, n, size=11.5, color=BRAND_STRONG, bold=True, font=MONO)
        txt(s, ML + 0.72, y + 0.11, 1.8, 0.28, t, size=11.8, color=TEXT, bold=True, font=HEAD)
        txt(s, ML + 2.55, y + 0.14, 3.35, 0.55, b, size=8.9, color=MUTED, line_spacing=1.22)
        y += 0.87

    picture(s, "tarjeta-hero.png", 7.02, 2.06, w=5.55)
    txt(s, 7.36, 5.52, 4.9, 0.2, "PHYGITAL PACK  ·  TARJETA + QR DE RESPALDO", size=7.6,
        color=BRAND_SOFT, bold=True, font=MONO, tracking=0.6)

    steps = [("Recolectar", "Tarjetas tipo Bip! en desuso"), ("Reprogramar", "Sanitizar y grabar token"),
             ("Reutilizar", "Menos desecho electrónico")]
    x = 7.16
    for i, (t, b) in enumerate(steps):
        rect(s, x, 5.9, 0.12, 0.12, fill=GREEN, line=None, radius=0.5)
        txt(s, x + 0.2, 5.82, 1.55, 0.22, t, size=8.2, color=TEXT, bold=True)
        txt(s, x + 0.2, 6.05, 1.5, 0.38, b, size=6.6, color=DIM, line_spacing=1.15)
        x += 1.62

    txt(s, 7.16, 6.55, 5.3, 0.22, "Packaging kraft, sin plásticos de un solo uso. Economía circular.",
        size=7.4, color=DIM, font=MONO)

    notes(s, """
El kit baja la barrera de entrada: el colegio no tiene que diseñar nada. Recibe tarjetas programadas,
un punto de acceso, el panel y capacitación. La tarjeta se reutiliza: recuperamos tarjetas tipo Bip!
en desuso, las sanitizamos y las reprogramamos. Eso conecta con el ADN de economía circular del
proyecto y además reduce el costo por estudiante.
""")
    return s


def slide_status(prs, idx):
    s = new_slide(prs, idx=idx)
    header(s, "Estado del proyecto", "No partimos de cero.",
           "La base web y el acceso por tarjeta ya funcionan. La extensión escolar se construye sobre esa base.")

    cols = [
        ("HOY · MVP FUNCIONANDO", GREEN, [
            "Web con acceso por tarjeta única.",
            "Onboarding y perfil persistente.",
            "100 tarjetas guest listas para el piloto.",
            "PWA instalable en iPhone, Android y Windows.",
            "Identidad de marca aplicada.",
        ]),
        ("DESPUÉS DEL PILOTO", BRAND_SOFT, [
            "Asistencia y lista en vivo por curso.",
            "Permisos al baño con alertas.",
            "Anotaciones + / − y notificaciones.",
            "Panel por roles y reportes exportables.",
            "Integración con SIGE y apps nativas.",
        ]),
    ]
    for i, (title, col, items) in enumerate(cols):
        bx = ML + i * 6.04
        rect(s, bx, 2.12, 5.85, 3.45, fill=WHITE, line=WHITE, line_w=0.8, radius=0.08, alpha=3.5,
             line_alpha_pct=9)
        txt(s, bx + 0.3, 2.3, 4.9, 0.22, title, size=8.6, color=col, bold=True, font=MONO, tracking=1.2)
        yy = 2.72
        for j, item in enumerate(items):
            if i == 0:
                rect(s, bx + 0.3, yy + 0.02, 0.22, 0.22, fill=GREEN, line=None, radius=0.5, alpha=14)
                txt(s, bx + 0.3, yy - 0.01, 0.22, 0.24, "✓", size=8, color=GREEN, bold=True,
                    align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
            else:
                txt(s, bx + 0.3, yy - 0.02, 0.22, 0.24, "→", size=9, color=BRAND_SOFT, bold=True,
                    align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)
            txt(s, bx + 0.64, yy, 4.85, 0.27, item, size=10.5, color=MUTED)
            yy += 0.54

    # progreso
    py = 6.08
    txt(s, ML, 5.85, 4.0, 0.2, "CAMINO DE IMPLEMENTACIÓN", size=7.6, color=DIM, bold=True,
        font=MONO, tracking=1.2)
    line(s, ML + 0.2, py, SW - ML - 0.2, py, color=WHITE, width=1.0, alpha=12)
    line(s, ML + 0.2, py, ML + 4.05, py, color=BRAND, width=2.0)
    for i, (label, sub, at) in enumerate([
        ("MVP", "funcionando", ML + 0.2), ("PILOTO", "2026", ML + 4.05), ("COLEGIO", "escala", SW - ML - 0.35)
    ]):
        rect(s, at - 0.07, py - 0.07, 0.14, 0.14, fill=BRAND if i < 2 else INK, line=BRAND,
             line_w=1.4, radius=0.5)
        txt(s, at - 0.55, py + 0.16, 1.1, 0.2, label, size=7.6, color=TEXT, bold=True, font=MONO,
            align=PP_ALIGN.CENTER)
        txt(s, at - 0.55, py + 0.36, 1.1, 0.2, sub, size=6.8, color=DIM, font=MONO,
            align=PP_ALIGN.CENTER)

    notes(s, """
Esta diapositiva da credibilidad: no es una idea en una servilleta. Ya existe la web con tarjeta,
el onboarding, los perfiles y la PWA. Lo que estamos proponiendo es la siguiente capa. Decir con
honestidad qué está implementado y qué es prototipo. Si el jurado pregunta “¿esto ya funciona?”,
la respuesta es: la base sí; la gestión escolar es el piloto que queremos hacer con el colegio.
""")
    return s


def slide_closing(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    bg(s)
    picture(s, "grid.png", 0, 0, w=SW, h=SH)
    glow(s, "glow-brand.png", 7.0, -1.2, 8.8, 8.8)

    txt(s, ML, 0.8, 4.0, 0.25, "EL PRÓXIMO PASO", size=9.4, color=BRAND_SOFT, bold=True, font=MONO,
        tracking=2.2)
    txt(s, ML, 1.45, 7.9, 2.4, "Que la tarjeta abra algo más que una puerta.",
        size=36, color=TEXT, bold=True, font=HEAD, line_spacing=1.04)
    txt(s, ML, 4.05, 7.1, 0.8,
        "Que abra la asistencia, el permiso, la anotación y la conversación. Todo con un gesto, "
        "sin celular personal y con el colegio a cargo.",
        size=14.2, color=MUTED, line_spacing=1.35)
    x = ML
    for label, w in [("SIN CELULAR PERSONAL", 1.9), ("CON TRAZABILIDAD", 1.75), ("CON EL COLEGIO A CARGO", 2.2)]:
        pill(s, x, 5.18, w, 0.32, label, fg=TEXT, fill=WHITE, border=WHITE, fill_alpha_pct=7,
             border_alpha=16, size=7.4, tracking=0.8)
        x += w + 0.12

    txt(s, ML, 6.25, 6.4, 0.3, "Maximo Orellana", size=12.5, color=TEXT, bold=True, font=HEAD)
    txt(s, ML, 6.56, 6.6, 0.5, "Colegio Superior del Maipo  ·  Piloto VibeMatch 2026\nProyecto disponible para revisión del colegio",
        size=8.8, color=DIM, font=MONO, line_spacing=1.35)

    for r, a in [(1.5, 20), (1.95, 14), (2.4, 9)]:
        ring = s.shapes.add_shape(MSO_SHAPE.OVAL, Inches(10.75 - r), Inches(3.9 - r), Inches(2 * r), Inches(2 * r))
        ring.fill.background()
        ring.line.color.rgb = BRAND
        ring.line.width = Pt(1)
        line_alpha(ring, a)
    picture(s, "isologotipo.png", 9.68, 2.58, w=2.15)
    txt(s, 9.45, 6.02, 2.65, 0.4, "VIBE·MATCH\nBrand Identity 2026", size=8.4, color=DIM, font=MONO,
        align=PP_ALIGN.CENTER, line_spacing=1.35)

    notes(s, """
Cerrar sin resumir todo otra vez. Una sola idea: la tarjeta puede ser la llave del día escolar.
Invitar a un piloto con un curso y ofrecer una reunión con dirección e inspectoría. Si hay preguntas,
pasar al anexo. Agradecer y dejar un silencio breve antes de abrir el turno de preguntas.
""")
    return s


def slide_faq(prs, idx):
    s = new_slide(prs, idx=idx)
    header(s, "Anexo · preguntas frecuentes", "Lo que van a preguntar.",
           "Respuestas cortas para el cierre. El detalle técnico está en la documentación del proyecto.")

    qa = [
        ("¿Y si se pierde la tarjeta?",
         "Se revoca al instante y se emite un reemplazo. La tarjeta no contiene nombre, RUT ni curso: solo un token."),
        ("¿Reemplaza al profesor?",
         "No. Automatiza el registro; la decisión pedagógica y disciplinaria sigue siendo del equipo escolar."),
        ("¿Funciona sin internet?",
         "El Punto Vibe puede operar en la red local del colegio. El modo offline se valida durante el piloto."),
        ("¿Es obligatorio para el estudiante?",
         "No. Convive con el registro manual y se activa con consentimiento, reglamento interno y autorización del colegio."),
    ]
    for i, (q, a) in enumerate(qa):
        cx = ML + (i % 2) * 6.04
        cy = 2.12 + (i // 2) * 1.9
        rect(s, cx, cy, 5.85, 1.7, fill=WHITE, line=WHITE, line_w=0.8, radius=0.08, alpha=3.5,
             line_alpha_pct=9)
        txt(s, cx + 0.28, cy + 0.22, 0.35, 0.3, "?", size=15, color=BRAND_STRONG, bold=True, font=MONO)
        txt(s, cx + 0.68, cy + 0.2, 4.85, 0.32, q, size=12.2, color=TEXT, bold=True, font=HEAD)
        txt(s, cx + 0.68, cy + 0.62, 4.85, 0.9, a, size=9.8, color=MUTED, line_spacing=1.32)

    txt(s, ML, 6.28, CW, 0.25,
        "También: ¿cuánto cuesta?, ¿quién administra las tarjetas?, ¿qué datos se comparten con apoderados?",
        size=8.2, color=DIM, font=MONO)
    txt(s, ML, 6.58, CW, 0.25,
        "Documentación: docs/producto.md  ·  docs/arquitectura/acceso-y-dispositivos.md  ·  docs/plan-apps.md",
        size=7.6, color=BRAND_SOFT, font=MONO)

    notes(s, """
Usar esta diapositiva solo si hay preguntas. Responder en una frase y ofrecer profundizar después.
No entrar en tecnicismos de token o servidor salvo que los pregunten. Si preguntan por costos, decir
que el piloto se cotiza según cursos y cantidad de tarjetas, y que el modelo busca ser accesible
reutilizando tarjetas.
""")
    return s


# ---------------------------------------------------------------- QA de texto
def check_text_fit(prs):
    from PIL import ImageFont

    font_paths = {
        ("Segoe UI", False): r"C:\Windows\Fonts\segoeui.ttf",
        ("Segoe UI", True): r"C:\Windows\Fonts\segoeuib.ttf",
        ("Segoe UI Semibold", False): r"C:\Windows\Fonts\seguisb.ttf",
        ("Segoe UI Semibold", True): r"C:\Windows\Fonts\seguisb.ttf",
        ("Consolas", False): r"C:\Windows\Fonts\consola.ttf",
        ("Consolas", True): r"C:\Windows\Fonts\consolab.ttf",
    }
    cache = {}
    warnings = []
    for si, slide in enumerate(prs.slides, 1):
        for shp in slide.shapes:
            if not shp.has_text_frame:
                continue
            text = shp.text_frame.text.strip()
            if not text:
                continue
            box_w_pt = (shp.width / 914400) * 72
            box_h_pt = (shp.height / 914400) * 72
            box_w_pt -= (shp.text_frame.margin_left + shp.text_frame.margin_right) / 914400 * 72
            needed = 0.0
            for p in shp.text_frame.paragraphs:
                sizes = [r.font.size.pt for r in p.runs if r.font.size]
                size = max(sizes) if sizes else 14
                bold = any(bool(r.font.bold) for r in p.runs)
                font_name = next((r.font.name for r in p.runs if r.font.name), "Segoe UI")
                key = (font_name, bold)
                path = font_paths.get(key, font_paths[("Segoe UI", bold)])
                if key not in cache:
                    cache[key] = ImageFont.truetype(path, 100)
                f = cache[key]
                # ancho real de la linea en puntos (fuente a 100 px -> escala)
                words = p.text.split(" ")
                lines = 1
                cur = ""
                for word in words:
                    test = (cur + " " + word).strip()
                    width_units = f.getlength(test)
                    # 100 px ~ 75 pt
                    width_pt = width_units * 0.75 * (size / 100)
                    if width_pt > box_w_pt and cur:
                        lines += 1
                        cur = word
                    else:
                        cur = test
                ls = p.line_spacing if isinstance(p.line_spacing, float) else 1.2
                needed += lines * size * 1.2 * ls
                if p.space_after:
                    needed += p.space_after.pt
            if needed > box_h_pt + 1.5:
                warnings.append((si, round(needed, 1), round(box_h_pt, 1), text[:58].replace("\n", " ")))
    if warnings:
        print("\nPosibles desbordes de texto:")
        for w in warnings:
            print(f"  slide {w[0]:02d}: necesita {w[1]} pt, caja {w[2]} pt -> {w[3]}")
    else:
        print("Sin desbordes de texto detectados.")


def main():
    prs = Presentation()
    prs.slide_width = Inches(SW)
    prs.slide_height = Inches(SH)
    prs.core_properties.title = "VibeMatch · Una tarjeta, todo el colegio conectado"
    prs.core_properties.author = "Maximo Orellana"
    prs.core_properties.subject = "Presentación del servicio VibeMatch y su extensión de gestión escolar con NFC"
    prs.core_properties.comments = "Generado para el Colegio Superior del Maipo · 2026"

    slide_cover(prs)
    slide_problem(prs, 2)
    slide_statement(prs, 3)
    slide_how(prs, 4)
    slide_modules(prs, 5)
    slide_attendance(prs, 6)
    slide_bathroom(prs, 7)
    slide_annotations(prs, 8)
    slide_dashboard(prs, 9)
    slide_why_nfc(prs, 10)
    slide_privacy(prs, 11)
    slide_impact(prs, 12)
    slide_pilot(prs, 13)
    slide_kit(prs, 14)
    slide_status(prs, 15)
    slide_closing(prs)
    slide_faq(prs, 17)

    out = os.path.join(BASE, "VibeMatch-Presentacion.pptx")
    prs.save(out)
    print(f"OK: {out}")
    print(f"Diapositivas: {len(prs.slides)}")
    check_text_fit(prs)


if __name__ == "__main__":
    main()
