# fable-class

**Get Fable-5-class results out of a smaller model — through orchestration, not raw size.**

Anthropic pulled Claude Fable 5; a lot of us got moved back to Opus 4.8. Fable 5's real edge was long, autonomous, multi-step reasoning — and most of *that* is **persistence, verification, and grounding**, not raw IQ. This is a small, dependency-free [Claude Code](https://claude.com/claude-code) package that buys those back with scaffolding.

It's plain Claude Code — no MCP, no services, no lock-in. Drop it into any project on any OS.

---

## First, the thing most people miss: Claude Code has a Workflow tool

Claude Code ships a **`Workflow`** tool that almost nobody talks about. It lets you orchestrate many Claude subagents **deterministically** from a plain-JavaScript script — real control flow (loops, conditionals, fan-out), not one model improvising a plan.

The whole API is a handful of primitives you call inside a script:

- **`agent(prompt, opts)`** — spawn one subagent; returns its result. Pass a JSON `schema` and you get back a validated object instead of text.
- **`parallel([...thunks])`** — run agents concurrently, wait for all (a barrier).
- **`pipeline(items, stage1, stage2, ...)`** — run each item through every stage independently, no barrier between stages (each item flows as fast as it can).
- **`phase(title)` / `log(msg)`** — group and narrate progress.

You save a script as a *named workflow* under `.claude/workflows/`, then run it by asking Claude to. It's **opt-in** — it only fires when you invoke it, so it never quietly spawns a fleet of agents. Watch it live with `/workflows`.

That's the engine. **`fable-class` is one recipe built on it** — proof that the real leverage isn't a bigger model, it's how you wire the agents together. Read [`.claude/workflows/fable-class.js`](.claude/workflows/fable-class.js) and you'll see the whole pattern in ~120 lines; fork it into your own recipes.

---

## What's in it

| Piece | File | What it does |
|---|---|---|
| **Workflow** | `.claude/workflows/fable-class.js` | For a hard task: N agents attempt it from *different angles* → a second wave adversarially **refutes** each → one agent synthesizes the survivors and resolves every problem raised. |
| **Standing rules** | `builder-discipline.md` | Two defaults: self-critique before finalizing; never answer about code/state from memory — read the real source. |
| **Memory guard** | `hooks/pre-tool-use-memory-guard.mjs` | Keeps your `MEMORY.md` index from bloating (blocks junk pastes + over-budget growth; pruning always passes). |
| **Stop hook** *(optional)* | `hooks/stop-self-review.mjs` | Deterministically enforces the self-critique rule. Costs one extra pass per turn — install only if you need the guarantee. |
| **Eval scoreboard** | `FABLE_CLASS_EVALS.template.md` | So you *measure* that the workflow beats a one-shot instead of assuming it. |

## Quick start

1. **Workflow** — copy `.claude/workflows/fable-class.js` into your project's `.claude/workflows/`.
2. **Rules** — paste `builder-discipline.md` into your project's `CLAUDE.md`.
3. **Memory guard** — copy `hooks/pre-tool-use-memory-guard.mjs` somewhere, then wire it in `.claude/settings.json` (or `.claude/settings.local.json`):

   ```json
   {
     "hooks": {
       "PreToolUse": [
         { "matcher": "Edit|Write",
           "hooks": [ { "type": "command",
             "command": "node /ABSOLUTE/PATH/TO/hooks/pre-tool-use-memory-guard.mjs",
             "timeout": 10 } ] }
       ]
     }
   }
   ```

**Two things to adjust when porting:** the absolute hook path above, and `BUDGET_BYTES` inside the hook (your own MEMORY.md budget).

Requires Node 18+ (for the hook) and the Claude Code CLI.

## Usage

- Run it: tell Claude **"run fable-class on \<your task\>"**.
- Tune the fan-out: pass `{ task, finders, votes }` (defaults 3 × 3 ≈ 13 agents).
- Watch it: `/workflows` shows the live phase tree.
- **Cost** ≈ `finders × (1 + votes) + 1` agents. Use it for hard/high-stakes work; for quick lookups just ask directly.

## How the workflow works

It's a **pipeline** — each attempt is verified the moment it's produced, while the others are still generating, so there's no wasted wall-clock:

1. **Attempt** — independent agents, each forced to a *distinct angle* (simplest-first, risk-first, user-backward, first-principles, prior-art). Distinct angles are what stop you getting N near-identical answers.
2. **Verify** — each attempt is adversarially attacked through different lenses (correctness, security, end-to-end), each told to *refute* it. Majority-must-hold or the attempt is dropped.
3. **Synthesize** — one agent takes the survivors, uses the strongest as the spine, grafts in the best ideas, and must resolve every problem the verifiers raised.

## Why

None of this adds raw intelligence — it adds persistence, verification, and grounding, which is where the bigger model was actually winning on hard work. Orchestration beats raw size more often than the leaderboards admit.

You don't always need the smartest brain in the room. You need a room.

## License

MIT — see [LICENSE](LICENSE).
