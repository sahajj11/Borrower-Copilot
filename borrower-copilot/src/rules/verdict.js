// src/rules/verdict.js
import { FOIR_LIMITS, HIGH_COST_DEBT_RATE_THRESHOLD, AGE_LIMITS, SAVINGS_BUFFER } from "./threshold.js";

/**
 * Returns { verdict: "borrow" | "borrow_less" | "dont_borrow", reason: string, flags: string[] }
 */
export function computeVerdict(answers) {
  const {
    age,
    incomeType,          // "salaried" | "self_employed" | "informal"
    netMonthlyIncome,
    existingEMIs,          // total ₹/month
    householdExpenses,
    amountWanted,
    tenureMonths,
    hasHighCostDebt,       // bool: existing loans at >24% APR
    recentBounce,          // bool: bounced an EMI/payment recently
    savingsMonths,         // number or null if unknown
  } = answers;

  const flags = [];

  // Hard stop: age outside working eligibility
  if (age < AGE_LIMITS.min) {
    return { verdict: "dont_borrow", reason: `Below minimum lending age of ${AGE_LIMITS.min}.`, flags: ["age"] };
  }

  // Hard stop: recent bounce + high-cost existing debt = clear distress signal
  if (recentBounce && hasHighCostDebt) {
    return {
      verdict: "dont_borrow",
      reason: "A recent payment bounce combined with existing high-cost debt means a new loan will likely make things worse, not better.",
      flags: ["recent_bounce", "high_cost_debt"],
    };
  }

  const tier = FOIR_LIMITS[incomeType];
  const band = netMonthlyIncome <= tier.low.maxIncome ? tier.low
    : netMonthlyIncome <= tier.mid.maxIncome ? tier.mid
    : tier.high;

  const currentFOIR = existingEMIs / netMonthlyIncome;

  // Already over safe FOIR before even adding new loan
  if (currentFOIR >= band.safeCeiling) {
    flags.push("existing_foir_high");
  }

  // High-cost debt present, even without a bounce — still a caution flag
  if (hasHighCostDebt) flags.push("high_cost_debt");

  // Thin/no savings buffer widens caution but is not a hard stop by itself
  if (savingsMonths !== null && savingsMonths < SAVINGS_BUFFER.thin) {
    flags.push("thin_savings");
  }

  // Decision logic
  if (currentFOIR >= band.lenderCeiling || (hasHighCostDebt && recentBounce)) {
    return {
      verdict: "dont_borrow",
      reason: `Existing monthly obligations already take up ${Math.round(currentFOIR * 100)}% of income — above what's safe to add to, regardless of a new loan's terms.`,
      flags,
    };
  }

  if (flags.length >= 2) {
    return {
      verdict: "borrow_less",
      reason: "Multiple caution signals (existing high-cost debt and/or thin savings) mean a smaller amount than requested is the safer move.",
      flags,
    };
  }

  return {
    verdict: "borrow",
    reason: "Income, existing obligations, and repayment history support taking this loan at a reasonable size.",
    flags,
  };
}