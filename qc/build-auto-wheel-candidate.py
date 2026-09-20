#!/usr/bin/env python3
"""Build auto wheel candidate mesh from component definitions."""

import json
import sys
from pathlib import Path


def load_components(path: Path) -> dict:
    with open(path) as f:
        return json.load(f)


def build_candidate(components: dict) -> dict:
    """Build candidate wheel configuration."""
    wheel = next(c for c in components['components'] if c['id'] == 'wheel')
    return {
        'id': 'auto-wheel-candidate',
        'base_mesh': wheel['mesh'],
        'materials': wheel['materials'],
        'scale': wheel['scale'],
        'origin': wheel['origin'],
    }


def main():
    components_path = Path(__file__).parent / 'auto-wheel-components.json'
    components = load_components(components_path)
    candidate = build_candidate(components)
    print(json.dumps(candidate, indent=2))


if __name__ == '__main__':
    main()
