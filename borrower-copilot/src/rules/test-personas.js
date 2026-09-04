// src/rules/test-personas.js
// Run with: node src/rules/test-personas.js
// (Vite's package.json has "type": "module", so ES imports work directly with node)

import { computeAffordability } from "./affordability.js";
import { computeEMI } from "./emi.js";
import { computeRateBand } from "./rateband.js";
import { computeVerdict } from "./verdict.js";



const personas = {
priya: {
  age: 29,
  incomeType: "salaried",
  netMonthlyIncome: 110000,
  existingEMIs: 14000,
  householdExpenses: 28000,
  amountWanted: 800000,
  loanType: "personal",
  tenureMonths: 36,
  creditScore: 780,
  hasCollateral: false,
  hasHighCostDebt: false,
  recentBounce: false,
  savingsMonths: null,
  answeredOptionalCount: 7,
  dependents: 0,
  coApplicant: false,
  coApplicantIncome: 0,
  cardUtilisation: "low",
  hasExistingOffer: true,
  existingOfferRate: 14,        // lender quoted her 14% — should flag as above fair range
},
  ravi: {
  age: 42,
  incomeType: "self_employed",
  netMonthlyIncome: 35000,
  existingEMIs: 0,
  householdExpenses: 25000,
  amountWanted: 1500000,
  loanType: "lap",
  tenureMonths: 60,
  creditScore: null,
  hasCollateral: true,
  collateralValue: 4500000,
  hasHighCostDebt: false,
  recentBounce: false,
  savingsMonths: null,
  answeredOptionalCount: 8,
  actualMonthlyIncome: 60000,
  dependents: 0,
  coApplicant: true,
  coApplicantIncome: 18000,
  variableIncomeShare: "high",   // cash income swings ₹40k-80k
  hasExistingOffer: false,
},
  anita: {
  age: 35,
  incomeType: "informal",
  netMonthlyIncome: 28000,
  existingEMIs: 5000,
  householdExpenses: 20000,
  amountWanted: 150000,
  loanType: "two_wheeler",
  tenureMonths: 24,
  creditScore: null,
  hasCollateral: false,
  hasHighCostDebt: true,
  recentBounce: true,
  savingsMonths: 0,
  answeredOptionalCount: 6,
  actualMonthlyIncome: 28000,
  dependents: 2,
  coApplicant: false,
  coApplicantIncome: 0,
  variableIncomeShare: "medium",
  hasExistingOffer: false,
},
};

function runPersona(name, answers) {
  console.log(`\n========== ${name.toUpperCase()} ==========`);

  const verdict = computeVerdict(answers);
  console.log("\n[O1] Verdict:", verdict.verdict);
  console.log("Reason:", verdict.reason);
  console.log("Flags:", verdict.flags);

  const affordability = computeAffordability(answers);
  console.log("\n[O2] Affordability:");
  console.log("  Lender max: ₹" + affordability.lenderMax.toLocaleString("en-IN"));
  console.log("  Safe max:   ₹" + affordability.safeMax.toLocaleString("en-IN"));
  console.log("  Recommended: ₹" + affordability.recommended.toLocaleString("en-IN"));
  console.log("  Confidence:", affordability.confidence);
  console.log("  Reason:", affordability.reason);

  const rateband = computeRateBand(answers);
  console.log("\n[O3] Rate band:");
  console.log(`  ${rateband.rateMin}% - ${rateband.rateMax}%  (APR incl. fees: ${rateband.apr}%)`);
  console.log("  Reason:", rateband.reason);

  const emi = computeEMI(answers, affordability, rateband);
  console.log("\n[O4] EMI:");
  console.log("  Ceiling: ₹" + emi.emiCeiling.toLocaleString("en-IN") + "/month");
  console.log("  Tenure options:", emi.tenureOptions.map(t => `${t.months}mo: ₹${t.emi.toLocaleString("en-IN")}`).join(", "));
  console.log("  Stress case (income -20% / rate +2%):", "EMI ₹" + emi.stressCase.stressedEMI.toLocaleString("en-IN"), "| FOIR " + emi.stressCase.stressedFOIR + "%", "| Survivable:", emi.stressCase.survivable);
  console.log("  Reason:", emi.reason);
}

Object.entries(personas).forEach(([name, answers]) => runPersona(name, answers));