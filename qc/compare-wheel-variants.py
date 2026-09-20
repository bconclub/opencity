#!/usr/bin/env python3
"""Compare wheel variant configurations."""

import json
from pathlib import Path


VARIANTS = [
    {'id': 'standard', 'scale': [1, 1, 1]},
    {'id': 'large', 'scale': [1.2, 1.2, 1.2]},
    {'id': 'small', 'scale': [0.8, 0.8, 0.8]},
]


def main():
    components_path = Path(__file__).parent / 'auto-wheel-components.json'
    with open(components_path) as f:
        components = json.load(f)
    
    base = next(c for c in components['components'] if c['id'] == 'wheel')
    
    print('Wheel Variant Comparison')
    print('=' * 40)
    for v in VARIANTS:
        scaled = [s * b for s, b in zip(v['scale'], base['scale'])]
        print(f"\n{v['id']}:")
        print(f"  Scale: {v['scale']} -> {scaled}")


if __name__ == '__main__':
    main()
