'use client';

import { useState, useEffect, useCallback } from 'react';
import { Transaction, Budget, FinanceData, Category } from '@/types/finance';
import { db, auth } from '@/lib/firebase';
import { collection, doc, query, onSnapshot, setDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_BUDGETS: Budget[] = [
  { category: 'Housing', limit: 20000, color: '#000000' },
  { category: 'Food', limit: 15000, color: '#333333' },
  { category: 'Transportation', limit: 5000, color: '#666666' },
  { category: 'Entertainment', limit: 4000, color: '#999999' },
  { category: 'Shopping', limit: 6000, color: '#CCCCCC' },
  { category: 'Utilities', limit: 4000, color: '#0071E3' },
  { category: 'Health', limit: 3000, color: '#34C759' },
  { category: 'Other', limit: 3000, color: '#FF9500' },
];

export function useFinance() {
  const [user, loadingUser] = useAuthState(auth);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>(DEFAULT_BUDGETS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (loadingUser) return;
    if (!user) {
      // User signed out, reset state
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTransactions([]);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBudgets(DEFAULT_BUDGETS);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoaded(true);
      return;
    }

    const uid = user.uid;
    const userDocRef = doc(db, 'users', uid);
    
    // Subscribe to budgets
    const unsubUser = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().budgets) {
        setBudgets(docSnap.data().budgets);
      } else {
        // Initialize user document with default budgets
        setDoc(userDocRef, { budgets: DEFAULT_BUDGETS, createdAt: new Date() }, { merge: true });
        setBudgets(DEFAULT_BUDGETS);
      }
    });

    // Subscribe to transactions
    const txQuery = query(collection(db, 'users', uid, 'transactions'), orderBy('date', 'desc'));
    const unsubTx = onSnapshot(txQuery, (snapshot) => {
      const txs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          amount: data.amount,
          category: data.category,
          date: data.date,
          title: data.title,
          type: data.type
        } as Transaction;
      });
      // Further sort in memory just in case 'date' is string representation of ISO
      txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(txs);
      setIsLoaded(true);
    });

    return () => {
      unsubUser();
      unsubTx();
    };
  }, [user, loadingUser]);

  const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id'>) => {
    if (!user) return;
    const id = uuidv4();
    const txRef = doc(db, 'users', user.uid, 'transactions', id);
    await setDoc(txRef, { ...transaction, createdAt: new Date() });
  }, [user]);

  const deleteTransaction = useCallback(async (id: string) => {
    if (!user) return;
    const txRef = doc(db, 'users', user.uid, 'transactions', id);
    await deleteDoc(txRef);
  }, [user]);

  const updateBudget = useCallback(async (category: Category, limit: number, color?: string) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    const updatedBudgets = budgets.map(b => {
      if (b.category === category) {
        return { ...b, limit: limit ?? b.limit, color: color ?? b.color };
      }
      return b;
    });
    // In case category wasn't there
    if (!updatedBudgets.find(b => b.category === category)) {
      updatedBudgets.push({ category, limit, color: color || '#000000' });
    }
    await setDoc(userDocRef, { budgets: updatedBudgets }, { merge: true });
  }, [user, budgets]);

  return {
    transactions,
    budgets,
    isLoaded: !loadingUser && isLoaded,
    addTransaction,
    deleteTransaction,
    updateBudget,
    user,
    loadingUser,
  };
}
