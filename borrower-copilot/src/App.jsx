// src/App.jsx
import { useState } from "react";
import Questionnaire from "./components/Questionnaire.jsx";
import ResultsScreen from "./components/ResultsScreen.jsx";

import { computeVerdict } from "./rules/verdict.js";
import { computeAffordability } from "./rules/affordability.js";
import { computeRateBand } from "./rules/rateband.js";
import { computeEMI } from "./rules/emi.js";

export default function App() {
  const [stage, setStage] = useState("intro"); // "intro" | "questions" | "results"
  const [results, setResults] = useState(null);
  const [rawAnswers, setRawAnswers] = useState(null);

  function handleComplete(answers) {
    const verdict = computeVerdict(answers);
    const affordability = computeAffordability(answers);
    const rateband = computeRateBand(answers);
    const emi = computeEMI(answers, affordability, rateband);

    setRawAnswers(answers);
    setResults({ verdict, affordability, rateband, emi });
    setStage("results");
  }

  function handleRestart() {
    setStage("intro");
    setResults(null);
    setRawAnswers(null);
  }

  if (stage === "intro") {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl text-center">
          <p className="text-[.72rem] font-semibold tracking-[.14em] uppercase text-muted mb-4 font-body">
            Lokta · Borrower Copilot
          </p>
          <h1 className="font-display font-medium text-[2.4rem] leading-[1.1] mb-5 text-ink">
            Know what's fair, <em className="italic text-accent">before you walk in.</em>
          </h1>
          <p className="text-muted font-body text-[1.05rem] max-w-md mx-auto mb-9">
            Answer a few questions about your income and the loan you want. Get a straight
            answer on whether to borrow, how much, at what rate, and what EMI to agree to.
          </p>
          <button
            onClick={() => setStage("questions")}
            className="bg-accent cursor-pointer text-accentInk px-7 py-3 text-sm font-semibold tracking-wide font-body hover:opacity-90 transition-opacity"
          >
            Start
          </button>
          <p className="text-[.8rem] text-muted mt-5 font-body">
            No login, no bureau pull, nothing stored.
          </p>
        </div>
      </div>
    );
  }

  if (stage === "questions") {
    return <Questionnaire onComplete={handleComplete} />;
  }

  if (stage === "results") {
    return <ResultsScreen answers={rawAnswers} results={results} onRestart={handleRestart} />;
  }

  return null;
}