#!/usr/bin/env python3
"""Generate a homepage mockup PNG for the openElement redesign proposal."""
from PIL import Image, ImageDraw, ImageFont
import os

WIDTH = 1440
HEIGHT = 1900

# Palette
BG_BASE = (11, 12, 15)
BG_SURFACE = (19, 21, 26)
BG_ELEVATED = (26, 29, 36)
BG_CODE = (13, 14, 18)
BG_HOVER = (255, 255, 255, 10)
TEXT_PRIMARY = (242, 243, 245)
TEXT_SECONDARY = (156, 163, 175)
TEXT_MUTED = (107, 114, 128)
BRAND = (99, 102, 241)
BRAND_HOVER = (129, 140, 248)
BORDER = (255, 255, 255, 20)
BORDER_STRONG = (255, 255, 255, 36)
ACCENTS = {
    "Elements": (34, 211, 238),
    "UI": (167, 139, 250),
    "Framework": (52, 211, 153),
    "Protocols": (251, 191, 36),
}

FONT_SANS = "C:/Windows/Fonts/segoeui.ttf"
FONT_SANS_BOLD = "C:/Windows/Fonts/segoeuib.ttf"
FONT_MONO = "C:/Windows/Fonts/consola.ttf"
FONT_CN = "C:/Windows/Fonts/msyh.ttc"
FONT_CN_BOLD = "C:/Windows/Fonts/msyhbd.ttc"


def load_fonts():
    fonts = {}
    try:
        fonts["display"] = ImageFont.truetype(FONT_CN_BOLD, 68)
        fonts["title"] = ImageFont.truetype(FONT_CN_BOLD, 44)
        fonts["h2"] = ImageFont.truetype(FONT_CN_BOLD, 34)
        fonts["h3"] = ImageFont.truetype(FONT_CN_BOLD, 22)
        fonts["body"] = ImageFont.truetype(FONT_CN, 20)
        fonts["body-sm"] = ImageFont.truetype(FONT_CN, 17)
        fonts["caption"] = ImageFont.truetype(FONT_CN, 15)
        fonts["mono"] = ImageFont.truetype(FONT_MONO, 17)
    except Exception as e:
        print("Font load error:", e)
        fonts["display"] = ImageFont.load_default()
        fonts["title"] = ImageFont.load_default()
        fonts["h2"] = ImageFont.load_default()
        fonts["h3"] = ImageFont.load_default()
        fonts["body"] = ImageFont.load_default()
        fonts["body-sm"] = ImageFont.load_default()
        fonts["caption"] = ImageFont.load_default()
        fonts["mono"] = ImageFont.load_default()
    return fonts


def draw_text(draw, text, pos, font, fill, anchor="lt"):
    draw.text(pos, text, font=font, fill=fill, anchor=anchor)


def text_size(draw, text, font):
    bbox = draw.textbbox((0, 0), text, font=font)
    return bbox[2] - bbox[0], bbox[3] - bbox[1]


def wrap_text(draw, text, font, max_width):
    """Simple greedy word wrap for Chinese/English mixed text."""
    words = []
    for ch in text:
        words.append(ch)
    lines = []
    current = ""
    for word in words:
        test = current + word
        w, _ = text_size(draw, test, font)
        if w <= max_width:
            current = test
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def main():
    img = Image.new("RGBA", (WIDTH, HEIGHT), BG_BASE)
    draw = ImageDraw.Draw(img)
    fonts = load_fonts()

    # Nav
    nav_h = 72
    draw.rectangle((0, 0, WIDTH, nav_h), fill=BG_BASE)
    draw.line((0, nav_h, WIDTH, nav_h), fill=BORDER_STRONG, width=1)

    # Logo mark (colored quadrants)
    logo_x, logo_y = 64, 26
    mark_size = 22
    gap = 3
    cell = (mark_size - gap) // 2
    quadrants = ["Elements", "Framework", "UI", "Protocols"]
    for idx in range(4):
        i = idx % 2
        j = idx // 2
        x = logo_x + i * (cell + gap)
        y = logo_y + j * (cell + gap)
        color = ACCENTS[quadrants[idx]]
        draw.rectangle((x, y, x + cell, y + cell), outline=color, width=2)

    draw_text(draw, "openElement", (logo_x + mark_size + 14, logo_y + 1), fonts["body"], TEXT_PRIMARY)

    # Nav links right aligned
    nav_links = ["Docs", "Architecture", "Roadmap", "Blog"]
    link_spacing = 72
    total_links_width = sum(text_size(draw, link, fonts["body-sm"])[0] for link in nav_links) + link_spacing * (len(nav_links) - 1)
    nx = WIDTH - 260 - total_links_width
    for link in nav_links:
        draw_text(draw, link, (nx, 28), fonts["body-sm"], TEXT_SECONDARY)
        w, _ = text_size(draw, link, fonts["body-sm"])
        nx += w + link_spacing

    draw_text(draw, "v0.40.7", (WIDTH - 210, 28), fonts["caption"], TEXT_MUTED)
    draw_text(draw, "GitHub", (WIDTH - 130, 28), fonts["body-sm"], TEXT_SECONDARY)

    # Hero
    y = nav_h + 130
    draw_text(draw, "v0.40.7 已发布", (80, y), fonts["caption"], BRAND)

    y += 42
    headline = "用 JSX 构建 Web Components"
    draw_text(draw, headline, (80, y), fonts["display"], TEXT_PRIMARY)
    y += 84
    draw_text(draw, "无需框架锁定。", (80, y), fonts["display"], TEXT_PRIMARY)

    y += 100
    sub = "Static-first · DSD 默认渲染 · 单一 VNode 管线 · Preact islands · Vite + Nitro"
    draw_text(draw, sub, (80, y), fonts["body"], TEXT_SECONDARY)

    y += 70
    # Primary button
    btn_h = 48
    draw.rounded_rectangle((80, y, 220, y + btn_h), radius=8, fill=BRAND)
    draw_text(draw, "开始构建", (150, y + 13), fonts["body-sm"], (255, 255, 255), anchor="mt")
    # Secondary button
    draw.rounded_rectangle((240, y, 420, y + btn_h), radius=8, fill=BG_SURFACE, outline=BORDER_STRONG, width=1)
    draw_text(draw, "查看 GitHub", (330, y + 13), fonts["body-sm"], TEXT_PRIMARY, anchor="mt")

    y += 100
    # Code block
    code_x, code_y = 80, y
    code_w = 720
    code_h = 170
    draw.rounded_rectangle((code_x, code_y, code_x + code_w, code_y + code_h), radius=12, fill=BG_CODE, outline=BORDER, width=1)
    # Header
    draw.rectangle((code_x, code_y, code_x + code_w, code_y + 40), fill=BG_SURFACE)
    draw.line((code_x, code_y + 40, code_x + code_w, code_y + 40), fill=BORDER, width=1)
    draw.ellipse((code_x + 18, code_y + 14, code_x + 28, code_y + 24), fill=(248, 113, 113))
    draw.ellipse((code_x + 36, code_y + 14, code_x + 46, code_y + 24), fill=(251, 191, 36))
    draw.ellipse((code_x + 54, code_y + 14, code_x + 64, code_y + 24), fill=(52, 211, 153))
    draw_text(draw, "bash", (code_x + code_w - 60, code_y + 11), fonts["caption"], TEXT_MUTED)
    # Body
    lines = [
        ("$ ", "deno task create my-app", TEXT_MUTED, TEXT_PRIMARY),
        ("$ ", "cd my-app && deno task dev", TEXT_MUTED, TEXT_PRIMARY),
        ("", "Server ready at http://localhost:3000", TEXT_SECONDARY, TEXT_SECONDARY),
    ]
    ly = code_y + 60
    for prefix, content, pc, cc in lines:
        draw_text(draw, prefix, (code_x + 24, ly), fonts["mono"], pc)
        pw, _ = text_size(draw, prefix, fonts["mono"])
        draw_text(draw, content, (code_x + 24 + pw, ly), fonts["mono"], cc)
        ly += 30

    # Four products
    y = code_y + code_h + 140
    draw_text(draw, "四大产品", (80, y), fonts["caption"], BRAND)
    y += 32
    draw_text(draw, "一个框架，四层抽象", (80, y), fonts["h2"], TEXT_PRIMARY)

    y += 80
    cards = [
        ("Elements", "Shadow/DSD 组件", "用 JSX 编写原生 Web Components，默认 Shadow DOM 渲染。"),
        ("UI", "open-* 组件库", "基于 Elements 的第一方组件：button、modal、tabs、dropdown。"),
        ("Framework", "应用框架", "Vite + Nitro 驱动的路由、SSR、API routes、构建管线。"),
        ("Protocols", "协议边界", "渲染器、路由、islands、signals 的运行时无关契约。"),
    ]
    card_w = 310
    card_h = 200
    gap_x = 24
    start_x = (WIDTH - (4 * card_w + 3 * gap_x)) // 2
    for i, (title, label, desc) in enumerate(cards):
        cx = start_x + i * (card_w + gap_x)
        accent = ACCENTS[title]
        draw.rounded_rectangle((cx, y, cx + card_w, y + card_h), radius=12, fill=BG_SURFACE, outline=BORDER, width=1)
        # Accent top line
        draw.rectangle((cx + 1, y, cx + card_w - 1, y + 4), fill=accent)
        draw_text(draw, title, (cx + 22, y + 26), fonts["h3"], TEXT_PRIMARY)
        draw_text(draw, label, (cx + 22, y + 58), fonts["caption"], accent)
        wrapped = wrap_text(draw, desc, fonts["body-sm"], card_w - 44)
        line_y = y + 96
        for line in wrapped:
            draw_text(draw, line, (cx + 22, line_y), fonts["body-sm"], TEXT_SECONDARY)
            line_y += 26

    # Why section
    y += card_h + 140
    draw_text(draw, "为什么选 openElement", (80, y), fonts["caption"], BRAND)
    y += 32
    draw_text(draw, "一条渲染路径，而不是 N 条", (80, y), fonts["h2"], TEXT_PRIMARY)

    y += 80
    why = [
        ("单一渲染器", "VNode 直接输出 DSD 或 DOM，一套事件模型，没有适配器混战。"),
        ("按需 Hydrate", "Preact islands 只在需要的地方升级，其余页面保持纯静态。"),
        ("Web 标准", "输出真正的 Web Components，不绑定特定前端框架。"),
    ]
    why_w = 420
    why_h = 170
    why_gap = 30
    why_start = (WIDTH - (3 * why_w + 2 * why_gap)) // 2
    for i, (title, desc) in enumerate(why):
        wx = why_start + i * (why_w + why_gap)
        draw.rounded_rectangle((wx, y, wx + why_w, y + why_h), radius=12, fill=BG_SURFACE, outline=BORDER, width=1)
        draw_text(draw, title, (wx + 24, y + 26), fonts["h3"], TEXT_PRIMARY)
        wrapped = wrap_text(draw, desc, fonts["body-sm"], why_w - 48)
        line_y = y + 64
        for line in wrapped:
            draw_text(draw, line, (wx + 24, line_y), fonts["body-sm"], TEXT_SECONDARY)
            line_y += 26

    # Footer
    footer_y = HEIGHT - 150
    draw.rectangle((0, footer_y, WIDTH, HEIGHT), fill=BG_SURFACE)
    draw.line((0, footer_y, WIDTH, footer_y), fill=BORDER_STRONG, width=1)
    draw_text(draw, "openElement", (80, footer_y + 40), fonts["h3"], TEXT_PRIMARY)
    draw_text(draw, "JSX-first Web Components platform.", (80, footer_y + 76), fonts["body-sm"], TEXT_SECONDARY)
    footer_links = ["Docs", "Architecture", "Roadmap", "Blog", "GitHub"]
    fx = WIDTH - 80
    for link in reversed(footer_links):
        w, _ = text_size(draw, link, fonts["body-sm"])
        fx -= w
        draw_text(draw, link, (fx, footer_y + 44), fonts["body-sm"], TEXT_SECONDARY)
        fx -= 40
    draw_text(draw, "© 2026 openElement contributors · MIT", (80, footer_y + 116), fonts["caption"], TEXT_MUTED)

    out_path = os.path.join(os.path.dirname(__file__), "homepage-mockup.png")
    img.save(out_path)
    print("Saved:", out_path)


if __name__ == "__main__":
    main()
