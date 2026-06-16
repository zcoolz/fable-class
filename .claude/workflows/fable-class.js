export const meta = {
  name: 'fable-class',
  description: 'Fable-5-class result on a hard task: parallel diverse attempts -> adversarial verify -> synthesize. Beats a single one-shot.',
  whenToUse: 'Reach for this on the heavy jobs you would have wanted the top model for: long agentic coding, design decisions, complex multi-step reasoning. Pass the task as args (a string), or an object { task, finders, votes } to tune the fan-out.',
  phases: [
    { title: 'Attempt',   detail: 'N independent attempts from distinct angles' },
    { title: 'Verify',    detail: 'adversarial multi-lens check of each attempt' },
    { title: 'Synthesize', detail: 'merge the strongest attempt + best ideas from the rest' },
  ],
}

// args may be a plain string (the task) or { task, finders, votes }
const cfg     = (typeof args === 'string') ? { task: args } : (args || {})
const TASK    = cfg.task
const FINDERS = cfg.finders || 3
const VOTES   = cfg.votes   || 3

if (!TASK || typeof TASK !== 'string') {
  throw new Error('fable-class: pass the task as args (a string) or { task, finders, votes }')
}

const ANGLES = [
  'Lead with the simplest correct solution. Minimize moving parts. State assumptions explicitly.',
  'Lead with risk and failure modes first; design so the dangerous cases are impossible, then fill in the happy path.',
  'Lead from the end user / caller experience and work backward to the implementation.',
  'Lead from first principles — ignore the obvious approach, derive the design from the actual constraints.',
  'Lead from prior art — what does the strongest existing pattern in this codebase / domain already do, and adapt it.',
]

const VERIFY_LENSES = ['correctness', 'security', 'does-it-actually-work-end-to-end']

const ATTEMPT_SCHEMA = {
  type: 'object',
  required: ['approach', 'solution', 'tradeoffs'],
  properties: {
    approach:  { type: 'string', description: 'one-line name of the angle taken' },
    solution:  { type: 'string', description: 'the full proposed solution / answer / design' },
    tradeoffs: { type: 'string', description: 'honest weaknesses and what was deferred' },
    confidence:{ type: 'number', description: '0-1 self-rated confidence' },
  },
}

const VERDICT_SCHEMA = {
  type: 'object',
  required: ['lens', 'holds', 'problems'],
  properties: {
    lens:     { type: 'string' },
    holds:    { type: 'boolean', description: 'true if the solution survives this lens' },
    problems: { type: 'array', items: { type: 'string' }, description: 'concrete defects found; empty if none' },
  },
}

const angleFor = (i) => ANGLES[i % ANGLES.length]

phase('Attempt')
log(`fable-class: ${FINDERS} attempts x ${VOTES} verify lenses on: ${TASK.slice(0, 120)}`)

const attempts = await pipeline(
  Array.from({ length: FINDERS }, (_, i) => i),

  (i) => agent(
    `TASK:\n${TASK}\n\nAPPROACH FOR THIS ATTEMPT:\n${angleFor(i)}\n\n` +
    `Produce a complete, committed solution — not a survey of options. ` +
    `Do the real work: read the relevant files, reason it through, give the actual answer/design/code. ` +
    `Be honest in "tradeoffs" about what is weak or deferred.`,
    { label: `attempt:${i + 1}`, phase: 'Attempt', schema: ATTEMPT_SCHEMA }
  ),

  (attempt, i) => parallel(
    Array.from({ length: VOTES }, (_, v) => () => {
      const lens = VERIFY_LENSES[v % VERIFY_LENSES.length]
      return agent(
        `Adversarially review this candidate solution through the "${lens}" lens. ` +
        `Your job is to REFUTE it — find the defect. Default to holds=false if you are uncertain.\n\n` +
        `ORIGINAL TASK:\n${TASK}\n\nCANDIDATE APPROACH: ${attempt?.approach}\n\nCANDIDATE SOLUTION:\n${attempt?.solution}`,
        { label: `verify:${i + 1}:${lens}`, phase: 'Verify', schema: VERDICT_SCHEMA }
      )
    })
  ).then((verdicts) => {
    const v = verdicts.filter(Boolean)
    const passed = v.filter((x) => x.holds).length
    return {
      ...attempt,
      index: i + 1,
      verdicts: v,
      survives: passed >= Math.ceil(VOTES / 2),
      problems: v.flatMap((x) => x.problems || []),
    }
  })
)

phase('Synthesize')
const scored = attempts.filter(Boolean)
const survivors = scored.filter((a) => a.survives)
const pool = survivors.length ? survivors : scored

if (!pool.length) {
  return { task: TASK, error: 'no attempts produced', attempts: scored }
}

const synthesisInput = pool
  .map((a) => `### Attempt ${a.index} — ${a.approach} (survives=${a.survives}, confidence=${a.confidence ?? 'n/a'})\n` +
              `SOLUTION:\n${a.solution}\n\nKNOWN PROBLEMS: ${a.problems.length ? a.problems.join('; ') : 'none found'}\n` +
              `TRADEOFFS: ${a.tradeoffs}`)
  .join('\n\n')

const final = await agent(
  `You are the synthesizer. Below are ${pool.length} independently-produced, adversarially-verified attempts at the same task. ` +
  `Pick the strongest as the spine, graft in the best ideas from the others, and resolve every "KNOWN PROBLEM" that the verifiers raised. ` +
  `Produce ONE final answer that is better than any single attempt. Be decisive — recommend, do not survey.\n\n` +
  `ORIGINAL TASK:\n${TASK}\n\n=== VERIFIED ATTEMPTS ===\n${synthesisInput}`,
  { label: 'synthesize', phase: 'Synthesize' }
)

return { task: TASK, attempts: scored.length, survived: survivors.length, final }
