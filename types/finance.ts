export type Category = 
  | 'Housing'
  | 'Food'
  | 'Transportation'
  | 'Entertainment'
  | 'Shopping'
  | 'Utilities'
  | 'Health'
  | 'Other';

export interface Transaction {
  id: string;
  amount: number;
  category: Category;
  date: string; // ISO string
  title: string;
  type: 'expense' | 'income';
}

export interface Budget {
  category: Category;
  limit: number;
  color?: string;
}

export interface FinanceData {
  transactions: Transaction[];
  budgets: Budget[];
}
