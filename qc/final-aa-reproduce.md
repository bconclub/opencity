# Reconstructing the AA experiments

Use Node with the same Playwright runtime path in the harness. Reserve one GPU job, close unrelated rendering, and permit network access to public map/CDN resources. Do not compare a new run numerically with an old session as an isolated speedup.

Full source snapshots are intentionally not committed. `final-aa-prepare.cjs` reconstructs them from repository commits and the small archived override source sets without reading mutable runtime files. Both reference and candidate use MapLibre5.7.2. Original/final index hashes and the explicit repaired-reference label are recorded.

To reconstruct the rejected FullHD AA-on experiment:

```powershell
node qc/final-aa-prepare.cjs qc/final-aa-fullhd-on-sources
node qc/final-aa-harness-prepare.cjs
node qc/final-aa-performance.cjs
```

This deliberately reproduces a failing gate and writes generic `final-aa-performance.json`; archived `final-aa-fullhd-on-performance.json` remains unchanged.

To reconstruct the reduced-budget tier experiments:

```powershell
node qc/final-aa-prepare.cjs qc/final-aa-compact-on-sources
node qc/final-aa-harness-prepare.cjs
node qc/final-aa-tiers-prepare.cjs
node qc/final-aa-fullhd-off-performance.cjs
node qc/final-aa-compact-on-performance.cjs
```

Run those two browsers sequentially. FullHD off passed, compact on failed close traffic. Both include120 intervals per run and pose; do not pool their intervals with the earlier240-interval FullHD-on test.

For final input smoke, reconstruct reduced-budget source snapshots first, then apply the captured final original app/sw and exact three input files. The generator reads captured small files, not current runtime. `mobile-pause-candidates.json` is a required independent-QA hash manifest.

```powershell
node qc/final-aa-final-smoke-prepare.cjs
node qc/final-aa-final-smoke.cjs
```

Final smoke restores the original AA-off rendering path and asserts actual zero framebuffer samples on software and mobile emulation. Reconstructed snapshots contain an unused experimental policy file, but final app/sw neither import nor cache it. Source overrides and request hashes prove this distinction.

The first5.6.1 attempts and upstream tile-error stacks are retained as historical failure evidence. Their partial timings are not accepted measurements. Attempt2 overlapped a brief unrelated diagnostic renderer and must never be used as a timing baseline. The candidate-only repaired transition has an explicit diagnostic receipt because its inherited comparison fields are inapplicable.

Representative paired screenshots preserve run0 reference versus run1 candidate per pose; raw JSON retains all four ABBA runs and every interval. Complete duplicate source trees, both duplicate image iterations and the downloaded upstream bundle are excluded from the proposed QC commit.
