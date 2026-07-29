// src/components/dashboard/PeriodSelector.jsx
import React from 'react';

const periods = [
  { value: 'today', label: "Aujourd'hui" },
  { value: 'week', label: 'Cette semaine' },
  { value: 'month', label: 'Ce mois' },
  { value: 'quarter', label: 'Ce trimestre' },
  { value: 'year', label: 'Cette année' }
];

const PeriodSelector = ({ currentPeriod, onPeriodChange }) => {
  return (
    <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 p-1 shadow-sm">
      {periods.map((p) => (
        <button
          key={p.value}
          onClick={() => onPeriodChange(p.value)}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            currentPeriod === p.value
              ? 'bg-primary text-white shadow-lg shadow-primary/20'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
};

export default PeriodSelector;