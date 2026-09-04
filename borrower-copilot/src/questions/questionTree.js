// src/questions/questionTree.js

export const MUST_QUESTIONS = [
  { id: "age", label: "Your age", type: "number", feeds: "age" },
  {
    id: "incomeType",
    label: "How do you earn?",
    type: "select",
    options: [
      { value: "salaried", label: "Salaried" },
      { value: "self_employed", label: "Self-employed / business owner" },
      { value: "informal", label: "Informal / gig / daily wage" },
    ],
    feeds: "incomeType",
  },
  { id: "netMonthlyIncome", label: "Your net monthly income (₹)", type: "number", feeds: "netMonthlyIncome" },
  {
    id: "existingEMIs",
    label: "Total existing EMIs / loan payments per month (₹)",
    type: "number",
    feeds: "existingEMIs",
    defaultValue: 0,
  },
  { id: "householdExpenses", label: "Monthly household expenses (₹)", type: "number", feeds: "householdExpenses" },
  {
    id: "loanType",
    label: "What kind of loan is this?",
    type: "select",
    options: [
      { value: "personal", label: "Personal loan" },
      { value: "gold", label: "Gold loan" },
      { value: "two_wheeler", label: "Two-wheeler loan" },
      { value: "home", label: "Home loan" },
      { value: "lap", label: "Loan against property" },
      { value: "business", label: "Business loan" },
    ],
    feeds: "loanType",
  },
  { id: "amountWanted", label: "How much do you want to borrow (₹)?", type: "number", feeds: "amountWanted" },
  {
    id: "tenureMonths",
    label: "Preferred repayment period (months)",
    type: "number",
    feeds: "tenureMonths",
    defaultValue: 36,
  },
  {
    id: "creditScore",
    label: "Your credit score, if you know it",
    type: "number_or_unknown",
    feeds: "creditScore",
    defaultValue: null,
  },
];

export const ADDITIONAL_QUESTIONS = [
  // ---- Applies to everyone ----
  {
    id: "hasHighCostDebt",
    label: "Do you have any existing loans at high interest (e.g. app loans, informal lenders, 24%+)?",
    type: "boolean",
    appliesWhen: () => true,
    feeds: "hasHighCostDebt",
  },
  {
    id: "recentBounce",
    label: "Have you missed or bounced a loan/EMI payment in the last 6 months?",
    type: "boolean",
    appliesWhen: () => true,
    feeds: "recentBounce",
  },
  {
    id: "savingsMonths",
    label: "How many months of expenses do you have in savings?",
    type: "number",
    appliesWhen: () => true,
    feeds: "savingsMonths",
  },
  {
    id: "dependents",
    label: "How many people depend on your income (children, elderly parents, etc.)?",
    type: "number",
    appliesWhen: () => true,
    feeds: "dependents",
    defaultValue: 0,
  },
  {
    id: "coApplicant",
    label: "Is there a co-applicant with additional income?",
    type: "boolean",
    appliesWhen: () => true,
    feeds: "coApplicant",
  },
  {
    id: "coApplicantIncome",
    label: "Roughly what does your co-applicant earn per month (₹)?",
    type: "number",
    appliesWhen: (answers) => answers.coApplicant === true,
    feeds: "coApplicantIncome",
  },
  {
    id: "hasExistingOffer",
    label: "Has a lender already quoted you a rate?",
    type: "boolean",
    appliesWhen: () => true,
    feeds: "hasExistingOffer",
  },
  {
    id: "existingOfferRate",
    label: "What rate did they quote (%)?",
    type: "number",
    appliesWhen: (answers) => answers.hasExistingOffer === true,
    feeds: "existingOfferRate",
  },

  // ---- Self-employed / informal only ----
  {
    id: "actualMonthlyIncome",
    label: "What do you actually take home monthly, including any cash income not on paper?",
    type: "number",
    appliesWhen: (answers) => answers.incomeType !== "salaried",
    feeds: "actualMonthlyIncome",
  },
  {
    id: "hasCollateral",
    label: "Do you own any property or asset you could offer as security?",
    type: "boolean",
    appliesWhen: (answers) => answers.incomeType !== "salaried",
    feeds: "hasCollateral",
  },
  {
    id: "collateralValue",
    label: "Estimated value of that property/asset (₹)",
    type: "number",
    appliesWhen: (answers) => answers.hasCollateral === true,
    feeds: "collateralValue",
  },
  {
    id: "variableIncomeShare",
    label: "Roughly what share of your income varies month to month?",
    type: "select",
    options: [
      { value: "low", label: "Mostly steady" },
      { value: "medium", label: "Somewhat variable" },
      { value: "high", label: "Highly variable" },
    ],
    appliesWhen: (answers) => answers.incomeType !== "salaried",
    feeds: "variableIncomeShare",
  },

  // ---- Salaried only ----
  {
    id: "cardUtilisation",
    label: "Roughly what % of your credit card limit do you usually carry?",
    type: "select",
    options: [
      { value: "low", label: "Under 30%" },
      { value: "medium", label: "30-70%" },
      { value: "high", label: "Over 70%" },
    ],
    appliesWhen: (answers) => answers.incomeType === "salaried",
    feeds: "cardUtilisation",
  },
];