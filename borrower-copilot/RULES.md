# RULES.md — Borrower Copilot

Every rule, threshold, band, and assumption used by the rules engine, with the reasoning behind it. This document should be read alongside `/src/rules/thresholds.js`, which is the single source of truth for every numeric constant listed here — nothing in the app is hardcoded outside that file.

Format: **what · value · why · source or judgement**

---

## 1. Affordability — FOIR (Fixed Obligation to Income Ratio)

FOIR = (existing EMIs + new EMI) ÷ net monthly income. Two ceilings are tracked per income type and income band: a **lender ceiling** (what a bank would likely approve up to) and a **safe ceiling** (what we recommend the borrower actually use).

| Income type | Income band | Lender ceiling | Safe ceiling | Why | Source / judgement |
|---|---|---|---|---|---|
| Salaried | ≤ ₹30,000/mo | 45% | 35% | Standard conservative FOIR range used by Indian retail lenders for lower-income salaried borrowers | Industry-standard FOIR convention; exact split is my judgement |
| Salaried | ₹30,001–₹1,00,000/mo | 50% | 40% | Mid-income salaried borrowers get modestly more headroom | My judgement, within standard FOIR norms |
| Salaried | > ₹1,00,000/mo | 55% | 45% | Higher earners have more disposable margin after fixed costs | My judgement |
| Self-employed | ≤ ₹30,000/mo | 40% | 30% | 5-point haircut vs. salaried at every band — income variability risk | My judgement, informed by standard practice of pricing self-employed more conservatively |
| Self-employed | ₹30,001–₹1,00,000/mo | 45% | 35% | Same haircut logic | My judgement |
| Self-employed | > ₹1,00,000/mo | 50% | 40% | Same haircut logic | My judgement |
| Informal | ≤ ₹30,000/mo | 30% | 20% | No ITR/bureau trail — most conservative tier | My judgement |
| Informal | ₹30,001–₹1,00,000/mo | 35% | 25% | Same reasoning, scaled up slightly with income | My judgement |
| Informal | > ₹1,00,000/mo | 40% | 30% | Same reasoning | My judgement |

**Why two ceilings at all:** a lender sizes a loan to the maximum they can justify approving; a responsible borrower should size their commitment to what they can actually sustain. The app always recommends the safe number, never the lender number, and says so explicitly.

---

## 2. Dependents adjustment

| What | Value | Why | Source / judgement |
|---|---|---|---|
| Safe-ceiling reduction per dependent | −2 percentage points | Each dependent (child, elderly parent, etc.) reduces genuinely discretionary income even if it doesn't appear as a formal EMI | My judgement — models a real cost of living pressure the FOIR formula alone doesn't capture |
| Maximum total reduction | −10 percentage points (i.e. never reduce below 5 dependents' worth) | Prevents the adjustment from producing an unrealistically punitive ceiling for large families | My judgement, a deliberate cap |
| Floor on adjusted safe ceiling | 15% minimum | Ensures the safe ceiling never becomes so low it's functionally zero for someone with several dependents but otherwise healthy finances | My judgement |

Only the **safe ceiling** is adjusted — the lender ceiling is not, since lenders' formal underwriting typically doesn't discount for dependents directly.

---

## 3. Co-applicant income weighting

| What | Value | Why | Source / judgement |
|---|---|---|---|
| Co-applicant income weight | 50% | A second income genuinely adds capacity, but is weighted down to stay conservative about household coordination risk (e.g. the co-applicant's income isn't guaranteed to be available for this specific obligation) | My judgement |

Applied to **both** the lender-facing and safe-facing income totals, since a real co-applicant is added to the loan application either way.

---

## 4. Declared vs. actual income (self-employed / informal only)

| What | Value | Why | Source / judgement |
|---|---|---|---|
| Lender-sanction sizing uses **declared/ITR income** | — | Lenders can only underwrite against provable, documented income | Standard lending practice |
| Safe-to-carry sizing uses **actual take-home income** (self-reported cash income) | — | The borrower's real ability to make a monthly payment depends on real cash flow, not what's on paper | My judgement — this is the mechanism that correctly separates "what a bank will offer" from "what's safe," especially for self-employed/informal borrowers whose declared and actual income diverge |
| Threshold to surface the "your lender number may look lower" message | Actual income > 1.15 × declared income | Avoids showing the caveat for borrowers whose declared and actual income are close enough that the distinction isn't meaningful | My judgement, arbitrary but reasonable cutoff |

---

## 5. Collateral / Loan-to-Value (LTV) limits

Applies only to loan types where collateral is a normal product feature.

| Loan type | LTV limit | Why | Source / judgement |
|---|---|---|---|
| Loan against property (LAP) | 60% | Standard conservative LTV for LAP in the Indian market | Approximate industry norm |
| Gold loan | 75% | Gold loans typically carry higher LTV given liquid, easily-valued collateral | Approximate industry norm (RBI guidance on gold loans historically allows up to ~75-90% depending on regulation vintage; 75% chosen as a conservative midpoint) |
| Home loan | 80% | Standard LTV ceiling for home loans under RBI-aligned lending norms | Approximate industry norm |

**Rule:** the lender-sanction number takes the **higher** of the income-based ceiling or the collateral-based ceiling (collateral genuinely expands what a lender will offer). The safe-to-carry number is **never** raised by collateral — it stays governed purely by real repayment capacity, because the borrower still has to service the EMI out of monthly cash flow regardless of what the asset is worth.

---

## 6. Interest rate bands by loan type

Base annual rate range before any borrower-specific adjustment, plus a typical processing-fee assumption used to compute all-in APR.

| Loan type | Rate range | Typical processing fee | Source / judgement |
|---|---|---|---|
| Personal loan | 10.5% – 18% | 2.0% | Approximate current Indian unsecured personal loan market range |
| Gold loan | 8.5% – 12% | 0.5% | Approximate current market range |
| Two-wheeler loan | 9% – 16% | 1.5% | Approximate current market range |
| Home loan | 8.3% – 10.5% | 0.5% | Approximate current market range |
| Loan against property (LAP) | 9% – 13% | 1.0% | Approximate current market range |
| Business loan | 11% – 20% | 2.5% | Approximate current market range |

These are approximate, judgement-based ranges reflecting general market conditions at time of writing — not a live rate feed. Documented here explicitly as an assumption, per the brief's instruction to state what we do not know.

---

## 7. Credit score tiers

| Tier | Score range | Rate adjustment | Why | Source / judgement |
|---|---|---|---|---|
| Excellent | ≥ 750 | −1.0 pt | Rewards strong credit history with a rate discount | Approximate CIBIL-aligned convention |
| Good | 700–749 | 0 pt (baseline) | Baseline pricing | Approximate convention |
| Fair | 650–699 | +1.5 pt | Moderate risk premium | Approximate convention |
| Poor | 300–649 | +3.5 pt | Higher risk premium | Approximate convention |
| **Unknown** | not provided | +1.0 pt (same as roughly midway between Good and Fair) | **Explicitly modeled as "fair/average," never as worst-case.** Per the brief's rule that unknown must never default to zero/worst-case. | Deliberate design decision, not a market convention |

---

## 8. Additional rate adjustments

| Signal | Adjustment | Why | Source / judgement |
|---|---|---|---|
| Self-employed/informal income type, no collateral offered | +1.0 pt to both ends of the band | Reflects real lender risk pricing for undocumented/variable income without security | My judgement |
| Collateral offered | −1.5 pt (min) / −1.0 pt (max) | Secured lending genuinely carries lower risk-based pricing | My judgement |
| Credit card utilisation — high (>70%) | +0.5 pt | Signals tighter cash flow, a real risk factor lenders price independently of credit score | My judgement |
| Credit card utilisation — medium (30-70%) | +0.2 pt | Smaller version of the same signal | My judgement |

Rate is floored so it never drops below (loan type's minimum − 1 point), preventing adjustments from producing an unrealistically low rate.

---

## 9. All-in APR calculation

| What | Formula | Why | Source / judgement |
|---|---|---|---|
| APR (all-in) | annual rate (top of band) + (processing fee % ÷ tenure in years) | Approximates the effect of a one-time upfront fee spread over the loan's life, so a short-tenure loan with a flat fee shows a correctly higher effective annual cost than a long-tenure loan with the same fee | Simplified approximation — a true APR calculation would use full amortization with the fee netted out of disbursement; this is a reasonable proxy given the scope, documented here as a known simplification |

---

## 10. Income variability (self-employed / informal only)

| What | Value | Why | Source / judgement |
|---|---|---|---|
| High variability | widens the safe range and reduces confidence by 0.15 | Signals that the reported income figure may not represent a typical month, so ranges should widen and stated confidence should drop rather than pretending precision we don't have | My judgement |
| Medium variability | reduces confidence by 0.07 | Smaller version of the same adjustment | My judgement |
| Confidence floor | never drops below 0.35 | A floor ensures confidence never reads as "we know nothing," since must-questions alone still provide some signal | My judgement |

---

## 11. Confidence scoring

| What | Value | Why | Source / judgement |
|---|---|---|---|
| Base confidence with zero optional questions answered | 0.35 | Must-questions alone give partial signal — confidence should never read as zero | My judgement |
| Confidence scaling | rises toward 1.0 as more applicable optional questions are answered, out of the total applicable to that borrower | Ensures confidence reflects how much *relevant* detail was given, not a fixed universal question count (a salaried borrower and a self-employed borrower see different numbers of applicable optional questions) | My judgement |
| Confidence labels | High ≥ 0.80, Medium ≥ 0.55, Low below that | Simple three-tier labeling for the UI | My judgement, arbitrary cutoffs |

**Range widening:** the [min, max] range shown around a point estimate widens as confidence drops, using a spread factor tuned per output (currently 0.15 for affordability). The principle: never narrow a range without basis, always widen it when information is missing.

---

## 12. The verdict logic (O1 — Borrow / Don't / Borrow less)

| Rule | Condition | Outcome | Why | Source / judgement |
|---|---|---|---|---|
| Age floor | Age < 21 | Don't borrow | Below standard minimum lending age in India | Standard convention |
| Distress hard-stop | Recent payment bounce **and** existing high-cost debt (>24% APR) present simultaneously | Don't borrow | Two independent red flags together indicate active financial distress where a new loan is very likely to worsen the situation | My judgement |
| Over-ceiling hard-stop | Current FOIR (existing EMIs ÷ real household income) ≥ lender ceiling | Don't borrow | Already over what any lender should reasonably extend further credit against | My judgement, derived from FOIR ceiling table above |
| Multiple caution flags | 2 or more of: existing FOIR above safe ceiling, high-cost debt present, thin savings (<1 month expenses), 3+ dependents | Borrow less | No single factor is disqualifying, but the combination suggests a smaller amount is the prudent move | My judgement |
| Otherwise | — | Borrow | Income, obligations, and dependents support taking the loan at a reasonable size | Default outcome when no flags fire |

**Effective income used for verdict checks:** real/actual income (not just declared) plus weighted co-applicant income — same principle as the safe-side affordability calculation, since the verdict is fundamentally a safety check, not a lender-eligibility check.

---

## 13. High-cost debt threshold

| What | Value | Why | Source / judgement |
|---|---|---|---|
| High-cost debt flag threshold | > 24% APR | Above this, existing debt is treated as a red flag signal (app loans, informal lenders, etc. commonly exceed this) | My judgement, roughly aligned with where personal/unsecured lending in India starts to look predatory |

---

## 14. Savings buffer

| Tier | Months of expenses saved | Source / judgement |
|---|---|---|
| Thin | < 1 month | My judgement |
| OK | 1–3 months | My judgement |
| Healthy | 3–6 months | My judgement |

Thin savings contributes as one caution flag toward the "borrow less" multi-flag rule (§12) — it is not, by itself, a hard stop.

---

## 15. Stress test (O4)

| What | Value | Why | Source / judgement |
|---|---|---|---|
| Income drop modeled | −20% | A meaningful but not extreme shock, representative of a job loss, reduced hours, or a slow season for self-employed income | My judgement |
| Rate rise modeled | +2 percentage points | Representative of a plausible rate-cycle move over a loan's life | My judgement |
| Survivability threshold | Stressed FOIR < 55% | A rough outer bound beyond which a household budget is considered unsafe under either shock, applied uniformly regardless of income tier for simplicity | My judgement |

The stress test recalculates EMI at the higher stressed rate and checks the resulting FOIR against real household income (actual income + weighted co-applicant income), not declared income — since surviving a shock is a real cash-flow question, not a documentation question.

---

## 16. Question design — must vs. additional

| Principle | Implementation |
|---|---|
| Must questions apply to everyone | Age, income type, net income, existing EMIs, household expenses, loan type, amount wanted, tenure, credit score (~9 questions) |
| Additional questions are adaptive | Filtered via an `appliesWhen(answers)` condition per question — e.g. collateral/actual-income/variability questions only shown to self-employed/informal borrowers; card utilisation only shown to salaried borrowers |
| Every additional question must move a number | Enforced as a design discipline — see §17 for questions that were considered and cut for failing this test |

---

## 17. Questions considered and explicitly cut

Per the brief's own rule — "if a question never moves a number, cut it" — these were designed, then removed because they weren't wired into any output calculation and weren't worth the added engineering to wire in within scope:

| Question | Why it was cut |
|---|---|
| Job tenure (years at current employer) | Conceptually useful for stability, but `savingsMonths` + `hasHighCostDebt` + `recentBounce` already cover repayment-behavior risk more directly; adding tenure would require new tiering logic without a clearly better payoff |
| Income stability (years at current income source, self-employed/informal) | Same reasoning as above |
| Whether the loan is for something income-generating, and expected extra monthly income | A genuinely interesting signal (a "productive loan" case) but pricing it safely without real business-cashflow rules risked looking arbitrary; better suited to future work than a half-implemented rule |

These are documented here rather than silently dropped, and are called out as "what I'd build next" in the project walkthrough.

---

## 18. What this app deliberately does not do

- No credit bureau pull, no ML model, no live rate feed — every number is a deterministic rule against user-provided answers.
- No persistence — nothing is saved after the session ends.
- Rate bands and fee assumptions are approximate market judgement, not sourced from a specific live lender API or RBI dataset, and are explicitly flagged as such wherever used.
- The all-in APR calculation is a simplified proxy (§9), not a full amortization-based APR computation.