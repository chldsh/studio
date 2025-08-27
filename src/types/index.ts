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
