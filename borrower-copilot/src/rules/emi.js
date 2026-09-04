// src/rules/emi.js
import { STRESS_TEST } from "./threshold.js";
import { computeConfidence } from "./confidence.js";

function emiFromPrincipal(principal, annualRatePct, tenureMonths) {
  const r = annualRatePct / 12 / 100;
  if (r === 0) return Math.round(principal / tenureMonths);
  const emi = (principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1);
  return Math.round(emi);
}

/**
 * Returns { emiCeiling, tenureOptions: [{months, emi}], stressCase, reason, confidence }
 */
export function computeEMI(answers, affordability, rateband) {
  const { tenureMonths, netMonthlyIncome, existingEMIs, answeredOptionalCount } = answers;

  const principal = affordability.recommended; // use the safe amount, not lender max
  const rate = rateband.rateMax; // conservative: price the EMI ceiling off the higher end of the band

  const emiCeiling = emiFromPrincipal(principal, rate, tenureMonths);

  // Show tenure tradeoff: shorter tenure = higher EMI, longer = lower EMI but more total interest
  const tenureOptions = [12, 24, 36, 48, 60]
    .filter((m) => Math.abs(m - tenureMonths) <= 36) // keep it relevant, not every possible tenure
    .map((m) => ({ months: m, emi: emiFromPrincipal(principal, rate, m) }));

  // Stress case: income drops OR rate rises — show the worse of the two on the same EMI
  const stressedIncome = netMonthlyIncome * (1 - STRESS_TEST.incomeDropPct);
  const stressedRate = rate + STRESS_TEST.rateRisePct;
  const stressedEMI = emiFromPrincipal(principal, stressedRate, tenureMonths);
  const stressedFOIR = (existingEMIs + stressedEMI) / stressedIncome;

  const stressCase = {
    incomeDropPct: STRESS_TEST.incomeDropPct * 100,
    rateRisePct: STRESS_TEST.rateRisePct,
    stressedEMI,
    stressedFOIR: Math.round(stressedFOIR * 100),
    survivable: stressedFOIR < 0.55, // rough outer bound regardless of income tier
  };

  const confidence = computeConfidence(answeredOptionalCount || 0);

  const reason = `At ₹${principal.toLocaleString("en-IN")} over ${tenureMonths} months at ~${rate}%, the EMI works out to ₹${emiCeiling.toLocaleString("en-IN")}/month. ${
    stressCase.survivable
      ? "Even if income drops 20% or the rate rises 2%, this stays manageable."
      : "A 20% income drop or 2% rate rise would push this above a safe repayment limit — consider a longer tenure or smaller amount."
  }`;

  return { emiCeiling, tenureOptions, stressCase, reason, confidence };
}