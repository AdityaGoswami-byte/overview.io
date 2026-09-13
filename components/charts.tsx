'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const DEFAULT_COLORS = ['#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#0071E3', '#34C759', '#FF9500'];

export function ExpensesPieChart({ data, colors }: { data: Record<string, number>, colors?: Record<string, string> }) {
  const chartData = Object.entries(data).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);

  if (chartData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-gray-400">
        No expenses to show
      </div>
    );
  }

  return (
    <div className="h-full w-full min-h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {chartData.map((entry, index) => {
              const color = colors?.[entry.name] || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
              return <Cell key={`cell-${index}`} fill={color} />;
            })}
          </Pie>
          <Tooltip 
            formatter={(value: any) => `₹${Number(value).toFixed(2)}`}
            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MonthlyBarChart({ data }: { data: any[] }) {
  if (data.every(d => d.income === 0 && d.expense === 0)) {
    return (
      <div className="h-full flex items-center justify-center text-sm text-gray-400 min-h-[250px]">
        No data for this year
      </div>
    );
  }

  return (
    <div className="h-full w-full min-h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} tickFormatter={(val) => `₹${val}`} />
          <Tooltip
            cursor={{ fill: '#f5f5f7' }}
            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
            formatter={(value: any) => `₹${Number(value).toFixed(2)}`}
          />
          <Bar dataKey="income" name="Income" fill="#34C759" radius={[4, 4, 0, 0]} barSize={8} />
          <Bar dataKey="expense" name="Expense" fill="#000000" radius={[4, 4, 0, 0]} barSize={8} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
