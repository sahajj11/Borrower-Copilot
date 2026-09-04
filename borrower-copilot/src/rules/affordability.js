// src/rules/affordability.js
import { FOIR_LIMITS, RATE_BANDS, LTV_LIMITS } from "./threshold.js";
import { computeConfidence, widenRange } from "./confidence.js";

function principalFromEMI(emi, annualRatePct, tenureMonths) {
  const r = annualRatePct / 12 / 100;
  if (r === 0) return emi * tenureMonths;
  const principal = emi * ((Math.pow(1 + r, tenureMonths) - 1) / (r * Math.pow(1 + r, tenureMonths)));
  return Math.round(principal);
}

/**
 * Returns { lenderMax, safeMax, collateralMax, recommended, reason, confidence, range }
 */
export function computeAffordability(answers) {
  const {
    incomeType,
    netMonthlyIncome,
    existingEMIs,
    loanType,
    tenureMonths,
    amountWanted,
    collateralValue,      // ₹ value of asset offered, or null/undefined
    answeredOptionalCount,
  } = answers;

  const tier = FOIR_LIMITS[incomeType];
  const band = netMonthlyIncome <= tier.low.maxIncome ? tier.low
    : netMonthlyIncome <= tier.mid.maxIncome ? tier.mid
    : tier.high;

  const incomeLenderEMI = Math.max(0, netMonthlyIncome * band.lenderCeiling - existingEMIs);
  const incomeSafeEMI = Math.max(0, netMonthlyIncome * band.safeCeiling - existingEMIs);

  const assumedRate = RATE_BANDS[loanType]?.min ?? RATE_BANDS.personal.min;

  const incomeLenderMax = principalFromEMI(incomeLenderEMI, assumedRate, tenureMonths);
  const incomeSafeMax = principalFromEMI(incomeSafeEMI, assumedRate, tenureMonths);

  // Collateral-based ceiling — only applies for secured loan types with an LTV limit
  let collateralMax = null;
  if (collateralValue && LTV_LIMITS[loanType]) {
    collateralMax = Math.round(collateralValue * LTV_LIMITS[loanType]);
  }

  // Lender's likely sanction: the higher of income-based or collateral-based eligibility,
  // since collateral genuinely expands what a lender will offer for secured products.
  const lenderMax = collateralMax ? Math.max(incomeLenderMax, collateralMax) : incomeLenderMax;

  // Safe-to-carry stays income-driven ALWAYS — collateral changes what you CAN borrow,
  // never what you can SAFELY REPAY out of monthly cash flow.
  const safeMax = incomeSafeMax;

  const confidence = computeConfidence(answeredOptionalCount || 0);
  const range = widenRange(safeMax, 0.15, confidence);

  const recommended = safeMax;

  let reason = `At ${Math.round(band.safeCeiling * 100)}% of your income going to loan payments (the safe limit for ${incomeType.replace("_", "-")} income), after your existing ₹${existingEMIs.toLocaleString("en-IN")}/month obligations, ₹${safeMax.toLocaleString("en-IN")} is what you can comfortably repay.`;

  if (collateralMax) {
    reason += ` Your collateral could get you a lender sanction up to ₹${collateralMax.toLocaleString("en-IN")} (at ${Math.round(LTV_LIMITS[loanType] * 100)}% of its value), but that doesn't mean it's safe to take that much — your income still has to cover the EMI.`;
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
    confidence,
    reason,
  };
}