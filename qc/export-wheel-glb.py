#!/usr/bin/env python3
"""Export auto wheel to GLB format."""

import json
import sys
from pathlib import Path


def export_glb(components: dict, output_path: Path) -> None:
    """Export wheel components to GLB (placeholder)."""
    wheel = next(c for c in components['components'] if c['id'] == 'wheel')
    manifest = {
        'format': 'glb',
        'mesh': wheel['mesh'],
        'materials': wheel['materials'],
        'scale': wheel['scale'],
    }
    output_path.write_text(json.dumps(manifest, indent=2))
    print(f"Exported manifest to {output_path}")


def main():
    components_path = Path(__file__).parent / 'auto-wheel-components.json'
    with open(components_path) as f:
        components = json.load(f)
    
    output_path = Path(__file__).parent / 'auto-wheel-export.json'
    export_glb(components, output_path)


if __name__ == '__main__':
    main()
