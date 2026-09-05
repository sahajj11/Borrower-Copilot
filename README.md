# Borrower Copilot

A self-assessment tool that helps an Indian borrower answer four questions before they walk into a lender:

1. **Should I borrow at all?**
2. **How much am I really eligible for?**
3. **What is a fair rate for me?**
4. **What EMI should I agree to?**

It then generates a one-page **Negotiation Card** the borrower can hold up to a lender.

No login. No bureau pull. No personal data stored — everything runs client-side from what the borrower tells the app, and nothing persists after the tab closes.

**Live app:** [https://borrower-copilot-vert.vercel.app/](https://borrower-copilot-vert.vercel.app/)

---

## Why this exists

Every lender has a model that decides what a borrower gets. The borrower usually has nothing — they walk in blind, take the first sanction letter, and find out later they paid several points over a fair rate or stretched their income too thin.

This isn't a credit model or a bureau integration. It's a rules-based self-assessment designed to make the borrower the best-informed person in the room.

---

## Getting started

```bash
git clone <this-repo-url>
cd borrower-copilot
npm install
npm run dev
```

Open the local URL Vite prints (typically `http://localhost:5173`). No environment variables, no backend, no API keys — the app runs entirely in the browser.

**Requirements:** Node.js 18+ and npm.

---

## What the app does

A borrower opens the app, answers an adaptive set of questions, and receives four outputs plus a negotiation card.

| Output | What it is |
|---|---|
| **O1 — Verdict** | Borrow / Don't borrow / Borrow less, with a plain-language reason. "Don't borrow" is a real, reachable outcome. |
| **O2 — Maximum amount** | Two numbers: what a lender will likely sanction, and what's actually safe for the borrower to carry. The app always tells the borrower which one to use. |
| **O3 — Fair interest rate** | A rate band (not a single number) plus the all-in APR including fees, so a lender's quote can be compared honestly. |
| **O4 — EMI to agree to** | A monthly ceiling with a tenure trade-off table and a stress test (income drop or rate rise). |

Every number comes with a one-sentence reason traceable back to the borrower's own answers.

---

## How the question flow works

Questions are split into two tiers:

- **Must questions (fixed, ~9 questions):** age, income type, net income, existing EMIs, household expenses, loan type, amount wanted, tenure, credit score. These are the same for everyone and are enough on their own to produce all four outputs — with wide ranges and low stated confidence.
- **Additional questions (adaptive):** shown or hidden based on prior answers. A salaried applicant sees different follow-ups than a self-employed or informal-income applicant. Examples:
  - Self-employed / informal only: actual take-home income vs. declared income, collateral value, income variability
  - Salaried only: credit card utilisation
  - Everyone: dependents, co-applicant income, existing high-cost debt, recent payment bounces, savings buffer, whether a lender has already quoted a rate

Every additional question is wired into at least one output calculation. None are decorative — if a question didn't move a number, it was cut during development rather than left in for show.

Confidence in the results widens (ranges get wider, confidence label drops) the fewer additional questions are answered. An unanswered credit score is modeled as "unknown," never defaulted to a poor score.

---

## Project structure

```
/src
  /rules
    thresholds.js       # every constant: FOIR limits, rate bands, LTV limits,
                         # credit tiers, dependent/co-applicant adjustments, stress test
    verdict.js           # O1 — borrow / don't / borrow less logic
    affordability.js      # O2 — lender-sanction vs. safe-carry amount
    rateband.js            # O3 — fair rate range + all-in APR
    emi.js                  # O4 — EMI ceiling, tenure trade-off, stress test
    confidence.js            # widens ranges / lowers confidence as answers thin out
    test-personas.js          # manual test script — runs the three brief personas
                              # through the rules engine outside the UI
                              # (run with: node src/rules/test-personas.js)
  /questions
    questionTree.js      # must + additional question definitions and their
                         # adaptive appliesWhen() conditions
  /components
    Questionnaire.jsx    # the adaptive wizard UI
    ResultsScreen.jsx    # renders O1–O4, gates O2–O4 when verdict is "don't borrow"
    NegotiationCard.jsx  # printable card with live rate-comparison and negotiation scripts
  App.jsx                 # intro → questionnaire → results state machine
```

Rules logic is deliberately kept separate from UI components. Every threshold lives in `thresholds.js` and is imported by name, so a rule can be changed in one place without touching any component.

---

## Design decisions worth knowing

- **Lender number vs. safe number are computed differently on purpose.** The lender-sanction figure uses only *declared/provable* income (what a lender can actually verify) and adds in collateral-based eligibility where applicable. The safe-to-carry figure uses the borrower's *real* cash-flow income and never increases just because collateral exists — collateral changes what a lender will offer, not what's safe to repay.
- **Dependents and co-applicant income both adjust the safe ceiling**, not the lender ceiling — more mouths to feed tightens the safe band; a co-applicant's income is counted at a 50% weight to stay conservative about household coordination risk.
- **Unknown credit score is treated as a "fair/average" pricing tier**, not the worst case, per the brief's explicit instruction that "unknown is never zero."
- **The stress test** re-runs the EMI at a 20% income drop and a 2-point rate rise simultaneously and reports whether the resulting FOIR stays under a safe outer bound.
- **The Negotiation Card is interactive**, not static: the borrower can type in whatever rate a lender just quoted them, and the card recalculates a live comparison — including an estimated extra rupee cost per month if the quote is above the fair band — plus scenario-specific talking points (rate too high, amount undersized given collateral, fees not disclosed, EMI pushed too high).

---

## Known limitations

- This is a rules engine, not a credit model — thresholds reflect reasonable judgement and standard FOIR/LTV conventions, not a fitted model or live regulatory feed. See `RULES.md` for the full list of thresholds and their justification.
- A handful of borrower signals mentioned in the brief's "think about" list (e.g. income stability in years, whether the loan is for something income-generating) were considered and deliberately **cut** rather than half-implemented, because they weren't wired into any output calculation. See the walkthrough notes for reasoning.
- No automated test suite — validation was done by hand against the three reference personas (Priya, Ravi, Anita) via `src/rules/test-personas.js`, plus manual browser walkthroughs.
- No persistence, no accounts, no bureau integration, no real lender API — all intentional per the brief's scope.

---

## Testing the rules engine directly

To sanity-check the underlying calculations without going through the UI:

```bash
node src/rules/test-personas.js
```

This runs Priya, Ravi, and Anita's profiles straight through `verdict.js`, `affordability.js`, `rateband.js`, and `emi.js` and prints all four outputs to the terminal.

---

## Tech stack

- React + Vite
- Tailwind CSS v4 (theme defined via `@theme` in `src/index.css`, no `tailwind.config.js`)
- No backend, no database, no external API calls — fully client-side
