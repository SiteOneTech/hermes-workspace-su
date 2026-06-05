#!/usr/bin/env python3
from __future__ import annotations

import json
import subprocess
import sys
import urllib.request
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "agent-avatars"
MODEL = "seedream_v5_lite"

ROLES = [
    (
        "solution-architect",
        "Solution Architect",
        "senior systems architect, holographic blueprints, modular service boundaries, clean canonical diagrams, precise engineering leadership",
    ),
    (
        "implementation-planner",
        "Implementation Planner",
        "technical project planner, task cards, dependency graph, execution roadmap, disciplined implementation sequencing",
    ),
    (
        "factory-reporter",
        "Factory Reporter",
        "observability reporter, dashboard wall, status signals, concise operational briefings, evidence capture",
    ),
    (
        "openhands-lab",
        "OpenHands Lab",
        "experimental coding lab operator, sandbox VM, robotic hands, prototype instrumentation, research workstation",
    ),
]

BASE_PROMPT = (
    "Square professional avatar icon for a Hermes Agent workspace profile, 1:1. "
    "Create an actual futuristic AI operator portrait or character bust, not a monogram and not a logo. "
    "Premium dark navy workstation background, luminous role-specific accents, polished 3D/vector hybrid illustration, centered head-and-shoulders composition, high contrast, readable at 128px. "
    "Absolutely no text, no letters, no initials, no words, no typography, no watermark. "
)


def extract_url(obj):
    if isinstance(obj, dict):
        if isinstance(obj.get("result_url"), str) and obj["result_url"].startswith("http"):
            return obj["result_url"]
        for v in obj.values():
            u = extract_url(v)
            if u:
                return u
    elif isinstance(obj, list):
        for v in obj:
            u = extract_url(v)
            if u:
                return u
    return None


def run_one(slug: str, role: str, concept: str):
    prompt = f"{BASE_PROMPT} Role: {role}. Visual concept: {concept}."
    cmd = [
        "higgsfield",
        "generate",
        "create",
        MODEL,
        "--prompt",
        prompt,
        "--aspect_ratio",
        "1:1",
        "--quality",
        "basic",
        "--wait",
        "--wait-timeout",
        "20m",
        "--json",
    ]
    print(f"Generating {slug} with {MODEL} basic...", flush=True)
    res = subprocess.run(cmd, cwd=ROOT, text=True, capture_output=True)
    if res.returncode != 0:
        print(res.stdout, file=sys.stderr)
        print(res.stderr, file=sys.stderr)
        raise SystemExit(res.returncode)
    data = json.loads(res.stdout)
    url = extract_url(data)
    if not url:
        print(json.dumps(data, indent=2)[:4000], file=sys.stderr)
        raise RuntimeError(f"No result URL for {slug}")
    png = OUT / f"{slug}.source.png"
    webp = OUT / f"{slug}.webp"
    urllib.request.urlretrieve(url, png)
    with Image.open(png) as img:
        img = img.convert("RGB")
        img.thumbnail((512, 512), Image.Resampling.LANCZOS)
        canvas = Image.new("RGB", (512, 512), (12, 16, 28))
        canvas.paste(img, ((512 - img.width) // 2, (512 - img.height) // 2))
        canvas.save(webp, "WEBP", quality=86, method=6)
    print(json.dumps({"slug": slug, "url": url, "webp": str(webp), "bytes": webp.stat().st_size}), flush=True)
    return {"id": slug, "path": f"/agent-avatars/{slug}.webp", "provider": "higgsfield", "model": MODEL, "quality": "basic", "sourceUrl": url, "bytes": webp.stat().st_size, "status": "generated"}


def update_manifest(entries):
    manifest_path = OUT / "manifest.json"
    manifest = {}
    if manifest_path.exists():
        raw = json.loads(manifest_path.read_text())
        if isinstance(raw, dict) and isinstance(raw.get("avatars"), list):
            manifest = raw
        elif isinstance(raw, list):
            manifest = {"avatars": raw}
    avatars: dict[str, dict] = {}
    for a in manifest.get("avatars", []):
        if isinstance(a, dict) and isinstance(a.get("id"), str):
            avatars[a["id"]] = a
    for e in entries:
        avatars[e["id"]] = e
    manifest["avatars"] = [avatars[k] for k in sorted(avatars.keys())]
    manifest_path.write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n")


def contact_sheet():
    files = [
        "zeus", "factory-orchestrator", "solution-architect", "implementation-planner",
        "claude-builder", "codex-builder", "quality-reviewer", "security-reviewer",
        "qa-verifier", "product-analyst", "devops-release", "factory-reporter", "openhands-lab",
    ]
    w, cell_w, cell_h = 4 * 220, 220, 180
    h = ((len(files) + 3) // 4) * cell_h
    sheet = Image.new("RGB", (w, h), (20, 24, 35))
    d = ImageDraw.Draw(sheet)
    for i, slug in enumerate(files):
        img = Image.open(OUT / f"{slug}.webp").convert("RGB").resize((128, 128))
        x = (i % 4) * cell_w + 46
        y = (i // 4) * cell_h + 20
        sheet.paste(img, (x, y))
        d.text(((i % 4) * cell_w + 10, y + 135), slug, fill=(240, 240, 240))
    out = OUT / "contact-sheet.jpg"
    sheet.save(out, quality=92)
    print(f"contact_sheet={out}", flush=True)


def main():
    entries = []
    for slug, role, concept in ROLES:
        entries.append(run_one(slug, role, concept))
    update_manifest(entries)
    contact_sheet()


if __name__ == "__main__":
    main()
