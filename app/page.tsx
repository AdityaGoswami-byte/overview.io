'use client';

import { useState, useMemo } from 'react';
import { useFinance } from '@/hooks/use-finance';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TransactionModal } from '@/components/transaction-modal';
import { ExpensesPieChart, MonthlyBarChart } from '@/components/charts';
import { Plus, ArrowUpRight, ArrowDownRight, Wallet, Home, Coffee, Car, Film, ShoppingBag, Zap, Activity, MoreHorizontal, CreditCard, X, LogIn, LogOut, Download, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { format, parseISO, isSameMonth, isSameYear } from 'date-fns';
import { Category } from '@/types/finance';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

const CategoryIcon = ({ category }: { category: Category }) => {
  const props = { className: "w-5 h-5" };
  switch (category) {
    case 'Housing': return <Home {...props} />;
    case 'Food': return <Coffee {...props} />;
    case 'Transportation': return <Car {...props} />;
    case 'Entertainment': return <Film {...props} />;
    case 'Shopping': return <ShoppingBag {...props} />;
    case 'Utilities': return <Zap {...props} />;
    case 'Health': return <Activity {...props} />;
    default: return <MoreHorizontal {...props} />;
  }
};

type Timeframe = 'month' | 'year' | 'all';

export default function Dashboard() {
  const { 
    isLoaded, 
    transactions, 
    budgets,
    addTransaction,
    deleteTransaction,
    updateBudget,
    user,
    loadingUser
  } = useFinance();
  
  const [isModalOpen, setModalOpen] = useState(false);
  const [timeframe, setTimeframe] = useState<Timeframe>('month');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Search and Advanced Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const handleLogin = () => signInWithPopup(auth, new GoogleAuthProvider());
  const handleLogout = () => signOut(auth);

  const categoryColors = useMemo(() => {
    const map: Record<string, string> = {};
    budgets.forEach(b => {
      if (b.color) map[b.category] = b.color;
    });
    return map;
  }, [budgets]);

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter(t => {
      const d = parseISO(t.date);
      let match = true;

      // Base timeframe
      if (timeframe === 'month') match = match && isSameMonth(d, now);
      else if (timeframe === 'year') match = match && isSameYear(d, now);
      
      // Category 
      if (selectedCategory) match = match && t.category === selectedCategory;

      // Search Query
      if (searchQuery) match = match && t.title.toLowerCase().includes(searchQuery.toLowerCase());

      // Amount Range
      if (minAmount) match = match && t.amount >= parseFloat(minAmount);
      if (maxAmount) match = match && t.amount <= parseFloat(maxAmount);

      // Date Range
      if (startDate) match = match && t.date >= startDate;
      if (endDate) match = match && t.date.split('T')[0] <= endDate;

      return match;
    });
  }, [transactions, timeframe, selectedCategory, searchQuery, minAmount, maxAmount, startDate, endDate]);

  const chartTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter(t => {
      const d = parseISO(t.date);
      if (timeframe === 'month') return isSameMonth(d, now);
      if (timeframe === 'year') return isSameYear(d, now);
      return true;
    });
  }, [transactions, timeframe]);

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);
  const budgetMultiplier = timeframe === 'year' ? 12 : timeframe === 'all' ? 12 : 1; 
  const adjustedBudget = totalBudget * budgetMultiplier;

  const expensesByCategory = chartTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const yearlyBarData = useMemo(() => {
    if (timeframe !== 'year') return [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = months.map(month => ({ month, income: 0, expense: 0 }));
    
    chartTransactions.forEach(t => {
      const monthIndex = parseISO(t.date).getMonth();
      if (t.type === 'income') data[monthIndex].income += t.amount;
      else data[monthIndex].expense += t.amount;
    });
    return data;
  }, [chartTransactions, timeframe]);

  const handleExportCSV = () => {
    const header = ['Date', 'Title', 'Category', 'Type', 'Amount'];
    const rows = filteredTransactions.map(t => [
      format(parseISO(t.date), 'yyyy-MM-dd'),
      `"${t.title.replace(/"/g, '""')}"`,
      t.category,
      t.type,
      t.amount.toString()
    ]);
    const csvContent = [header, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `transactions_${timeframe}${selectedCategory ? `_${selectedCategory}` : ''}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loadingUser || !isLoaded) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-black text-white rounded-3xl flex items-center justify-center shadow-xl shadow-black/20 mb-8">
          <Wallet className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-black mb-3">Expense Tracker</h1>
        <p className="text-gray-500 text-lg mb-10 max-w-sm">Sign in to track your personal spending and manage your budgets securely.</p>
        <Button onClick={handleLogin} size="lg" className="h-14 px-8 text-base shadow-lg">
          <LogIn className="w-5 h-5 mr-2" />
          Continue with Google
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] font-sans selection:bg-black selection:text-white pb-32 md:pb-12">
      <header className="px-6 py-10 md:py-14 max-w-5xl mx-auto flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-black mb-2">Overview</h1>
            <p className="text-gray-500 text-lg">Track your spending, beautifully.</p>
          </div>
          <div className="flex flex-col items-end gap-4">
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-500 hover:text-black">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
            <div className="flex bg-gray-200/60 p-1 rounded-2xl w-fit shadow-inner">
              {(['month', 'year', 'all'] as Timeframe[]).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTimeframe(t); setSelectedCategory(null); }}
                  className={`relative px-5 py-2 text-sm font-medium rounded-xl capitalize transition-colors ${timeframe === t ? 'text-black' : 'text-gray-500 hover:text-black'}`}
                >
                  {timeframe === t && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-white rounded-xl shadow-sm"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10">{t === 'all' ? 'All Time' : `This ${t}`}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 space-y-8">
        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 md:col-span-1 bg-black text-white border-transparent shadow-xl shadow-black/10 transition-all hover:scale-[1.02]">
            <div className="flex items-center gap-3 text-white/60 mb-8">
              <Wallet className="w-5 h-5" />
              <h3 className="font-medium">Total Balance</h3>
            </div>
            <div className="text-4xl lg:text-5xl font-semibold tracking-tight">₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-white/40 text-sm mt-3 capitalize">{timeframe === 'all' ? 'Lifetime' : `This ${timeframe}`}</p>
          </Card>
          
          <Card className="p-6 transition-all hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3 text-gray-500">
                <ArrowDownRight className="w-5 h-5" />
                <h3 className="font-medium">Income</h3>
              </div>
            </div>
            <div className="text-3xl lg:text-4xl font-semibold tracking-tight text-gray-900">₹{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </Card>

          <Card className="p-6 transition-all hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3 text-gray-500">
                <ArrowUpRight className="w-5 h-5" />
                <h3 className="font-medium">Spent</h3>
              </div>
            </div>
            <div className="text-3xl lg:text-4xl font-semibold tracking-tight text-gray-900">₹{totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="mt-4 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((totalExpenses / (adjustedBudget || 1)) * 100, 100)}%` }}
                className="bg-black h-1.5 rounded-full" 
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            <p className="text-gray-400 text-xs mt-2">of ₹{adjustedBudget.toLocaleString('en-IN')} budget</p>
          </Card>
        </div>

        {/* Charts and Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
            <Card className="p-6 flex flex-col h-full min-h-[400px]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold tracking-tight">Spending Categories</h3>
                {selectedCategory && (
                   <Button variant="ghost" size="sm" onClick={() => setSelectedCategory(null)} className="h-6 px-2 text-xs">Clear Filter</Button>
                )}
              </div>
              <div className="flex-1 min-h-[250px]">
                <ExpensesPieChart data={expensesByCategory} colors={categoryColors} />
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-3 mt-6">
                {Object.entries(expensesByCategory).sort((a,b) => b[1] - a[1]).map(([cat, amount], i) => (
                  <div key={cat} className="flex items-center gap-1">
                    <button 
                      onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat as Category)}
                      className={`flex-1 flex items-center gap-2 p-1.5 rounded-lg transition-colors text-left ${selectedCategory === cat ? 'bg-gray-100 ring-1 ring-gray-200' : 'hover:bg-gray-50'}`}
                    >
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: categoryColors[cat] || '#CCC' }} />
                      <div className="flex-1 truncate text-xs text-gray-600 font-medium">{cat}</div>
                    </button>
                    <div className="relative w-5 h-5 shrink-0 rounded-full overflow-hidden border border-gray-200" title="Change category color">
                      <input 
                        type="color" 
                        value={categoryColors[cat] || '#000000'}
                        onChange={(e) => updateBudget(cat as Category, budgets.find(b => b.category === cat)?.limit || 0, e.target.value)}
                        className="absolute -top-2 -left-2 w-10 h-10 p-0 border-0 bg-transparent cursor-pointer" 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <AnimatePresence mode="wait">
              {timeframe === 'year' && !selectedCategory && (
                <motion.div
                  key="yearly-chart"
                  initial={{ opacity: 0, height: 0, y: -20 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="p-6 mb-8">
                    <h3 className="text-lg font-semibold tracking-tight mb-6">Yearly Overview</h3>
                    <div className="h-[250px]">
                      <MonthlyBarChart data={yearlyBarData} />
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            <Card className="p-6 min-h-[500px]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-semibold tracking-tight">
                    {selectedCategory ? `${selectedCategory} History` : 'Transactions'}
                  </h3>
                  <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full mt-2 inline-block">{filteredTransactions.length} items</span>
                </div>
                <Button variant="secondary" size="sm" onClick={handleExportCSV} disabled={filteredTransactions.length === 0}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>

              {/* Filter / Search Bar */}
              <div className="mb-6 space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Search transactions..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/5 transition-all"
                    />
                  </div>
                  <Button 
                    variant={showFilters || minAmount || maxAmount || startDate || endDate ? "default" : "outline"}
                    className="shrink-0"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                    {showFilters ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                  </Button>
                </div>
                
                <AnimatePresence>
                  {showFilters && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 bg-gray-50 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-4 border border-gray-100">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Range (₹)</label>
                          <div className="flex items-center gap-2">
                            <input 
                              type="number" 
                              placeholder="Min" 
                              value={minAmount}
                              onChange={e => setMinAmount(e.target.value)}
                              className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm"
                            />
                            <span className="text-gray-400">-</span>
                            <input 
                              type="number" 
                              placeholder="Max" 
                              value={maxAmount}
                              onChange={e => setMaxAmount(e.target.value)}
                              className="w-full px-3 py-1.5 border border-gray-200 rounded-md text-sm"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Date Interval</label>
                          <div className="flex items-center gap-2">
                            <input 
                              type="date" 
                              value={startDate}
                              onChange={e => setStartDate(e.target.value)}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-sm"
                            />
                            <span className="text-gray-400">-</span>
                            <input 
                              type="date" 
                              value={endDate}
                              onChange={e => setEndDate(e.target.value)}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <div className="space-y-3">
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                      <Search className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-gray-900 font-medium text-lg">No transactions found</p>
                    <p className="text-sm text-gray-500 mt-1">Try adjusting your filters or search terms.</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {filteredTransactions.slice(0, timeframe === 'month' ? 30 : 15).map((tx) => (
                      <motion.div 
                        key={tx.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center justify-between p-4 rounded-2xl bg-white/40 hover:bg-white shadow-sm border border-gray-100/50 hover:border-gray-200 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm`} style={{ backgroundColor: tx.type === 'expense' ? `${categoryColors[tx.category]}20` : '#34C75920', color: tx.type === 'expense' ? categoryColors[tx.category] : '#34C759' }}>
                            {tx.type === 'expense' ? <CategoryIcon category={tx.category} /> : <ArrowDownRight className="w-5 h-5" />}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{tx.title}</h4>
                            <p className="text-xs text-gray-500 mt-0.5">{format(parseISO(tx.date), 'MMM d, yyyy')} • {tx.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`font-semibold tracking-tight ${tx.type === 'expense' ? 'text-gray-900' : 'text-[#34C759]'}`}>
                            {tx.type === 'expense' ? '-' : '+'}₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <button 
                            onClick={() => deleteTransaction(tx.id)}
                            className="opacity-0 md:opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all w-8 h-8 flex items-center justify-center focus:opacity-100 bg-white rounded-full shadow-sm"
                            aria-label="Delete transaction"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button 
            size="lg" 
            className="shadow-2xl shadow-black/20 h-14 px-8 text-base rounded-full backdrop-blur-md"
            onClick={() => setModalOpen(true)}
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Transaction
          </Button>
        </motion.div>
      </div>

      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setModalOpen(false)} 
        onAdd={addTransaction}
      />
    </div>
  );
}
