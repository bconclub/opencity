# QC evidence on GitHub

Cloud-agent MCP cannot push raw JPEG bytes (UTF-8 corruption). Evidence is stored as ASCII `.b64` sidecars next to each `.jpg` path.

Decode locally:

```bash
base64 -d qc/devaraj-urs/after-departure.jpg.b64 > /tmp/after-departure.jpg
```

Verify: `file` shows JPEG, magic `ffd8`, size > 10 KB.

Full branch sync (preferred for PR review): `git push -u origin cursor/p2-devaraj-kerbs-8129` and `cursor/p0-helicopter-picker-8129` from a machine with GitHub push access.
