export type Expense = {
  id: string;
  category: string;
  amount: number;
  date: Date;
};

export type Budget = {
  id: string;
  category: string;
  amount: number;
};

export type OptimizedBudget = {
  category: string;
  suggestedBudget: string;
};

export type BillExplanation = {
  vendor: string;
  totalAmount: number;
  category: string;
  explanation: string;
  suggestions: string;
  audioDataUri: string;
};

export type JournalEntry = {
  id: string;
  title: string;
  content: string;
  date: Date;
};
