// src/rules/thresholds.js

// FOIR = Fixed Obligation to Income Ratio (existing EMIs + new EMI) / net income
// Standard lender ceilings by income band — higher earners get more headroom
export const FOIR_LIMITS = {
  salaried: {
    low:  { maxIncome: 30000,  lenderCeiling: 0.45, safeCeiling: 0.35 },
    mid:  { maxIncome: 100000, lenderCeiling: 0.50, safeCeiling: 0.40 },
    high: { maxIncome: Infinity, lenderCeiling: 0.55, safeCeiling: 0.45 },
  },
  self_employed: {
    // self-employed gets a haircut — income variability risk
    low:  { maxIncome: 30000,  lenderCeiling: 0.40, safeCeiling: 0.30 },
    mid:  { maxIncome: 100000, lenderCeiling: 0.45, safeCeiling: 0.35 },
    high: { maxIncome: Infinity, lenderCeiling: 0.50, safeCeiling: 0.40 },
  },
  informal: {
    // no ITR / bureau trail — most conservative
    low:  { maxIncome: 30000,  lenderCeiling: 0.30, safeCeiling: 0.20 },
    mid:  { maxIncome: 100000, lenderCeiling: 0.35, safeCeiling: 0.25 },
    high: { maxIncome: Infinity, lenderCeiling: 0.40, safeCeiling: 0.30 },
  },
};

// Rate bands by loan type (annual %, before fees) — base range for a "known good" profile
export const RATE_BANDS = {
  personal:    { min: 10.5, max: 18,  typicalFeePct: 2.0 },
  gold:        { min: 8.5,  max: 12,  typicalFeePct: 0.5 },
  two_wheeler: { min: 9,    max: 16,  typicalFeePct: 1.5 },
  home:        { min: 8.3,  max: 10.5, typicalFeePct: 0.5 },
  lap:         { min: 9,    max: 13,  typicalFeePct: 1.0 }, // loan against property
  business:    { min: 11,   max: 20,  typicalFeePct: 2.5 },
};

// Credit score tiers — unknown is modeled explicitly, never as worst-case
export const CREDIT_TIERS = {
  excellent: { min: 750, rateAdjust: -1.0 },
  good:      { min: 700, rateAdjust: 0 },
  fair:      { min: 650, rateAdjust: 1.5 },
  poor:      { min: 300, rateAdjust: 3.5 },
  unknown:   { min: null, rateAdjust: 1.0 }, // treated like "fair", not "poor"
};

// Emergency buffer / savings months — affects verdict + confidence, not a hard block alone
export const SAVINGS_BUFFER = {
  thin: 1,     // < 1 month expenses saved
  ok: 3,       // 1-3 months
  healthy: 6,  // 3-6 months
};

// High-cost existing debt (informal lenders, app loans) — triggers "borrow less" / "don't borrow"
export const HIGH_COST_DEBT_RATE_THRESHOLD = 24; // % APR — above this, existing debt is a red flag

// Stress test assumptions
export const STRESS_TEST = {
  incomeDropPct: 0.20,   // model a 20% income drop
  rateRisePct: 2.0,      // model +2% rate rise
};

// Loan-to-Value limits for collateral-backed lending — caps how much of the
// asset's value a lender will advance against it
export const LTV_LIMITS = {
  lap: 0.60,   // loan against property
  gold: 0.75,
  home: 0.80,
};

// Minimum age for eligibility, and where senior risk starts widening bands
export const AGE_LIMITS = { min: 21, seniorCaution: 58 };