#!/usr/bin/env node
/**
 * PreToolUse hook — MEMORY.md bloat guard.
 *
 * MEMORY.md is an INDEX: one line per memory, detail lives in topic files.
 * It bloats when content gets written INTO the index instead of a topic file,
 * or when raw transcript blobs sneak in. This guard stops that:
 *   (1) BLOCKS edits that paste raw transcript junk (<task-notification> etc.).
 *   (2) BLOCKS edits that push total size OVER budget while INCREASING it.
 *       Edits that REDUCE size are always allowed ("prune first, then add").
 *   (3) WARNS (advisory) on an added line that looks like content, not a pointer.
 *
 * Fail-open: any internal error -> exit 0. A hook bug must never wedge editing.
 * Block mechanism: exit code 2 + reason on stderr (PreToolUse convention).
 *
 * Adjust BUDGET_BYTES to your own MEMORY.md budget.
 */

import { readFileSync, statSync } from 'fs'
import { basename } from 'path'

const BUDGET_BYTES = 24400  // your MEMORY.md index hard budget (~24.4 KB)
const LONG_LINE_WARN = 400  // an added line longer than this smells like content, not a pointer
const JUNK_MARKERS = [
  '<task-notification>', '</task-notification>',
  '<task-id>', '<tool-use-id>', '<output-file>', '<system-reminder>',
]

const bytes = (s) => Buffer.byteLength(s || '', 'utf8')

function main () {
  let input
  try {
    const raw = readFileSync(0, 'utf8').trim()
    if (!raw) return 0
    input = JSON.parse(raw)
  } catch { return 0 }

  const tool = input?.tool_name
  const ti = input?.tool_input
  if (tool !== 'Write' && tool !== 'Edit') return 0

  const filePath = ti?.file_path
  if (!filePath || basename(filePath) !== 'MEMORY.md') return 0

  const added = tool === 'Write' ? (ti?.content || '') : (ti?.new_string || '')

  const junk = JUNK_MARKERS.find(m => added.includes(m))
  if (junk) {
    process.stderr.write(
      `[memory-guard] BLOCKED: this edit pastes raw transcript junk ("${junk}") into MEMORY.md.\n` +
      `MEMORY.md is a hand-curated index — never paste tool/notification blobs. Summarize it in one line instead.\n`)
    return 2
  }

  let currentSize = 0
  try { currentSize = statSync(filePath).size } catch { currentSize = 0 }

  let newSize
  if (tool === 'Write') {
    newSize = bytes(ti?.content)
  } else {
    // Single-replacement approximation (replace_all on MEMORY.md is rare).
    newSize = currentSize - bytes(ti?.old_string) + bytes(ti?.new_string)
  }

  if (newSize > BUDGET_BYTES && newSize > currentSize) {
    const over = newSize - BUDGET_BYTES
    process.stderr.write(
      `[memory-guard] BLOCKED: this edit grows MEMORY.md to ${newSize} bytes — ${over} over the ${BUDGET_BYTES}-byte budget.\n` +
      `MEMORY.md is an INDEX, not a store. Put the detail in a topic file (memory/<slug>.md) and leave ONE line here:\n` +
      `  - [Title](slug.md) — one-line hook\n` +
      `(Edits that REDUCE size are always allowed — prune first, then add.)\n`)
    return 2
  }

  const longLine = added.split('\n').find(l => bytes(l) > LONG_LINE_WARN && !l.includes(']('))
  if (longLine) {
    process.stdout.write(
      `[memory-guard] advisory: an added line is ${bytes(longLine)} bytes with no link — that reads like content, not an index pointer.\n` +
      `Consider moving the detail to a topic file and leaving a one-line "[Title](slug.md) — hook" here. (not blocked)\n`)
  }
  return 0
}

let code = 0
try { code = main() } catch { code = 0 }
process.exit(code)
