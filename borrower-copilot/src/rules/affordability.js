// src/rules/affordability.js
import { FOIR_LIMITS, RATE_BANDS, LTV_LIMITS, DEPENDENT_ADJUSTMENT, CO_APPLICANT_INCOME_WEIGHT } from "./threshold.js";
import { computeConfidence, widenRange } from "./confidence.js";

function principalFromEMI(emi, annualRatePct, tenureMonths) {
  const r = annualRatePct / 12 / 100;
  if (r === 0) return emi * tenureMonths;
  const principal = emi * ((Math.pow(1 + r, tenureMonths) - 1) / (r * Math.pow(1 + r, tenureMonths)));
  return Math.round(principal);
}

function adjustedSafeCeiling(baseSafeCeiling, dependents) {
  const reduction = Math.min((dependents || 0) * DEPENDENT_ADJUSTMENT.perDependent, DEPENDENT_ADJUSTMENT.maxReduction);
  return Math.max(0.15, baseSafeCeiling - reduction);
}

/**
 * Returns { lenderMax, safeMax, collateralMax, recommended, range, confidence, reason }
 */
export function computeAffordability(answers) {
  const {
    incomeType,
    netMonthlyIncome,
    actualMonthlyIncome,
    existingEMIs,
    loanType,
    tenureMonths,
    amountWanted,
    collateralValue,
    coApplicant,
    coApplicantIncome,
    dependents,
    variableIncomeShare,
    answeredOptionalCount,
  } = answers;

  const declaredIncome = netMonthlyIncome || 0;
  const actualIncome = actualMonthlyIncome ?? declaredIncome;
  const coIncome = coApplicant ? (coApplicantIncome || 0) * CO_APPLICANT_INCOME_WEIGHT : 0;

  // Lender sizing: only counts documented/provable income
  const lenderHouseholdIncome = declaredIncome + coIncome;
  // Safe-to-carry: counts real cash-flow income
  const safeHouseholdIncome = actualIncome + coIncome;

  const tier = FOIR_LIMITS[incomeType];
  const lenderBand = lenderHouseholdIncome <= tier.low.maxIncome ? tier.low
    : lenderHouseholdIncome <= tier.mid.maxIncome ? tier.mid : tier.high;
  const safeBand = safeHouseholdIncome <= tier.low.maxIncome ? tier.low
    : safeHouseholdIncome <= tier.mid.maxIncome ? tier.mid : tier.high;

  const safeCeiling = adjustedSafeCeiling(safeBand.safeCeiling, dependents);

  const incomeLenderEMI = Math.max(0, lenderHouseholdIncome * lenderBand.lenderCeiling - existingEMIs);
  const incomeSafeEMI = Math.max(0, safeHouseholdIncome * safeCeiling - existingEMIs);

  const assumedRate = RATE_BANDS[loanType]?.min ?? RATE_BANDS.personal.min;

  const incomeLenderMax = principalFromEMI(incomeLenderEMI, assumedRate, tenureMonths);
  const incomeSafeMax = principalFromEMI(incomeSafeEMI, assumedRate, tenureMonths);

  let collateralMax = null;
  if (collateralValue && LTV_LIMITS[loanType]) {
    collateralMax = Math.round(collateralValue * LTV_LIMITS[loanType]);
  }

  // Lender's likely sanction: higher of income-based or collateral-based eligibility
  const lenderMax = collateralMax ? Math.max(incomeLenderMax, collateralMax) : incomeLenderMax;
  // Safe-to-carry NEVER rises from collateral — bounded by real repayment capacity
  const safeMax = incomeSafeMax;

  const confidence = computeConfidence(answeredOptionalCount || 0);

  // High income variability widens the safe range further and shaves confidence —
  // we have less certainty this month's number represents a typical month
  let variabilityConfidencePenalty = 0;
  if (variableIncomeShare === "high") variabilityConfidencePenalty = 0.15;
  else if (variableIncomeShare === "medium") variabilityConfidencePenalty = 0.07;

 const adjustedConfidence = Math.round(Math.max(0.35, confidence - variabilityConfidencePenalty) * 100) / 100;
  const range = widenRange(safeMax, 0.15, adjustedConfidence);

  const recommended = safeMax;

  let reason = `At ${Math.round(safeCeiling * 100)}% of your real household income${coIncome ? " (including your co-applicant's)" : ""} going to loan payments, after ₹${existingEMIs.toLocaleString("en-IN")}/month existing obligations${dependents ? ` and ${dependents} dependent(s)` : ""}, ₹${safeMax.toLocaleString("en-IN")} is what you can comfortably repay.`;

  if (actualIncome > declaredIncome * 1.15) {
    reason += ` A lender will size your sanction off your declared ₹${declaredIncome.toLocaleString("en-IN")}/month, not your full cash income, so their number may look lower than what you can actually afford.`;
  }

  if (collateralMax) {
    reason += ` Your collateral could get you a lender sanction up to ₹${collateralMax.toLocaleString("en-IN")} (at ${Math.round(LTV_LIMITS[loanType] * 100)}% of its value), but that doesn't make it safe to take that much — your real income still has to cover the EMI.`;
  }

  if (variableIncomeShare === "high") {
    reason += ` Since your income varies a lot month to month, we've widened this range and lowered confidence rather than assuming every month looks like this one.`;
  }

  if (amountWanted > lenderMax) {
    reason += ` The ₹${amountWanted.toLocaleString("en-IN")} you're asking for is above even what a lender would likely sanction.`;
  } else if (amountWanted > safeMax) {
    reason += ` A lender may sanction closer to ₹${lenderMax.toLocaleString("en-IN")}, but that's more than is safe to carry.`;
  }

  return {
    lenderMax,
    safeMax,
    collateralMax,
    recommended,
    range,
    confidence: adjustedConfidence,
    reason,
  };
}