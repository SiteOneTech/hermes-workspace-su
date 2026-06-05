#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public' / 'agent-avatars'
OUT.mkdir(parents=True, exist_ok=True)

ROLES = [
    ('zeus', 'Zeus', 'Primary SitioUno operator, CEO command profile, lightning crown, strategic control'),
    ('factory-orchestrator', 'Factory Orchestrator', 'mission control conductor, autonomous software factory, routing agents, greenlight gates'),
    ('solution-architect', 'Solution Architect', 'systems architect, blueprints, clean boundaries, canonical technical design'),
    ('implementation-planner', 'Implementation Planner', 'task graph planner, sequencing, acceptance criteria, implementation roadmap'),
    ('claude-builder', 'Claude Builder', 'premium code builder, careful diffs, strong reasoning, product implementation'),
    ('codex-builder', 'Codex Builder', 'focused terminal code builder, economical loops, tests and patches'),
    ('quality-reviewer', 'Quality Reviewer', 'quality gate reviewer, regression checks, code quality, acceptance verification'),
    ('security-reviewer', 'Security Reviewer', 'security auditor, shield, secrets and auth boundaries, risk detection'),
    ('qa-verifier', 'QA Verifier', 'QA smoke tester, browser verification, evidence capture, checklist'),
    ('product-analyst', 'Product Analyst', 'market and product analyst, personas, insights, competitive intelligence'),
    ('devops-release', 'DevOps Release', 'release engineer, deployment pipeline, infrastructure readiness, operations handoff'),
    ('factory-reporter', 'Factory Reporter', 'executive reporter, delivery summaries, audit trail, stakeholder status'),
    ('openhands-lab', 'OpenHands Lab', 'experimental autonomous-agent lab, sandbox, robotics hands, GCP evaluation'),
]

BASE_STYLE = (
    'Create a unique circular avatar icon for a Hermes Agent workspace profile. '
    'Futuristic premium AI operator portrait/icon, dark navy background, luminous accents, '
    'clean vector-like 3D illustration, centered composition, no text, no letters, no words, '
    'not a logo mockup, suitable for a 128px round UI avatar, high contrast, polished product UI asset.'
)

def find_urls(obj):
    urls = []
    if isinstance(obj, str):
        if obj.startswith('http'):
            urls.append(obj)
    elif isinstance(obj, dict):
        for value in obj.values():
            urls.extend(find_urls(value))
    elif isinstance(obj, list):
        for value in obj:
            urls.extend(find_urls(value))
    return urls

def parse_urls(text: str):
    urls = []
    try:
        data = json.loads(text)
        urls = find_urls(data)
    except Exception:
        urls = re.findall(r'https?://\S+', text)
    # Prefer image-looking URLs but keep first URL fallback.
    image_urls = [u.rstrip(',.') for u in urls if re.search(r'\.(png|jpe?g|webp)(\?|$)', u, re.I)]
    return image_urls or [u.rstrip(',.') for u in urls]

manifest = []
failures = []
for role_id, name, brief in ROLES:
    prompt = f'{BASE_STYLE} Role: {name}. Visual concept: {brief}.'
    cmd = [
        'higgsfield', 'generate', 'create', 'gpt_image_2',
        '--prompt', prompt,
        '--aspect_ratio', '1:1',
        '--resolution', '1k',
        '--quality', 'high',
        '--wait', '--wait-timeout', '20m', '--json',
    ]
    print(f'GENERATING {role_id}', flush=True)
    proc = subprocess.run(cmd, cwd=str(ROOT), text=True, capture_output=True, timeout=1500)
    if proc.returncode != 0:
        failures.append({'id': role_id, 'returncode': proc.returncode, 'stderr': proc.stderr[-2000:], 'stdout': proc.stdout[-2000:]})
        print(f'FAILED {role_id}', flush=True)
        continue
    urls = parse_urls(proc.stdout)
    if not urls:
        failures.append({'id': role_id, 'returncode': 0, 'stderr': 'No URL found', 'stdout': proc.stdout[-2000:]})
        print(f'NO_URL {role_id}', flush=True)
        continue
    url = urls[0]
    target = OUT / f'{role_id}.webp'
    # Preserve as webp path. If remote is png/jpeg, browsers still render by content-type poorly when served static;
    # convert via Pillow to real webp.
    raw = OUT / f'.{role_id}.download'
    urllib.request.urlretrieve(url, raw)
    try:
        from PIL import Image
        with Image.open(raw) as im:
            im.save(target, 'WEBP', quality=92, method=6)
        raw.unlink(missing_ok=True)
    except Exception:
        raw.replace(target)
    manifest.append({
        'id': role_id,
        'path': f'/agent-avatars/{role_id}.webp',
        'provider': 'higgsfield',
        'model': 'gpt_image_2',
        'bytes': target.stat().st_size,
        'status': 'generated',
        'sourceUrl': url,
    })
    print(f'DONE {role_id} {target.stat().st_size}', flush=True)

# Write manifest only if every role succeeded, so we do not mix partial canonical state silently.
if failures:
    (OUT / 'higgsfield-failures.json').write_text(json.dumps(failures, indent=2) + '\n')
    print('FAILURES', json.dumps(failures, indent=2), flush=True)
    sys.exit(1)

(OUT / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print('ALL_DONE', len(manifest), flush=True)
