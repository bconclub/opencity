"""Split a GLB into base64 shards for MCP-safe remote push.

Usage:
  python3 split-glb-b64.py [input.glb] [output-dir]

Writes:
  {name}.glb.b64.part1..N  (17000 chars each, last part shorter)
  {name}.glb.b64.manifest.json  (partCount, sha256, byteLength, b64Length)
"""
import base64
import hashlib
import json
import sys
from pathlib import Path

CHUNK = 17000


def main():
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('assets/vehicles/cybercab-rigged.glb')
    out_dir = Path(sys.argv[2]) if len(sys.argv) > 2 else src.parent
    data = src.read_bytes()
    b64 = base64.b64encode(data).decode('ascii')
    digest = hashlib.sha256(data).hexdigest()
    stem = src.name
    parts = []
    for i in range(0, len(b64), CHUNK):
        part_num = len(parts) + 1
        chunk = b64[i:i + CHUNK]
        part_path = out_dir / f'{stem}.b64.part{part_num}'
        part_path.write_text(chunk, encoding='ascii')
        parts.append(part_path)
    manifest = {
        'file': stem,
        'byteLength': len(data),
        'b64Length': len(b64),
        'partCount': len(parts),
        'partSize': CHUNK,
        'sha256': digest,
        'sha256Prefix': digest[:16],
        'magic': data[:4].decode('latin-1'),
    }
    manifest_path = out_dir / f'{stem}.b64.manifest.json'
    manifest_path.write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(manifest))


if __name__ == '__main__':
    main()
