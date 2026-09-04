// src/rules/rateband.js
import { RATE_BANDS, CREDIT_TIERS } from "./threshold.js";
import { computeConfidence, widenRange } from "./confidence.js";

function getCreditTier(creditScore) {
  if (creditScore === null || creditScore === undefined) return CREDIT_TIERS.unknown;
  if (creditScore >= CREDIT_TIERS.excellent.min) return CREDIT_TIERS.excellent;
  if (creditScore >= CREDIT_TIERS.good.min) return CREDIT_TIERS.good;
  if (creditScore >= CREDIT_TIERS.fair.min) return CREDIT_TIERS.fair;
  return CREDIT_TIERS.poor;
}

/**
 * Converts a flat annual rate + processing fee into an approximate APR
 * (all-in cost), spread over the tenure. Simplified: fee amortized as an
 * upfront cost added to effective annual cost.
 */
function computeAPR(annualRatePct, feePct, tenureMonths) {
  const tenureYears = tenureMonths / 12;
  const feeAnnualized = feePct / Math.max(tenureYears, 1);
  return Math.round((annualRatePct + feeAnnualized) * 100) / 100;
}

/**
 * Returns { rateMin, rateMax, apr, tier, reason, confidence }
 */
export function computeRateBand(answers) {
  const {
    loanType,
    creditScore,          // number or null
    incomeType,
    tenureMonths,
    hasCollateral,         // bool
    answeredOptionalCount,
  } = answers;

  const base = RATE_BANDS[loanType] ?? RATE_BANDS.personal;
  const creditTier = getCreditTier(creditScore);

  // Adjust base band by credit tier
  let rateMin = base.min + creditTier.rateAdjust;
  let rateMax = base.max + creditTier.rateAdjust;

  // Self-employed/informal without collateral gets a small premium —
  // reflects real lender risk pricing, not a penalty for its own sake
  if (incomeType !== "salaried" && !hasCollateral) {
    rateMin += 1.0;
    rateMax += 1.0;
  }

  // Collateral pulls rate down regardless of income type (secured lending)
  if (hasCollateral) {
    rateMin -= 1.5;
    rateMax -= 1.0;
  }

  // Floor at the loan type's absolute minimum published band
  rateMin = Math.max(rateMin, base.min - 1);
  rateMax = Math.max(rateMax, rateMin + 1);

  const apr = computeAPR(rateMax, base.typicalFeePct, tenureMonths);

  const confidence = computeConfidence(answeredOptionalCount || 0);

  let reason = `Base rate for ${loanType.replace("_", " ")} loans is ${base.min}-${base.max}%.`;
  if (creditScore === null || creditScore === undefined) {
    reason += ` Your credit score is unknown, so we've priced this like a fair/average profile rather than assuming the worst.`;
  } else {
    reason += ` Your score of ${creditScore} places you in the "${Object.keys(CREDIT_TIERS).find(k => CREDIT_TIERS[k] === creditTier)}" tier.`;
  }
  if (hasCollateral) {
    reason += ` Offering collateral brings the rate down since it's now a secured loan.`;
  }

  return {
    rateMin: Math.round(rateMin * 100) / 100,
    rateMax: Math.round(rateMax * 100) / 100,
    apr,
    reason,
    confidence,
  };
}