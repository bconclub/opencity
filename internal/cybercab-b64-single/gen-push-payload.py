#!/usr/bin/env python3
"""Generate a single-file push_files payload for one cybercab b64 part."""
import json
import subprocess
import sys
from pathlib import Path

WT = Path(__file__).resolve().parents[2]
REF = "origin/codex/reconcile-0.0.41"


def payload(part: int) -> dict:
    path = f"assets/vehicles/cybercab-rigged.glb.b64.part{part}"
    content = subprocess.check_output(
        ["git", "-C", str(WT), "show", f"{REF}:{path}"],
        text=True,
    )
    return {
        "owner": "bconclub",
        "repo": "opencity",
        "branch": "main",
        "message": f"reconcile 0.0.41: cybercab b64 part{part} [cursor]",
        "files": [{"path": path, "content": content}],
    }


if __name__ == "__main__":
    json.dump(payload(int(sys.argv[1])), sys.stdout)
