// Client-safe display list for the "Ask your life" suggestion chips.
// No node imports here so it can be bundled for the browser.
export type SuggestedQuestion = {
  id: string;
  question: string;
  emoji: string;
};

export const SUGGESTED_QUESTIONS: SuggestedQuestion[] = [
  { id: "money-this-week", question: "What is costing me money this week?", emoji: "💸" },
  { id: "duplicate-charges", question: "Am I being double-charged anywhere?", emoji: "🪞" },
  { id: "blocking-documents", question: "Which missing document is blocking the most deadlines?", emoji: "🧩" },
  { id: "renewals", question: "What subscriptions or trials are about to renew?", emoji: "🔄" }
];
