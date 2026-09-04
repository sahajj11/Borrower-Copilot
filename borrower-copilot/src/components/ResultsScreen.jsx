// src/components/ResultsScreen.jsx
import { useState } from "react";
import NegotiationCard from "./NegotiationCard.jsx";

const VERDICT_COPY = {
  borrow: { label: "You can borrow", tone: "good" },
  borrow_less: { label: "Borrow less than you asked", tone: "caution" },
  dont_borrow: { label: "Don't borrow right now", tone: "stop" },
};

function inr(n) {
  if (n === null || n === undefined) return "—";
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

export default function ResultsScreen({ answers, results, onRestart }) {
  const [showCard, setShowCard] = useState(false);
  const { verdict, affordability, rateband, emi } = results;
  const vc = VERDICT_COPY[verdict.verdict];

  const confidenceLabel =
    affordability.confidence >= 0.8 ? "High" : affordability.confidence >= 0.55 ? "Medium" : "Low";

  if (showCard) {
    return (
      <NegotiationCard
        answers={answers}
        results={results}
        onBack={() => setShowCard(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-bg px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <p className="text-[.72rem] font-semibold tracking-[.14em] uppercase text-muted mb-3 font-body">
          Your results
        </p>

        {/* Verdict banner */}
        <div
          className={`border px-6 py-5 mb-8 ${
            vc.tone === "good"
              ? "border-accent bg-accentSoft"
              : vc.tone === "caution"
              ? "border-warn bg-[#F6EFE4]"
              : "border-ink bg-bg2"
          }`}
        >
          <p className="text-[.7rem] font-semibold tracking-[.1em] uppercase text-muted mb-1 font-body">
            Verdict
          </p>
          <h2 className="font-display font-medium text-[1.6rem] leading-tight mb-2 text-ink">
            {vc.label}
          </h2>
          <p className="text-ink/80 font-body text-[.95rem]">{verdict.reason}</p>
        </div>

        {/* O2 — Amount */}
        <Section title="How much" eyebrow="O2 · Maximum amount">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Stat label="Lender may sanction" value={inr(affordability.lenderMax)} muted />
            <Stat label="Safe for you to carry" value={inr(affordability.safeMax)} highlight />
          </div>
          <p className="text-[.7rem] uppercase tracking-[.08em] text-muted font-body mb-2">
            Use the safe number — {inr(affordability.recommended)}
          </p>
          <p className="text-ink/80 font-body text-[.92rem]">{affordability.reason}</p>
          <ConfidenceTag confidence={affordability.confidence} />
        </Section>

        {/* O3 — Rate */}
        <Section title="Fair rate" eyebrow="O3 · Interest rate">
          <div className="flex items-baseline gap-3 mb-3">
            <span className="font-mono text-3xl text-ink">
              {rateband.rateMin}% – {rateband.rateMax}%
            </span>
            <span className="text-muted font-body text-sm">
              · APR (all-in): <span className="font-mono">{rateband.apr}%</span>
            </span>
          </div>
          <p className="text-ink/80 font-body text-[.92rem]">{rateband.reason}</p>
        </Section>

        {/* O4 — EMI */}
        <Section title="EMI to agree to" eyebrow="O4 · Monthly outflow">
          <p className="font-mono text-3xl text-ink mb-3">{inr(emi.emiCeiling)}/mo</p>
          <p className="text-ink/80 font-body text-[.92rem] mb-4">{emi.reason}</p>

          <p className="text-[.7rem] uppercase tracking-[.08em] text-muted font-body mb-2">
            Tenure trade-off
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {emi.tenureOptions.map((t) => (
              <div key={t.months} className="border border-rule px-3 py-2 text-center">
                <p className="text-[.7rem] text-muted font-body">{t.months} mo</p>
                <p className="font-mono text-sm text-ink">{inr(t.emi)}</p>
              </div>
            ))}
          </div>

          <div
            className={`border-l-2 px-4 py-3 text-[.9rem] font-body ${
              emi.stressCase.survivable ? "border-accent bg-accentSoft" : "border-warn bg-[#F6EFE4]"
            }`}
          >
            <b>Stress test</b> — if income drops {emi.stressCase.incomeDropPct}% or rate rises{" "}
            {emi.stressCase.rateRisePct}pt: EMI becomes {inr(emi.stressCase.stressedEMI)}, using{" "}
            {emi.stressCase.stressedFOIR}% of income.{" "}
            {emi.stressCase.survivable ? "Still manageable." : "This would be tight — consider a smaller amount or longer tenure."}
          </div>
        </Section>

        {/* actions */}
        <div className="flex gap-3 mt-10">
          <button
            onClick={() => setShowCard(true)}
            className="flex-1 bg-accent text-accentInk px-6 py-3 text-sm font-semibold tracking-wide font-body hover:opacity-90 transition-opacity"
          >
            Open Negotiation Card →
          </button>
          <button
            onClick={onRestart}
            className="px-6 py-3 text-sm font-semibold tracking-wide font-body border border-rule text-ink hover:border-accent transition-colors"
          >
            Start over
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, eyebrow, children }) {
  return (
    <div className="border border-rule mb-6">
      <div className="px-6 pt-5 pb-1">
        <p className="text-[.7rem] font-semibold tracking-[.1em] uppercase text-muted font-body mb-1">
          {eyebrow}
        </p>
        <h3 className="font-display font-medium text-[1.3rem] text-ink mb-4">{title}</h3>
      </div>
      <div className="px-6 pb-6">{children}</div>
    </div>
  );
}

function Stat({ label, value, muted, highlight }) {
  return (
    <div className={`border px-4 py-3 ${highlight ? "border-accent bg-accentSoft" : "border-rule"}`}>
      <p className="text-[.7rem] text-muted font-body mb-1">{label}</p>
      <p className={`font-mono text-xl ${muted && !highlight ? "text-muted" : "text-ink"}`}>{value}</p>
    </div>
  );
}

function ConfidenceTag({ confidence }) {
  const label = confidence >= 0.8 ? "High confidence" : confidence >= 0.55 ? "Medium confidence" : "Low confidence — answer more for a tighter range";
  return (
    <p className="text-[.75rem] text-muted font-body mt-3 italic">
      {label}
    </p>
  );
}