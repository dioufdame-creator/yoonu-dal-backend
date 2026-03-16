import React, { useState } from 'react';
import ExpensesPage from './expenses/ExpensesPage';
import IncomesPage from './incomes/IncomesPage';

const TransactionsPage = ({ onNavigate, toast }) => {
  const [activeTab, setActiveTab] = useState('expenses'); // 'expenses' ou 'incomes'

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-800">💰 Transactions</h1>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex-1 py-3 font-medium transition-colors ${
              activeTab === 'expenses'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-600'
            }`}
          >
            💸 Dépenses
          </button>
          <button
            onClick={() => setActiveTab('incomes')}
            className={`flex-1 py-3 font-medium transition-colors ${
              activeTab === 'incomes'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-600'
            }`}
          >
            💰 Revenus
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        {activeTab === 'expenses' ? (
          <ExpensesPage onNavigate={onNavigate} toast={toast} />
        ) : (
          <IncomesPage onNavigate={onNavigate} toast={toast} />
        )}
      </div>
    </div>
  );
};

export default TransactionsPage;
