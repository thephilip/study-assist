// Self-check for armDismissOnBack. Run: npx tsx src/hooks/useDismissOnBack.check.ts
// ponytail: a script, not a test suite — the repo has no test runner and this
// one branch doesn't justify adding one.
import assert from 'node:assert/strict'
import { armDismissOnBack } from './useDismissOnBack'

function fakeHistory() {
  const stack: unknown[] = [null]
  let onPop: (() => void) | null = null
  return {
    hist: {
      get state() { return stack[stack.length - 1] },
      pushState(s: unknown) { stack.push(s) },
      back() { stack.pop(); onPop?.() },
    },
    win: {
      addEventListener: (_: string, h: EventListenerOrEventListenerObject) => { onPop = h as () => void },
      removeEventListener: () => { onPop = null },
    },
    depth: () => stack.length,
    fireBack() { stack.pop(); onPop?.() },
  }
}

// Back while open dismisses, and leaves the history depth where it started.
{
  const f = fakeHistory()
  let dismissed = 0
  const disarm = armDismissOnBack(() => dismissed++, f.win as never, f.hist as never)
  assert.equal(f.depth(), 2, 'opening pushes one entry')
  f.fireBack()
  assert.equal(dismissed, 1, 'back dismisses the overlay')
  disarm()
  assert.equal(f.depth(), 1, 'no leftover entry after a back-driven close')
}

// Closing another way (Escape/backdrop) also unwinds the entry, without a
// second dismiss — otherwise the next back would be swallowed as a no-op.
{
  const f = fakeHistory()
  let dismissed = 0
  const disarm = armDismissOnBack(() => dismissed++, f.win as never, f.hist as never)
  disarm()
  assert.equal(f.depth(), 1, 'Escape-close unwinds the pushed entry')
  assert.equal(dismissed, 0, 'unwinding must not re-fire the dismiss handler')
}

console.log('useDismissOnBack: ok')
