'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Category, Transaction } from '@/types/finance';
import { X, Sparkles, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (tx: Omit<Transaction, 'id'>) => void;
}

const CATEGORIES: Category[] = [
  'Housing', 'Food', 'Transportation', 'Entertainment', 'Shopping', 'Utilities', 'Health', 'Other'
];

export function TransactionModal({ isOpen, onClose, onAdd }: Props) {
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('Food');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [smartInput, setSmartInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [smartError, setSmartError] = useState('');

  const handleSmartEntry = async () => {
    if (!smartInput.trim()) return;
    setIsProcessing(true);
    setSmartError('');
    try {
      const res = await fetch('/api/smart-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: smartInput })
      });
      if (!res.ok) throw new Error('Failed to parse input');
      const data = await res.json();
      
      setTitle(data.title);
      setAmount(data.amount.toString());
      if (CATEGORIES.includes(data.category)) {
        setCategory(data.category as Category);
      } else {
        setCategory('Other');
      }
      if (data.type === 'expense' || data.type === 'income') {
        setType(data.type);
      }
      if (data.date) {
        setDate(data.date);
      }
      setSmartInput('');
    } catch (err) {
      console.error(err);
      setSmartError('Could not understand. Try being more specific like "Spent 450 on coffee today".');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !title) return;
    
    onAdd({
      type,
      amount: parseFloat(amount),
      title,
      category: type === 'expense' ? category : 'Other',
      date: new Date(date).toISOString(),
    });
    
    setTitle('');
    setAmount('');
    setSmartInput('');
    setSmartError('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            className="fixed inset-x-4 bottom-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-50 md:w-full md:max-w-md bg-white rounded-[2rem] shadow-2xl p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold tracking-tight">Add Transaction</h2>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 -mr-2 text-gray-400 hover:text-black">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="mb-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Sparkles className="h-4 w-4 text-[#0071E3]" />
                </div>
                <Input 
                  value={smartInput}
                  onChange={(e) => setSmartInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSmartEntry();
                    }
                  }}
                  placeholder="e.g. Spent 450 on coffee today" 
                  className="pl-9 pr-12 bg-gray-50/50 border-gray-200/60 focus-visible:ring-[#0071E3]/20"
                />
                <div className="absolute inset-y-0 right-1.5 flex items-center">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={handleSmartEntry}
                    disabled={isProcessing || !smartInput.trim()}
                    className="h-7 px-2 text-xs text-[#0071E3] hover:text-[#0071E3] hover:bg-[#0071E3]/10"
                  >
                    {isProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Parse'}
                  </Button>
                </div>
              </div>
              {smartError && <p className="text-xs text-red-500 mt-2">{smartError}</p>}
            </div>
            
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-100" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-400">Or enter manually</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex bg-gray-100 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`flex-1 py-2 text-sm font-medium rounded-xl transition-all ${type === 'expense' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={`flex-1 py-2 text-sm font-medium rounded-xl transition-all ${type === 'income' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}
                >
                  Income
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₹</span>
                  <Input 
                    type="number" 
                    step="0.01" 
                    min="0"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00" 
                    className="pl-8 text-lg font-medium" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">Title</label>
                <Input 
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Whole Foods" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {type === 'expense' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">Category</label>
                    <div className="relative">
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as Category)}
                        className="flex h-12 w-full appearance-none rounded-2xl border border-gray-200 bg-white/50 px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black transition-colors"
                      >
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>
                )}
                <div className={type === 'income' ? 'col-span-2' : ''}>
                  <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">Date</label>
                  <Input 
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full mt-6 h-14 text-base">
                Save {type === 'expense' ? 'Expense' : 'Income'}
              </Button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
