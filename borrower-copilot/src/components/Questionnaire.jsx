// src/components/Questionnaire.jsx
import { useState, useMemo } from "react";
import { MUST_QUESTIONS, ADDITIONAL_QUESTIONS } from "../questions/questionTree.js";

export default function Questionnaire({ onComplete }) {
  const [answers, setAnswers] = useState({});
  const [step, setStep] = useState(0);

  const applicableAdditional = useMemo(
    () => ADDITIONAL_QUESTIONS.filter((q) => q.appliesWhen(answers)),
    [answers]
  );

  const allQuestions = [...MUST_QUESTIONS, ...applicableAdditional];
  const current = allQuestions[step];
  const isLast = step === allQuestions.length - 1;
  const isMustPhase = step < MUST_QUESTIONS.length;

  function setAnswer(id, value) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function handleNext() {
    if (isLast) finalize();
    else setStep((s) => s + 1);
  }

  function handleBack() {
    if (step > 0) setStep((s) => s - 1);
  }

  function handleSkip() {
    if (!isMustPhase) {
      setAnswer(current.id, current.defaultValue ?? null);
      handleNext();
    }
  }

  function finalize() {
    const answeredOptionalCount = applicableAdditional.filter(
      (q) => answers[q.id] !== undefined && answers[q.id] !== null
    ).length;

    onComplete({
      ...answers,
      answeredOptionalCount,
      applicableOptionalCount: applicableAdditional.length,
    });
  }

  const value = answers[current.id];
  const canProceed = isMustPhase
    ? value !== undefined && value !== null && value !== ""
    : true;

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl">
        {/* eyebrow */}
        <p className="text-[.72rem] font-semibold tracking-[.14em] uppercase text-muted mb-3 font-body">
          Borrower Copilot
        </p>

        {/* card */}
        <div className="bg-bg border border-rule">
          {/* progress header */}
          <div className="flex items-center justify-between px-8 pt-7 pb-5 border-b border-rule">
            <span className="text-[.72rem] font-semibold tracking-[.1em] uppercase text-muted font-body">
              {isMustPhase ? "Basic details" : "Sharpening your numbers"}
            </span>
            <span className="text-[.72rem] font-mono text-muted">
              {String(step + 1).padStart(2, "0")} / {String(allQuestions.length).padStart(2, "0")}
            </span>
          </div>

          <div className="h-[3px] bg-rule">
            <div
              className="h-[3px] bg-accent transition-all duration-300 ease-out"
              style={{ width: `${((step + 1) / allQuestions.length) * 100}%` }}
            />
          </div>

          {/* question body */}
          <div className="px-8 py-10 min-h-[280px] flex flex-col justify-center">
            <h2 className="font-display font-medium text-[1.9rem] leading-[1.15] mb-8 text-ink text-balance">
              {current.label}
            </h2>

            <QuestionInput question={current} value={value} onChange={(v) => setAnswer(current.id, v)} />
          </div>

          {/* nav footer */}
          <div className="flex items-center gap-5 px-8 py-5 border-t border-rule bg-bg2">
            {step > 0 ? (
              <button
                onClick={handleBack}
                className="text-sm text-muted hover:text-ink transition-colors font-body"
              >
                ← Back
              </button>
            ) : (
              <span />
            )}

            <div className="flex-1" />

            {!isMustPhase && (
              <button
                onClick={handleSkip}
                className="text-sm text-muted hover:text-ink underline underline-offset-4 decoration-rule hover:decoration-ink transition-colors font-body"
              >
                Skip this
              </button>
            )}

            <button
              onClick={handleNext}
              disabled={!canProceed}
              className="bg-accent text-accentInk px-6 py-2.5 text-sm font-semibold tracking-wide font-body disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            >
              {isLast ? "See my results →" : "Continue"}
            </button>
          </div>
        </div>

        {/* reassurance footer */}
        <p className="text-center text-[.8rem] text-muted mt-5 font-body">
          No login, no bureau pull, nothing stored.
        </p>
      </div>
    </div>
  );
}

function QuestionInput({ question, value, onChange }) {
  switch (question.type) {
    case "number":
      return (
        <div className="flex items-baseline gap-2 border-b-2 border-rule focus-within:border-accent transition-colors">
          {question.prefix && <span className="text-2xl font-mono text-muted">{question.prefix}</span>}
          <input
            type="number"
            className="w-full bg-transparent border-0 focus:outline-none text-3xl font-mono py-2 text-ink placeholder:text-muted/40"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="0"
            autoFocus
          />
        </div>
      );

    case "number_or_unknown":
      return (
        <div>
          <input
            type="number"
            className="w-full bg-transparent border-0 border-b-2 border-rule focus:border-accent focus:outline-none text-3xl font-mono py-2 text-ink placeholder:text-muted/40 transition-colors mb-4"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="e.g. 750"
            autoFocus
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            className={`text-sm underline underline-offset-4 transition-colors font-body ${
              value === null ? "text-accent font-semibold decoration-accent" : "text-muted decoration-rule hover:text-ink"
            }`}
          >
            I don't know my score
          </button>
        </div>
      );

    case "boolean":
      return (
        <div className="flex gap-3">
          {[{ v: true, label: "Yes" }, { v: false, label: "No" }].map((opt) => (
            <button
              key={String(opt.v)}
              type="button"
              onClick={() => onChange(opt.v)}
              className={`flex-1 py-3.5 text-sm font-semibold font-body border transition-all ${
                value === opt.v
                  ? "bg-accent text-accentInk border-accent"
                  : "border-rule text-ink hover:border-accent"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      );

    case "select":
      return (
        <div className="flex flex-col gap-2.5">
          {question.options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`text-left px-5 py-3.5 text-[.95rem] font-body border transition-all flex items-center justify-between group ${
                value === opt.value
                  ? "bg-accentSoft border-accent text-ink font-semibold"
                  : "border-rule text-ink hover:border-accent/60 hover:bg-bg2"
              }`}
            >
              <span>{opt.label}</span>
              <span
                className={`w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center transition-colors ${
                  value === opt.value ? "border-accent" : "border-rule"
                }`}
              >
                {value === opt.value && <span className="w-2 h-2 rounded-full bg-accent" />}
              </span>
            </button>
          ))}
        </div>
      );

    default:
      return null;
  }
}