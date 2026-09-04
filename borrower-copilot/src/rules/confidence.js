// src/rules/confidence.js

// Total "optional" questions we track confidence against.
// This should match the count of additional questions in questionTree.js
export const MAX_OPTIONAL_SIGNALS = 10;

/**
 * Confidence score 0-1 based on how many optional questions were answered
 * (not "must" questions — those are always required for the app to run at all).
 */
export function computeConfidence(answeredOptionalCount) {
  const ratio = Math.min(answeredOptionalCount / MAX_OPTIONAL_SIGNALS, 1);
  // Floor confidence at 0.35 even with zero optional answers —
  // must-questions alone still give *some* signal, never zero confidence.
  return Math.round((0.35 + ratio * 0.65) * 100) / 100;
}

export function confidenceLabel(confidence) {
  if (confidence >= 0.8) return "High";
  if (confidence >= 0.55) return "Medium";
  return "Low";
}

/**
 * Widens a [min, max] range based on confidence.
 * Low confidence = wider band. High confidence = tighter band, closer to the point estimate.
 * `spreadFactor` lets each rule (rate, amount, EMI) control how aggressively it widens.
 */
export function widenRange(pointEstimate, spreadFactor, confidence) {
  // confidence 1.0 -> widen by spreadFactor * 0.3 (tight)
  // confidence 0.35 -> widen by spreadFactor * 1.0 (wide)
  const widenMultiplier = 1 - confidence * 0.7;
  const delta = pointEstimate * spreadFactor * widenMultiplier;
  return {
    min: Math.max(0, Math.round(pointEstimate - delta)),
    max: Math.round(pointEstimate + delta),
  };
}