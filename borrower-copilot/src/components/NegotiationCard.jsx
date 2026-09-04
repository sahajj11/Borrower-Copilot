// src/components/NegotiationCard.jsx
import { useState } from "react";

function inr(n) {
  if (n === null || n === undefined) return "—";
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

const VERDICT_LABEL = {
  borrow: "Proceed with this loan",
  borrow_less: "Proceed, but at a lower amount",
  dont_borrow: "Not a good time to borrow",
};

export default function NegotiationCard({ answers, results, onBack }) {
  const { verdict, affordability, rateband, emi } = results;
  const [quotedRate, setQuotedRate] = useState(rateband.offerComparison?.quotedRate ?? "");
  const isStop = verdict.verdict === "dont_borrow";

  function handlePrint() {
    window.print();
  }

  const quoted = Number(quotedRate);
  const hasQuote = quoted > 0;
  const gapPt = hasQuote ? Math.round((quoted - rateband.rateMax) * 100) / 100 : null;
  const isOverFair = hasQuote && quoted > rateband.rateMax;

  // Rough extra cost of the gap over the full tenure, for a concrete rupee number
  const extraMonthlyCost =
    hasQuote && isOverFair
      ? Math.round(
          (affordability.recommended * (gapPt / 100)) / 12
        )
      : 0;

  return (
    <div className="min-h-screen bg-bg2 px-4 py-10 print:bg-white print:py-0">
      <div className="max-w-xl mx-auto">
        {/* controls — hidden on print */}
        <div className="flex items-center justify-between mb-5 print:hidden">
          <button onClick={onBack} className="text-sm text-muted hover:text-ink transition-colors font-body">
            ← Back to results
          </button>
          <button
            onClick={handlePrint}
            className="bg-accent text-accentInk px-5 py-2 text-sm font-semibold tracking-wide font-body hover:opacity-90 transition-opacity"
          >
            Print / Save as PDF
          </button>
        </div>

        {/* live rate-check tool — hidden on print, only useful pre-negotiation */}
        {!isStop && (
          <div className="border border-rule bg-bg px-5 py-4 mb-5 print:hidden">
            <label className="text-[.72rem] uppercase tracking-[.08em] text-muted font-body block mb-2">
              What rate did the lender quote you?
            </label>
            <div className="flex gap-3 items-center">
              <input
                type="number"
                value={quotedRate}
                onChange={(e) => setQuotedRate(e.target.value)}
                placeholder="e.g. 14"
                className="border-0 border-b-2 border-rule focus:border-accent focus:outline-none font-mono text-xl w-24 bg-transparent py-1"
              />
              <span className="text-muted font-body">%</span>
            </div>
          </div>
        )}

        {/* the card itself */}
        <div className="bg-bg border border-ink px-8 py-9 print:border-0 print:px-0">
          <div className="flex items-center justify-between border-b border-rule pb-4 mb-6">
            <div>
              <p className="text-[.7rem] font-semibold tracking-[.14em] uppercase text-muted font-body">
                Negotiation Card
              </p>
              <h1 className="font-display font-medium text-[1.5rem] text-ink mt-1">
                What's fair for this loan
              </h1>
            </div>
            <p className="text-[.75rem] text-muted font-mono">
              {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
          </div>

          {/* verdict strip */}
          <div className="mb-7">
            <p className="text-[.7rem] uppercase tracking-[.08em] text-muted font-body mb-1">Verdict</p>
            <p className="font-display font-medium text-[1.25rem] text-accent">
              {VERDICT_LABEL[verdict.verdict]}
            </p>
            <p className="text-[.85rem] text-muted font-body mt-1">{verdict.reason}</p>
          </div>

          {isStop ? (
            <div className="bg-bg2 border-l-2 border-ink px-5 py-4">
              <p className="font-body text-[.95rem] text-ink">
                This card isn't for negotiating a rate right now — it's to explain, if needed,
                why taking on new debt isn't advisable at this time. Show the reason above to
                whoever's asking.
              </p>
            </div>
          ) : (
            <>
              {/* HEADLINE COMPARISON — the core "lender quotes X, fair is Y" moment */}
              <div className="bg-accentSoft border border-accent px-6 py-5 mb-7">
                {hasQuote ? (
                  <>
                    <p className="text-[.7rem] uppercase tracking-[.08em] text-muted font-body mb-2">
                      They quoted {quoted}%
                    </p>
                    <p className="font-display font-medium text-[1.35rem] text-accent leading-tight mb-2">
                      {isOverFair
                        ? `Fair for your profile is ${rateband.rateMin}%–${rateband.rateMax}%`
                        : `That's within the fair range (${rateband.rateMin}%–${rateband.rateMax}%)`}
                    </p>
                    {isOverFair && (
                      <p className="text-[.88rem] text-ink/80 font-body">
                        That's <b>{gapPt}pt higher</b> than fair — roughly{" "}
                        <b>{inr(extraMonthlyCost)} extra every month</b> at your recommended
                        loan amount. Ask them to match {rateband.rateMax}% or explain the gap.
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-[.7rem] uppercase tracking-[.08em] text-muted font-body mb-2">
                      Fair rate for your profile
                    </p>
                    <p className="font-display font-medium text-[1.35rem] text-accent leading-tight">
                      {rateband.rateMin}% – {rateband.rateMax}%
                    </p>
                  </>
                )}
              </div>

              {/* the four facts in a tight grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-5 mb-7">
                <Fact label="Loan asked" value={inr(answers.amountWanted)} />
                <Fact label="Safe to carry" value={inr(affordability.safeMax)} strong />
                <Fact label="Fair rate range" value={`${rateband.rateMin}% – ${rateband.rateMax}%`} strong />
                <Fact label="All-in APR" value={`${rateband.apr}%`} />
                <Fact label="EMI ceiling" value={`${inr(emi.emiCeiling)}/mo`} strong />
                <Fact label="Tenure" value={`${answers.tenureMonths} months`} />
              </div>

              {/* why, per fact */}
              <div className="space-y-3 mb-7 border-t border-rule pt-5">
                <WhyLine label="Why this amount">{affordability.reason}</WhyLine>
                <WhyLine label="Why this rate">{rateband.reason}</WhyLine>
                <WhyLine label="Why this EMI">{emi.reason}</WhyLine>
              </div>

              {/* negotiation scripts — the actual ammunition */}
              <div className="mb-7">
                <p className="text-[.7rem] uppercase tracking-[.08em] text-muted font-body mb-3">
                  What to say
                </p>
                <div className="space-y-3">
                  <ScriptLine trigger="If they quote above your fair range">
                    "Based on my income and profile, a fair rate here is {rateband.rateMin}%–
                    {rateband.rateMax}%. Can you explain what's pushing your quote above that?"
                  </ScriptLine>

                  {affordability.collateralMax && (
                    <ScriptLine trigger="If they undersize the loan amount">
                      "I can offer {inr(answers.collateralValue)} in collateral, which should
                      support a sanction closer to {inr(affordability.collateralMax)} — why is
                      the offer lower than that?"
                    </ScriptLine>
                  )}

                  <ScriptLine trigger="If they push processing fees or add-ons">
                    "Please quote me the all-in APR including every fee, not just the headline
                    rate — mine works out to {rateband.apr}% including charges. Match that or
                    show me why yours is higher."
                  </ScriptLine>

                  <ScriptLine trigger="If they push a higher EMI or shorter tenure">
                    "I can't safely commit above {inr(emi.emiCeiling)}/month — that's based on
                    my actual income, not what I could technically qualify for. Let's find a
                    tenure that keeps us at or under that."
                  </ScriptLine>
                </div>
              </div>

              {/* stress test as leverage */}
              <div className="bg-bg2 border-l-2 border-ink px-5 py-4 mb-7">
                <p className="text-[.7rem] uppercase tracking-[.08em] text-muted font-body mb-1.5">
                  If they ask "why not stretch a bit more"
                </p>
                <p className="font-body text-[.9rem] text-ink">
                  "If my income dropped 20% or rates rose 2 points, my EMI would become{" "}
                  {inr(emi.stressCase.stressedEMI)} — {emi.stressCase.survivable
                    ? "that's still manageable, so I have some room, but not much more than this."
                    : "that would already be unsafe, so I'm not willing to go higher than my ceiling."}"
                </p>
              </div>
            </>
          )}

          <p className="text-[.72rem] text-muted font-body mt-6 pt-4 border-t border-rule">
            Generated by Borrower Copilot from your own answers — not a bureau report or a
            lender offer. Confidence:{" "}
            {affordability.confidence >= 0.8
              ? "High"
              : affordability.confidence >= 0.55
              ? "Medium"
              : "Low, based on limited detail provided"}
            .
          </p>
        </div>
      </div>
    </div>
  );
}

function Fact({ label, value, strong }) {
  return (
    <div>
      <p className="text-[.7rem] uppercase tracking-[.08em] text-muted font-body mb-1">{label}</p>
      <p className={`font-mono ${strong ? "text-xl text-accent" : "text-lg text-ink"}`}>{value}</p>
    </div>
  );
}

function WhyLine({ label, children }) {
  return (
    <div>
      <p className="text-[.72rem] font-semibold text-ink font-body">{label}</p>
      <p className="text-[.85rem] text-muted font-body leading-snug">{children}</p>
    </div>
  );
}

function ScriptLine({ trigger, children }) {
  return (
    <div className="border-l-2 border-accent pl-4">
      <p className="text-[.72rem] font-semibold text-muted font-body uppercase tracking-[.04em] mb-1">
        {trigger}
      </p>
      <p className="font-body text-[.9rem] text-ink italic">"{children}"</p>
    </div>
  );
}