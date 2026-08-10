# C231 — Gabe's Study OS (Fall 2026 hub)

One site, all courses. Root is the **main menu**; each course is a single-file app
with a ⌂ Menu button back to the hub. Same publish system as B250: push to `main`,
hard-refresh with a `?v=` bump.

**Live:** https://instagramma.github.io/C231/ (GitHub Pages → deploy from `main`, root)

## Pages
- `index.html` — **Main menu** (v1.0, 2026-08-10): course cards with live progress
  (read from each app's localStorage, same origin — no network), overdue counts,
  countdown to Aug 17.
- `chem231.html` — **CHEM 231 Ochem Bootcamp v2.1** (was the old root `index.html`):
  one-button Today, 9-day runway + Aug 17 final diagnostic with due dates/overdue
  queueing, step-gated Lewis Lab, generation-first Drill, cheat sheet, Report export.
- `phys210.html` — **PHYS 210 Physics Bootcamp v1.0**: same architecture, blue
  graph-paper colorway. 9-day runway (due Aug 8–16, mini-diagnostic Aug 16),
  73 generation-style questions (units → algebra → trig → vector components →
  vector addition → kinematics → Newton), **Problem Lab** (blank-page problems
  step-gated setup → equation → algebra → number, misses tracked by step type),
  cheat sheet, Report export.

## Architecture / extending when syllabi land
All data lives at the top of each app's `<script>`:
- `TRACK` — swap the 9-day runway for real course weeks (due dates included)
- `QUESTIONS` — flat array (`id/topic/type/prompt/answer/tolerance?/why`); append per-chapter banks
- `MOLECULES` (chem) / `PROBLEMS` (phys) — lab targets; generic checkers
- Progress = localStorage (safe-wrapped; phys keys prefixed `p210_`); Report tab exports as text for the Learning Profile ledger

## Deploy convention (inherited from B250)
- Commit to `main` → Pages serves it
- Cache-bust on device by opening `…/?v=YYYYMMDDx` after each deploy
