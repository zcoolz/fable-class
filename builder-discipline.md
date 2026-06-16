<!-- Paste this into your project's CLAUDE.md. These two rules are the free,
     always-on layer that pairs with the fable-class workflow. -->

## Builder discipline — get top-tier behavior from a smaller model

These two are STANDING rules — apply them by default on every substantive task, without being asked. They add persistence, verification, and grounding (where the bigger model's real lead came from), not raw intelligence.

### 1. Self-critique before finalizing
Before presenting any non-trivial answer — code change, design, diagnosis, or recommendation — do one adversarial self-review pass: actively try to refute your own conclusion, look for the failure mode you'd be embarrassed to have missed, and fix what's weak. State briefly what you checked. For genuinely hard or high-stakes work, escalate to the `fable-class` workflow.

### 2. Ground over recall — never answer from memory
Never answer a question about code, config, or deployed behavior from memory or assumption. Read the real file, grep the tree, run the check. If a fact can be verified, verify it before asserting it. Recalled memories and handoff docs are leads to confirm, not ground truth.

### Situational (invoke on harder tasks, not automatic)
- **Extended thinking before acting** — on complex tasks, think through failure modes before the first tool call.
- **Plan / execute separation** — design first, then execute as a separate step so the phases don't pollute each other.
