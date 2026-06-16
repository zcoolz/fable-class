# Fable-Class Evals — does the scaffolding actually help?

The feedback loop. Belief is not measurement. Keep a small set of past hard tasks and re-run **`fable-class` vs a single one-shot** on them, scoring which won and on what (real findings, false positives, completeness). Watch whether more `finders`/`votes` keeps paying off or plateaus.

## How to run an eval

For each entry: (a) run the task one-shot, (b) run it through `fable-class`, (c) score both blind, (d) record which won and why. A second model (or a judge agent) makes a good blind scorer.

## Schema

```
- id:       short slug
- task:     what was asked (1-2 lines)
- date:     when first run
- method:   fable-class NxM  |  one-shot
- result:   headline of what it produced
- status:   unverified | verified-correct | false-positive | mixed
- verdict:  did fable-class earn its cost vs a one-shot? on what?
```

---

## Entries

### eval-001 — <slug>
- **task:**
- **date:**
- **method:**
- **result:**
- **status:** unverified
- **verdict:**

---

*Keep entries terse — this is a scoreboard, not a writeup.*
