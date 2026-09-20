# Cursor agent commits

Commits pushed by Cursor cloud agents on this repository include the **`[cursor]`** tag in the commit message subject line.

Example:

```
release 0.0.41: tree batch 40/226 [cursor]
```

Use this tag to distinguish automated Cursor agent pushes from human or other CI commits when auditing history or diagnosing issues.

Batch push helper: `mcp-batch-push-runner.py` (agent store) sets `CURSOR_TAG = "[cursor]"` on every `push_files` commit.
