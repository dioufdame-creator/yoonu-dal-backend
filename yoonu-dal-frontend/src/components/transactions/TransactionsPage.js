import React, { useState } from 'react';
import ExpensesPage from '../control/ExpenseTracker';
import IncomesPage from '../incomes/IncomesPage';

// ==========================================
// TRANSACTIONS PAGE V7 - STYLE DASHBOARD
// Pas de header vert, juste des tabs
// Design cohérent avec Dashboard et Tontines
// ==========================================

const TransactionsPage = ({ onNavigate, toast }) => {
  const [activeTab, setActiveTab] = useState('expenses');

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Tabs directement après la barre Yoonu Dal - Pas de header vert */}
      <div className="bg-white border-b border-gray-200 sticky top-[60px] z-10">
        <div className="flex">
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
            <ExpensesPage onNavigate={onNavigate} toast={toast} />
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
