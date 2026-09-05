# Walkthrough — Borrower Copilot

A written version of the five-minute walkthrough: what's built, what I'd build next, and what I deliberately cut.

---

## What's built

A rules-based self-assessment tool. A borrower answers an adaptive set of questions (different follow-ups depending on whether they're salaried, self-employed, or informal-income) and gets four outputs — a verdict, a maximum amount split into "what a lender would offer" vs. "what's actually safe," a fair rate band, and an EMI ceiling with a stress test — plus a Negotiation Card they can print or hold up to a lender. Everything is a deterministic calculation against named thresholds in one file; nothing is an ML model or an LLM call at runtime.

Validated by hand against the three reference personas (Priya, Ravi, Anita) — see `RUN-THROUGHS.md`.

---

## What I'd build next

**1. Wire in the questions I cut, properly this time.**
Three signals were designed but removed because they weren't yet worth half-implementing (see `RULES.md` §17): job tenure / income stability, and whether the loan is "productive" (income-generating). Given more time, I'd build a real tiering rule for stability years affecting confidence, and a conservative rule for productive loans — e.g. a modest bump to the safe ceiling only when expected new income is independently plausible relative to the loan size, capped so it can't be gamed by an optimistic guess.

**2. Replace the simplified APR formula with true amortized APR.**
Right now, APR is annual rate + (fee % ÷ tenure in years) — a reasonable proxy, but a real amortization-based APR (fee netted out of disbursement, solved for the effective rate across the full schedule) would be materially more accurate, especially for short-tenure loans where the current approximation overstates or understates the true cost more than it should.

**3. Handle the "don't borrow" case with more nuance than a flat stop.**
Currently, `dont_borrow` suppresses O2-O4 entirely. A better version would still show *a* number — e.g. "here's what it would take to get back to a borrowable position" (how much existing debt to pay down, or how many months of clean payment history needed) — turning a dead end into an actionable next step.

**4. Make the rate bands and fee assumptions swappable, not hardcoded judgement calls.**
They're currently reasonable approximations of the Indian lending market, explicitly flagged as such in `RULES.md`. A real product would want these sourced from an actual periodically-updated reference (even a manually maintained one) rather than baked into `thresholds.js` from general knowledge.

**5. Persist a session (without a login).**
Right now closing the tab loses everything — intentional for privacy, but a real borrower revisiting a lender negotiation over several days would benefit from an option to save their card locally (e.g. a downloadable JSON or a link with the answers encoded) without us storing anything server-side.

**6. Real mobile QA pass.**
Built responsively with Tailwind, but I haven't done a dedicated pass on small-screen edge cases — long reason strings wrapping awkwardly, the tenure-options row overflowing, etc.

---

## What I'd cut, if I had less time than I did

If I were re-scoping this under tighter time pressure, the first things to go would be:
- The live rate-comparison input on the Negotiation Card (nice, but the static "fair range" alone still satisfies the core requirement)
- The confidence-widening system entirely — reasonable ranges with a simple "answer more questions for a tighter estimate" note would cover most of the value at a fraction of the complexity
- Card-utilisation and existing-offer questions — real signals, but the app's core value (the lender-vs-safe split, and a real "don't borrow" path) doesn't depend on them

None of these were actually cut, but this is roughly the order I'd trim in if the timebox were tighter.

---

## Honest gaps, stated plainly

- No automated tests — validation was manual, via a console script and live browser walkthroughs, not a test suite.
- Rate bands and fee assumptions are approximate market judgement, not sourced from a live feed.
- The APR formula is a simplified proxy, documented as such.
- Confidence scoring thresholds (0.35 floor, 0.15/0.07 variability penalties, etc.) are reasonable but ultimately arbitrary calibration choices, not derived from any dataset.