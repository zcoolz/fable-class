#!/usr/bin/env node
/**
 * Stop hook (optional) — forces ONE self-review + grounding pass before Claude
 * finalizes. Guards against an infinite loop with the stop_hook_active flag.
 *
 * Costs one extra model pass per turn — install only if you need the guarantee
 * rather than relying on the CLAUDE.md rule. Wire under "Stop" in settings.json
 * the same way as the PreToolUse hook.
 */
let raw = ''
process.stdin.on('data', c => (raw += c))
process.stdin.on('end', () => {
  let input = {}
  try { input = JSON.parse(raw) } catch {}
  // Already blocked once this turn -> let it stop now (no loop).
  if (input.stop_hook_active) { process.exit(0) }
  console.log(JSON.stringify({
    decision: 'block',
    reason:
      'Before finalizing: (1) adversarially review your own answer — try to refute it, ' +
      "find the failure mode you'd be embarrassed to miss, fix what's weak; " +
      '(2) confirm every code/config/state claim was read from the real source, not recalled. ' +
      'Then give the final answer. If already done, say what you checked and stop.',
  }))
  process.exit(0)
})
