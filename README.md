# C231 — CHEM 231 Ochem Bootcamp

Single-file study app for CHEM 231 (Organic Chemistry I, SMCCD Fall 2026).
Companion to the B250 anatomy app — same publish system: push to `main`, hard-refresh with a `?v=` bump.

**Live app:** `index.html` (GitHub Pages → Settings → Pages → deploy from `main`, root)

## What's inside (v2.0, 2026-08-09)
- **Today** — one-button next action, 9-day gen-chem→ochem runway (Aug 8–16)
- **Lewis Lab** — step-gated structure builder: electron budget → central atom →
  predict-remaining → draw (atoms/bonds/lone pairs) → per-atom octet audit
- **Drill** — ~50 generation-first questions across 9 topics, review-missed queue
- **Cheat Sheet** — bond table, six steps, pKa ladder, ARIO, hybridization, functional groups
- **Report** — exports progress/miss data as text (feeds the Learning Profile ledger)

## Architecture / extending after the syllabus lands
All data lives at the top of the `<script>` in `index.html`:
- `TRACK` — swap the 9-day runway for real course weeks
- `QUESTIONS` — flat array (`id/topic/type/prompt/answer/why`); append per-chapter banks
- `MOLECULES` — Lewis Lab targets; generic checker, add molecules by formula + valence data
- Progress uses localStorage (safe-wrapped); "Report" tab exports it as text

## Deploy convention (inherited from B250)
- Commit to `main` → Pages serves it
- Cache-bust on device by opening `…/index.html?v=YYYYMMDDx` after each deploy
