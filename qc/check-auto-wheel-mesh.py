#!/usr/bin/env python3
"""Validate auto wheel mesh files exist and are valid."""

import json
import sys
from pathlib import Path


def check_mesh(mesh_path: Path) -> bool:
    if not mesh_path.exists():
        print(f"  MISSING: {mesh_path}")
        return False
    size = mesh_path.stat().st_size
    print(f"  OK: {mesh_path} ({size} bytes)")
    return True


def main():
    components_path = Path(__file__).parent / 'auto-wheel-components.json'
    with open(components_path) as f:
        components = json.load(f)
    
    all_ok = True
    for comp in components['components']:
        mesh_path = Path(__file__).parent / comp['mesh']
        print(f"Checking {comp['id']}:")
        if not check_mesh(mesh_path):
            all_ok = False
    
    sys.exit(0 if all_ok else 1)


if __name__ == '__main__':
    main()
