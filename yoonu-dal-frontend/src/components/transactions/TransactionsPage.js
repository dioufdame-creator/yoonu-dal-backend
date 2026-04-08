import React, { useState } from 'react';
import ExpensesPage from '../control/ExpenseTracker';
import IncomesPage from '../incomes/IncomesPage';

// ==========================================
// TRANSACTIONS PAGE V8 - STYLE TONTINES
// Texte explicatif sur fond blanc
// Design cohérent et professionnel
// ==========================================

const TransactionsPage = ({ onNavigate, toast, user }) => {
  const [activeTab, setActiveTab] = useState('expenses');

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header avec texte explicatif - Style Tontines */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex items-start gap-3">
            <span className="text-3xl sm:text-4xl">💰</span>
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Transactions
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Gérez vos dépenses et revenus en toute simplicité
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-gray-200">
          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex-1 py-3 sm:py-4 font-semibold text-sm sm:text-base transition-all relative ${
              activeTab === 'expenses'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <span className="text-lg">💸</span>
              <span>Dépenses</span>
            </span>
          </button>
          <button
            onClick={() => setActiveTab('incomes')}
            className={`flex-1 py-3 sm:py-4 font-semibold text-sm sm:text-base transition-all relative ${
              activeTab === 'incomes'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="flex items-center justify-center gap-2">
              <span className="text-lg">💰</span>
              <span>Revenus</span>
            </span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="transactions-wrapper">
        <div className="px-4 pt-4">
          {activeTab === 'expenses' ? (
            <ExpensesPage onNavigate={onNavigate} toast={toast} user={user} />
          ) : (
            <IncomesPage onNavigate={onNavigate} toast={toast} />
          )}
        </div>
      </div>

      {/* CSS pour cacher les headers des sous-pages */}
      <style jsx>{`
        /* Cache la card glassmorphism header (ExpensesPage) */
        .transactions-wrapper :global(.backdrop-blur-xl.bg-white\\/60) {
          display: none !important;
        }
        
        /* Cache le header IncomesPage */
        .transactions-wrapper :global(.mb-6:has(h1)) {
          display: none !important;
        }
        
        /* Ajuste le contenu */
        .transactions-wrapper :global(.max-w-7xl) {
          padding-top: 0 !important;
        }
        
        .transactions-wrapper :global(> div > div > *:first-child) {
          margin-top: 0 !important;
        }
      `}</style>
    </div>
  );
};

export default TransactionsPage;
