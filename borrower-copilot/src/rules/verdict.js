// src/rules/verdict.js
import { FOIR_LIMITS, AGE_LIMITS, SAVINGS_BUFFER, DEPENDENT_ADJUSTMENT, CO_APPLICANT_INCOME_WEIGHT } from "./threshold.js";

function effectiveIncome(answers) {
  const declared = answers.netMonthlyIncome || 0;
  const actual = answers.actualMonthlyIncome ?? declared;
  const coIncome = answers.coApplicant ? (answers.coApplicantIncome || 0) * CO_APPLICANT_INCOME_WEIGHT : 0;
  // Verdict/safety checks use REAL cash-flow income, not just what's on paper
  return actual + coIncome; 
}

function adjustedSafeCeiling(baseSafeCeiling, dependents) {
  const reduction = Math.min((dependents || 0) * DEPENDENT_ADJUSTMENT.perDependent, DEPENDENT_ADJUSTMENT.maxReduction);
  return Math.max(0.15, baseSafeCeiling - reduction);
}

export function computeVerdict(answers) {
  const { age, incomeType, existingEMIs, hasHighCostDebt, recentBounce, savingsMonths, dependents } = answers;

  const flags = [];

  if (age < AGE_LIMITS.min) {
    return { verdict: "dont_borrow", reason: `Below minimum lending age of ${AGE_LIMITS.min}.`, flags: ["age"] };
  }

  if (recentBounce && hasHighCostDebt) {
    return {
      verdict: "dont_borrow",
      reason: "A recent payment bounce combined with existing high-cost debt means a new loan will likely make things worse, not better.",
      flags: ["recent_bounce", "high_cost_debt"],
    };
  }

  const income = effectiveIncome(answers);
  const tier = FOIR_LIMITS[incomeType];
  const band = income <= tier.low.maxIncome ? tier.low
    : income <= tier.mid.maxIncome ? tier.mid
    : tier.high;

  const safeCeiling = adjustedSafeCeiling(band.safeCeiling, dependents);
  const currentFOIR = income > 0 ? existingEMIs / income : 1;

  if (currentFOIR >= safeCeiling) flags.push("existing_foir_high");
  if (hasHighCostDebt) flags.push("high_cost_debt");
  if (savingsMonths !== null && savingsMonths !== undefined && savingsMonths < SAVINGS_BUFFER.thin) flags.push("thin_savings");
  if ((dependents || 0) >= 3) flags.push("high_dependents");

  if (currentFOIR >= band.lenderCeiling || (hasHighCostDebt && recentBounce)) {
    return {
      verdict: "dont_borrow",
      reason: `Existing monthly obligations already take up ${Math.round(currentFOIR * 100)}% of your real household income — above what's safe to add to.`,
      flags,
    };
  }

  if (flags.length >= 2) {
    return {
      verdict: "borrow_less",
      reason: "Multiple caution signals — existing high-cost debt, thin savings, or several dependents — mean a smaller amount than requested is the safer move.",
      flags,
    };
  }

  return {
    verdict: "borrow",
    reason: "Income (including any co-applicant income), existing obligations, and dependents support taking this loan at a reasonable size.",
    flags,
  };
}